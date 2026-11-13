// controllers/chat.controller.js
const { Chat, ChatMember, ChatMessage } = require("../models/Chat");
const { Staff } = require("../models/Staff");
const { findParticipantByRef } = require("../utils/resolveUser");
const {
  buildAttachments,
  removeUploadedFiles,
  removeAttachmentFiles,
  getBaseUrl,
} = require("../middleware/chatUpload");
const S = require("../services/chat.service");

const chatNs = (req) => {
  const io = req.app.get("io");
  return io ? io.of("/chat") : null;
};

const fail = (res, err, label) => {
  console.error(`${label}:`, err);
  return res
    .status(err.status || 500)
    .json({ success: false, message: err.message });
};

// accepts array, JSON string or "A,B"
const toArray = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      /* not JSON */
    }
    return v.split(",");
  }
  return [];
};
const cleanIds = (v) => [
  ...new Set(toArray(v).map((x) => String(x).trim()).filter(Boolean)),
];
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Looks up staff by employeeId. Throws 400 if any id is unknown/inactive.
async function staffFromEmployeeIds(ids) {
  const docs = ids.length
    ? await Staff.find({ employeeId: { $in: ids }, isActive: true }).select(
        "_id employeeId"
      )
    : [];
  const found = new Set(docs.map((s) => s.employeeId));
  const missing = ids.filter((id) => !found.has(id));
  if (missing.length) {
    throw S.httpError(400, `Staff not found or inactive: ${missing.join(", ")}`);
  }
  return docs;
}
const staffRef = (s) => ({ id: s._id, type: "staff", employeeId: s.employeeId });

// loads chat + checks caller is an approved member. Returns { chat, member }
async function loadChatAsMember(chatId, userId) {
  if (!S.isValidId(chatId)) throw S.httpError(400, "Invalid chatId");
  const chat = await Chat.findById(chatId);
  if (!chat) throw S.httpError(404, "Chat not found");
  const member = await S.getApprovedMember(chatId, userId);
  if (!member) throw S.httpError(403, "Access denied");
  return { chat, member };
}

// loads a GROUP chat and checks caller is group admin
async function loadGroupAsAdmin(chatId, userId) {
  if (!S.isValidId(chatId)) throw S.httpError(400, "Invalid chatId");
  const chat = await Chat.findById(chatId);
  if (!chat) throw S.httpError(404, "Chat not found");
  if (chat.type !== "group") throw S.httpError(400, "Only groups");
  if (!(await S.isGroupAdmin(chat, userId)))
    throw S.httpError(403, "Group admin only");
  return chat;
}

const memberUserIds = async (chatId) =>
  (await ChatMember.find({ chat: chatId }).select("user").lean()).map(
    (m) => m.user
  );

// ============================================================
// GET /api/chat/users?search=   (people you can start a chat with)
// ============================================================
exports.searchUsers = async (req, res) => {
  try {
    const me = S.actorFromReq(req);
    const q = String(req.query.search || "").trim();
    const filter = { isActive: true, _id: { $ne: me.id } };
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ employeeName: rx }, { employeeId: rx }];
    }
    const staff = await Staff.find(filter)
      .select("_id employeeName employeeId email role profileImage")
      .sort({ employeeName: 1 })
      .limit(50)
      .lean();
    return res.status(200).json({
      success: true,
      data: staff.map((s) => ({
        ...s,
        accountType: "staff",
        displayName: s.employeeName,
      })),
    });
  } catch (err) {
    return fail(res, err, "searchUsers");
  }
};

// ============================================================
// POST /api/chat/direct   body: { receiverId | employeeId }
// ============================================================
exports.createDirectChat = async (req, res) => {
  try {
    const me = S.actorFromReq(req);
    const found = await findParticipantByRef(
      req.body.receiverId || req.body.userId || req.body.employeeId
    );
    if (!found) throw S.httpError(404, "Target user not found");
    const target = S.toRef(found);
    if (String(target.id) === String(me.id))
      throw S.httpError(400, "Cannot chat with yourself");

    const { chat, created } = await S.getOrCreateDirectChat(me, target);
    const ns = chatNs(req);
    S.joinRoom(ns, [me.id, target.id], chat._id);

    const data = await S.getChatView(chat._id, me.id, getBaseUrl(req));
    if (created) {
      const forTarget = await S.getChatView(chat._id, target.id, getBaseUrl(req));
      S.notifyUsers(ns, [target.id], "chat:new", forTarget);
    }
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err, "createDirectChat");
  }
};

// ============================================================
// POST /api/chat/direct/send   (JSON or multipart)
// body: employeeId | receiverId, content?, messageType?, replyTo?, files[]
// ============================================================
exports.sendDirectMessage = async (req, res) => {
  try {
    const me = S.actorFromReq(req);
    const found = await findParticipantByRef(
      req.body.receiverId || req.body.employeeId
    );
    if (!found) throw S.httpError(404, "Receiver not found");
    const target = S.toRef(found);
    if (String(target.id) === String(me.id))
      throw S.httpError(400, "Cannot message yourself");

    const { chat, created } = await S.getOrCreateDirectChat(me, target);
    const ns = chatNs(req);
    S.joinRoom(ns, [me.id, target.id], chat._id);

    const payload = await S.saveMessage({
      chatId: chat._id,
      sender: me,
      content: req.body.content,
      messageType: req.body.messageType,
      replyTo: req.body.replyTo,
      attachments: buildAttachments(req.files),
      baseUrl: getBaseUrl(req),
    });

    if (created) {
      const forTarget = await S.getChatView(chat._id, target.id, getBaseUrl(req));
      S.notifyUsers(ns, [target.id], "chat:new", forTarget);
    }
    ns?.to(`chat:${chat._id}`).emit("chat:message", payload);

    return res.status(201).json({ success: true, data: payload });
  } catch (err) {
    removeUploadedFiles(req.files);
    return fail(res, err, "sendDirectMessage");
  }
};

// ============================================================
// POST /api/chat/group   (ADMIN ONLY)
// body: { name, description?, employeeIds: ["PMS0807", ...] }
// ============================================================
exports.createGroupChat = async (req, res) => {
  try {
    const me = S.actorFromReq(req);
    if (me.type !== "admin")
      throw S.httpError(403, "Only admin can create groups");

    const name = String(req.body.name || "").trim();
    if (!name) throw S.httpError(400, "Group name required");

    const staffDocs = await staffFromEmployeeIds(cleanIds(req.body.employeeIds));

    const chat = await Chat.create({
      type: "group",
      name,
      description: String(req.body.description || "").trim(),
      createdBy: me.id,
      creatorType: me.type,
    });

    await S.upsertMember(chat._id, me, { role: "admin", addedBy: me.id });
    for (const s of staffDocs) {
      await S.upsertMember(chat._id, staffRef(s), { addedBy: me.id });
    }

    const ns = chatNs(req);
    const staffIds = staffDocs.map((s) => s._id);
    S.joinRoom(ns, [me.id, ...staffIds], chat._id);

    const base = getBaseUrl(req);
    const data = await S.getChatView(chat._id, me.id, base);
    for (const id of staffIds) {
      S.notifyUsers(ns, [id], "chat:new", await S.getChatView(chat._id, id, base));
    }

    return res
      .status(201)
      .json({ success: true, message: "Group created", data });
  } catch (err) {
    return fail(res, err, "createGroupChat");
  }
};

// ============================================================
// PUT|PATCH /api/chat/:chatId   (group admin)   body: { name?, description? }
// ============================================================
exports.updateChat = async (req, res) => {
  try {
    const me = S.actorFromReq(req);
    const chat = await loadGroupAsAdmin(req.params.chatId, me.id);

    const { name, description } = req.body;
    if (name === undefined && description === undefined)
      throw S.httpError(400, "Nothing to update (send name and/or description)");

    if (name !== undefined) {
      const n = String(name).trim();
      if (!n) throw S.httpError(400, "Group name cannot be empty");
      chat.name = n;
    }
    if (description !== undefined) chat.description = String(description).trim();
    await chat.save();

    const ns = chatNs(req);
    const payload = {
      chatId: String(chat._id),
      name: chat.name,
      description: chat.description,
      updatedBy: String(me.id),
    };
    ns?.to(`chat:${chat._id}`).emit("chat:updated", payload);

    const data = await S.getChatView(chat._id, me.id, getBaseUrl(req));
    return res.status(200).json({ success: true, message: "Chat updated", data });
  } catch (err) {
    return fail(res, err, "updateChat");
  }
};

// ============================================================
// POST /api/chat/:chatId/members   (group admin)  body: { employeeIds }
// ============================================================
exports.addMembers = async (req, res) => {
  try {
    const me = S.actorFromReq(req);
    const chat = await loadGroupAsAdmin(req.params.chatId, me.id);

    const ids = cleanIds(req.body.employeeIds);
    if (!ids.length) throw S.httpError(400, "employeeIds array required");
    const staffDocs = await staffFromEmployeeIds(ids);

    const already = new Set(
      (
        await ChatMember.find({
          chat: chat._id,
          user: { $in: staffDocs.map((s) => s._id) },
          status: "approved",
        })
          .select("user")
          .lean()
      ).map((m) => String(m.user))
    );

    for (const s of staffDocs) {
      await S.upsertMember(chat._id, staffRef(s), { addedBy: me.id });
    }

    const ns = chatNs(req);
    const newIds = staffDocs
      .map((s) => s._id)
      .filter((id) => !already.has(String(id)));
    S.joinRoom(ns, newIds, chat._id);

    const base = getBaseUrl(req);
    for (const id of newIds) {
      S.notifyUsers(ns, [id], "chat:new", await S.getChatView(chat._id, id, base));
    }
    ns?.to(`chat:${chat._id}`).emit("chat:members-added", {
      chatId: String(chat._id),
      userIds: newIds.map(String),
    });

    return res.status(200).json({
      success: true,
      message: "Members added",
      data: await S.getChatView(chat._id, me.id, base),
    });
  } catch (err) {
    return fail(res, err, "addMembers");
  }
};

// ============================================================
// DELETE /api/chat/:chatId/members/:userRef  (group admin)
// userRef = Mongo _id or employeeId
// ============================================================
exports.removeMember = async (req, res) => {
  try {
    const me = S.actorFromReq(req);
    const chat = await loadGroupAsAdmin(req.params.chatId, me.id);

    const found = await findParticipantByRef(req.params.userRef);
    if (!found) throw S.httpError(404, "User not found");
    const target = S.toRef(found);

    if (String(target.id) === String(me.id))
      throw S.httpError(400, "Cannot remove yourself — use leave instead");
    if (String(target.id) === String(chat.createdBy))
      throw S.httpError(400, "Cannot remove the group creator");

    const result = await ChatMember.deleteOne({
      chat: chat._id,
      user: target.id,
    });
    if (!result.deletedCount) throw S.httpError(404, "User is not in this group");

    const ns = chatNs(req);
    S.notifyUsers(ns, [target.id], "chat:removed", { chatId: String(chat._id) });
    S.leaveRoom(ns, [target.id], chat._id);
    ns?.to(`chat:${chat._id}`).emit("chat:member-removed", {
      chatId: String(chat._id),
      userId: String(target.id),
    });

    return res.status(200).json({ success: true, message: "Member removed" });
  } catch (err) {
    return fail(res, err, "removeMember");
  }
};

// ============================================================
// PATCH /api/chat/:chatId/members/:userRef/role  (group admin)
// body: { role: "admin" | "member" }
// ============================================================
exports.setMemberRole = async (req, res) => {
  try {
    const me = S.actorFromReq(req);
    const chat = await loadGroupAsAdmin(req.params.chatId, me.id);

    const role = req.body.role;
    if (!["admin", "member"].includes(role))
      throw S.httpError(400, 'role must be "admin" or "member"');

    const found = await findParticipantByRef(req.params.userRef);
    if (!found) throw S.httpError(404, "User not found");
    const target = S.toRef(found);

    if (role === "member" && String(target.id) === String(chat.createdBy))
      throw S.httpError(400, "Cannot demote the group creator");

    const updated = await ChatMember.findOneAndUpdate(
      { chat: chat._id, user: target.id, status: "approved" },
      { $set: { role } },
      { new: true }
    );
    if (!updated) throw S.httpError(404, "User is not in this group");

    chatNs(req)?.to(`chat:${chat._id}`).emit("chat:member-role", {
      chatId: String(chat._id),
      userId: String(target.id),
      role,
    });
    return res.status(200).json({ success: true, message: "Role updated" });
  } catch (err) {
    return fail(res, err, "setMemberRole");
  }
};

// ============================================================
// POST /api/chat/:chatId/leave   (group member)
// ============================================================
exports.leaveChat = async (req, res) => {
  try {
    const me = S.actorFromReq(req);
    const { chat, member } = await loadChatAsMember(req.params.chatId, me.id);
    if (chat.type !== "group") throw S.httpError(400, "Only groups can be left");

    if (member.role === "admin" || String(chat.createdBy) === String(me.id)) {
      const otherAdmins = await ChatMember.countDocuments({
        chat: chat._id,
        user: { $ne: me.id },
        role: "admin",
        status: "approved",
      });
      const others = await ChatMember.countDocuments({
        chat: chat._id,
        user: { $ne: me.id },
        status: "approved",
      });
      if (others > 0 && otherAdmins === 0)
        throw S.httpError(
          400,
          "Make another member admin before leaving, or delete the group"
        );
    }

    await ChatMember.deleteOne({ chat: chat._id, user: me.id });

    const ns = chatNs(req);
    S.leaveRoom(ns, [me.id], chat._id);
    ns?.to(`chat:${chat._id}`).emit("chat:member-removed", {
      chatId: String(chat._id),
      userId: String(me.id),
    });
    return res.status(200).json({ success: true, message: "You left the group" });
  } catch (err) {
    return fail(res, err, "leaveChat");
  }
};

// ============================================================
// GET /api/chat            all my chats      (?type=direct|group&search=)
// GET /api/chat/groups     my groups
// GET /api/chat/direct     my 1-to-1 chats
// ============================================================
const listChats = (forcedType) => async (req, res) => {
  try {
    const me = S.actorFromReq(req);
    const type = forcedType || req.query.type;
    const search = String(req.query.search || "").trim().toLowerCase();

    const memberships = await ChatMember.find({
      user: me.id,
      status: "approved",
    })
      .populate({ path: "chat", populate: { path: "lastMessage" } })
      .lean();

    let chats = memberships
      .map((m) => m.chat)
      .filter((c) => c && c.isActive && (!type || c.type === type));

    let data = await S.buildChatViews(chats, me.id, getBaseUrl(req));

    if (search) {
      data = data.filter((c) => (c.title || "").toLowerCase().includes(search));
    }

    data.sort(
      (a, b) =>
        new Date(b.lastMessage?.createdAt || b.updatedAt) -
        new Date(a.lastMessage?.createdAt || a.updatedAt)
    );

    return res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    return fail(res, err, "listChats");
  }
};
exports.getMyChats = listChats(null);
exports.getMyGroups = listChats("group");
exports.getMyDirectChats = listChats("direct");

// ============================================================
// GET /api/chat/unread-count
// ============================================================
exports.getUnreadCount = async (req, res) => {
  try {
    const me = S.actorFromReq(req);
    const memberships = await ChatMember.find({
      user: me.id,
      status: "approved",
    })
      .select("chat")
      .lean();
    const chatIds = memberships.map((m) => m.chat);

    const total = await ChatMessage.countDocuments({
      chat: { $in: chatIds },
      isDeleted: false,
      sender: { $ne: me.id },
      readBy: { $ne: me.id },
    });
    return res.status(200).json({ success: true, data: { unreadCount: total } });
  } catch (err) {
    return fail(res, err, "getUnreadCount");
  }
};

// ============================================================
// GET /api/chat/:chatId
// ============================================================
exports.getChatById = async (req, res) => {
  try {
    const me = S.actorFromReq(req);
    await loadChatAsMember(req.params.chatId, me.id);
    const data = await S.getChatView(req.params.chatId, me.id, getBaseUrl(req));
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err, "getChatById");
  }
};

// ============================================================
// GET /api/chat/:chatId/members
// ============================================================
exports.getChatMembers = async (req, res) => {
  try {
    const me = S.actorFromReq(req);
    const { chat } = await loadChatAsMember(req.params.chatId, me.id);
    const grouped = await S.decorateMembers([chat._id]);
    const data = grouped[String(chat._id)] || [];
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    return fail(res, err, "getChatMembers");
  }
};

// ============================================================
// POST /api/chat/:chatId/message   (JSON or multipart)
// body: content?, messageType?, replyTo?, files[]
// ============================================================
exports.sendMessage = async (req, res) => {
  try {
    const me = S.actorFromReq(req);
    const { chat } = await loadChatAsMember(req.params.chatId, me.id);

    const payload = await S.saveMessage({
      chatId: chat._id,
      sender: me,
      content: req.body.content,
      messageType: req.body.messageType,
      replyTo: req.body.replyTo,
      attachments: buildAttachments(req.files),
      baseUrl: getBaseUrl(req),
    });

    chatNs(req)?.to(`chat:${chat._id}`).emit("chat:message", payload);
    return res.status(201).json({ success: true, data: payload });
  } catch (err) {
    removeUploadedFiles(req.files);
    return fail(res, err, "sendMessage");
  }
};

// ============================================================
// GET /api/chat/:chatId/messages?page=1&limit=50
// ============================================================
exports.getMessages = async (req, res) => {
  try {
    const me = S.actorFromReq(req);
    const { chat, member } = await loadChatAsMember(req.params.chatId, me.id);

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);

    const filter = { chat: chat._id, isDeleted: false };
    const [messages, total] = await Promise.all([
      ChatMessage.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ChatMessage.countDocuments(filter),
    ]);

    const decorated = await S.decorateMessages(messages, getBaseUrl(req));

    await ChatMessage.updateMany(
      { chat: chat._id, readBy: { $ne: me.id } },
      { $addToSet: { readBy: me.id } }
    );
    member.lastReadAt = new Date();
    await member.save();

    return res.status(200).json({
      success: true,
      data: decorated.reverse(),
      page,
      limit,
      total,
      hasMore: page * limit < total,
    });
  } catch (err) {
    return fail(res, err, "getMessages");
  }
};

// ============================================================
// PATCH /api/chat/:chatId/read
// ============================================================
exports.markRead = async (req, res) => {
  try {
    const me = S.actorFromReq(req);
    const { chat, member } = await loadChatAsMember(req.params.chatId, me.id);

    await ChatMessage.updateMany(
      { chat: chat._id, readBy: { $ne: me.id } },
      { $addToSet: { readBy: me.id } }
    );
    member.lastReadAt = new Date();
    await member.save();

    chatNs(req)?.to(`chat:${chat._id}`).emit("chat:read", {
      chatId: String(chat._id),
      userId: String(me.id),
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    return fail(res, err, "markRead");
  }
};

// ============================================================
// PATCH /api/chat/:chatId/messages/:messageId   body: { content }
// Only the sender can edit (text part of the message)
// ============================================================
exports.editMessage = async (req, res) => {
  try {
    const me = S.actorFromReq(req);
    const { chatId, messageId } = req.params;
    if (!S.isValidId(messageId)) throw S.httpError(400, "Invalid messageId");
    const { chat } = await loadChatAsMember(chatId, me.id);

    const message = await ChatMessage.findOne({ _id: messageId, chat: chat._id });
    if (!message || message.isDeleted) throw S.httpError(404, "Message not found");
    if (String(message.sender) !== String(me.id))
      throw S.httpError(403, "You can edit only your own messages");

    const text = typeof req.body.content === "string" ? req.body.content.trim() : "";
    if (!text && message.attachments.length === 0)
      throw S.httpError(400, "content is required");

    message.content = text;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const [payload] = await S.decorateMessages(
      [message.toObject()],
      getBaseUrl(req)
    );
    chatNs(req)?.to(`chat:${chat._id}`).emit("chat:message-edited", payload);
    return res.status(200).json({ success: true, data: payload });
  } catch (err) {
    return fail(res, err, "editMessage");
  }
};

// ============================================================
// DELETE /api/chat/:chatId/messages/:messageId
// Sender or group admin
// ============================================================
exports.deleteMessage = async (req, res) => {
  try {
    const me = S.actorFromReq(req);
    const { chatId, messageId } = req.params;
    if (!S.isValidId(messageId)) throw S.httpError(400, "Invalid messageId");
    const { chat } = await loadChatAsMember(chatId, me.id);

    const message = await ChatMessage.findOne({ _id: messageId, chat: chat._id });
    if (!message || message.isDeleted) throw S.httpError(404, "Message not found");

    const mine = String(message.sender) === String(me.id);
    const adminOfGroup =
      chat.type === "group" && (await S.isGroupAdmin(chat, me.id));
    if (!mine && !adminOfGroup)
      throw S.httpError(403, "You cannot delete this message");

    removeAttachmentFiles(message.attachments);
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = "";
    message.attachments = [];
    await message.save();

    chatNs(req)?.to(`chat:${chat._id}`).emit("chat:message-deleted", {
      chatId: String(chat._id),
      messageId: String(message._id),
    });
    return res.status(200).json({ success: true, message: "Message deleted" });
  } catch (err) {
    return fail(res, err, "deleteMessage");
  }
};

// ============================================================
// DELETE /api/chat/:chatId
// group → group admin only | direct → either participant
// ============================================================
exports.deleteChat = async (req, res) => {
  try {
    const me = S.actorFromReq(req);
    const { chat } = await loadChatAsMember(req.params.chatId, me.id).catch(
      async (err) => {
        // creator/admin who is no longer a member may still delete their group
        if (err.status === 403) {
          const c = await Chat.findById(req.params.chatId);
          if (c && c.type === "group" && (await S.isGroupAdmin(c, me.id)))
            return { chat: c };
        }
        throw err;
      }
    );

    if (chat.type === "group" && !(await S.isGroupAdmin(chat, me.id)))
      throw S.httpError(403, "Group admin only");

    const userIds = await memberUserIds(chat._id);

    const withFiles = await ChatMessage.find({
      chat: chat._id,
      "attachments.0": { $exists: true },
    })
      .select("attachments")
      .lean();
    withFiles.forEach((m) => removeAttachmentFiles(m.attachments));

    await ChatMessage.deleteMany({ chat: chat._id });
    await ChatMember.deleteMany({ chat: chat._id });
    await Chat.findByIdAndDelete(chat._id);

    const ns = chatNs(req);
    S.notifyUsers(ns, userIds, "chat:deleted", { chatId: String(chat._id) });
    S.leaveRoom(ns, userIds, chat._id);

    return res.status(200).json({ success: true, message: "Chat deleted" });
  } catch (err) {
    return fail(res, err, "deleteChat");
  }
};