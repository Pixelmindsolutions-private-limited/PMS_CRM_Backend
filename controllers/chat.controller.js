// controllers/chat.controller.js
const { Chat, ChatMember, ChatMessage } = require("../models/Chat");
const { Staff } = require("../models/Staff");
const {
  resolveParticipant,
  findParticipantByRef,
} = require("../utils/resolveUser");
const {
  buildAttachments,
  removeUploadedFiles,
  removeAttachmentFiles,
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

const me = (req) => ({
  id: req.user._id,
  type: req.userType,
  employeeId: req.user.employeeId || null,
});

// accepts array, JSON string ('["E1","E2"]') or "E1,E2"
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

async function fullChat(chatId, myId) {
  const chat = await Chat.findById(chatId).populate("lastMessage").lean();
  const members = await S.decorateMembers([chatId]);
  const list = members[String(chatId)] || [];
  const peer =
    chat.type === "direct"
      ? list.find((m) => String(m.user) !== String(myId))?.userInfo || null
      : null;
  return {
    ...chat,
    title: chat.type === "group" ? chat.name : peer?.displayName || "Chat",
    peer,
    members: list,
  };
}

// ============================================================
// POST /api/chat/direct    body: { userId | receiverId | employeeId }
// Creates (or returns) a 1-to-1 chat
// ============================================================
exports.createDirectChat = async (req, res) => {
  try {
    const ref =
      req.body.receiverId || req.body.userId || req.body.employeeId;
    const target = await findParticipantByRef(ref);
    if (!target) throw S.httpError(404, "Target user not found");
    if (String(target._id) === String(req.user._id))
      throw S.httpError(400, "Cannot chat with yourself");

    const { chat, created } = await S.getOrCreateDirectChat(me(req), target);
    const ns = chatNs(req);
    S.joinRoom(ns, [req.user._id, target._id], chat._id);

    const data = await fullChat(chat._id, req.user._id);
    if (created) S.notifyUsers(ns, [target._id], "chat:new", data);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return fail(res, err, "createDirectChat");
  }
};

// ============================================================
// POST /api/chat/direct/send   (multipart or JSON)
// Sender = token. Receiver = body.receiverId (Mongo _id) or body.employeeId
// body: receiverId, content?, messageType?, replyTo?, files[]
// ============================================================
exports.sendDirectMessage = async (req, res) => {
  try {
    const ref = req.body.receiverId || req.body.employeeId;
    const target = await findParticipantByRef(ref);
    if (!target) throw S.httpError(404, "Receiver not found");
    if (String(target._id) === String(req.user._id))
      throw S.httpError(400, "Cannot message yourself");

    const { chat, created } = await S.getOrCreateDirectChat(me(req), target);
    const ns = chatNs(req);
    S.joinRoom(ns, [req.user._id, target._id], chat._id);

    const payload = await S.saveMessage({
      chatId: chat._id,
      senderId: req.user._id,
      senderType: req.userType,
      content: req.body.content,
      messageType: req.body.messageType,
      attachments: buildAttachments(req.files),
      replyTo: req.body.replyTo,
    });

    if (created) {
      S.notifyUsers(
        ns,
        [target._id],
        "chat:new",
        await fullChat(chat._id, target._id)
      );
    }
    ns?.to(`chat:${chat._id}`).emit("chat:message", payload);

    return res
      .status(201)
      .json({ success: true, chatId: chat._id, data: payload });
  } catch (err) {
    removeUploadedFiles(req.files);
    return fail(res, err, "sendDirectMessage");
  }
};

// ============================================================
// POST /api/chat/group   (ADMIN ONLY)
// body: { name, employeeIds: ["EMP001","EMP002"] }
// ============================================================
exports.createGroupChat = async (req, res) => {
  try {
    if (req.userType !== "admin")
      throw S.httpError(403, "Only admin can create groups");

    const name = (req.body.name || "").trim();
    if (!name) throw S.httpError(400, "Group name required");

    const ids = cleanIds(
      req.body.employeeIds || req.body.staffIds || req.body.participants
    );

    const staffDocs = ids.length
      ? await Staff.find({ employeeId: { $in: ids }, isActive: true }).select(
          "_id employeeId"
        )
      : [];
    const found = new Set(staffDocs.map((s) => s.employeeId));
    const notFound = ids.filter((id) => !found.has(id));

    const chat = await Chat.create({
      type: "group",
      name,
      createdBy: req.user._id,
      creatorType: "admin",
    });

    await S.upsertMember(chat._id, req.user._id, "admin", {
      role: "admin",
      addedBy: req.user._id,
    });
    for (const s of staffDocs) {
      await S.upsertMember(chat._id, s._id, "staff", {
        employeeId: s.employeeId,
        addedBy: req.user._id,
      });
    }

    const ns = chatNs(req);
    const memberUserIds = [req.user._id, ...staffDocs.map((s) => s._id)];
    S.joinRoom(ns, memberUserIds, chat._id);

    const data = await fullChat(chat._id, req.user._id);
    S.notifyUsers(
      ns,
      staffDocs.map((s) => s._id),
      "chat:new",
      data
    );

    return res.status(201).json({
      success: true,
      message: "Group created",
      data,
      notFound, // employeeIds that don't exist / inactive
    });
  } catch (err) {
    return fail(res, err, "createGroupChat");
  }
};

// ============================================================
// POST /api/chat/:chatId/members   (group admin)
// body: { employeeIds: [...] }
// ============================================================
exports.addMembers = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!S.isValidId(chatId)) throw S.httpError(400, "Invalid chatId");

    const chat = await Chat.findById(chatId);
    if (!chat) throw S.httpError(404, "Chat not found");
    if (chat.type !== "group") throw S.httpError(400, "Only groups");
    if (!(await S.isGroupAdmin(chat, req.user._id)))
      throw S.httpError(403, "Group admin only");

    const ids = cleanIds(req.body.employeeIds || req.body.staffIds);
    if (!ids.length) throw S.httpError(400, "employeeIds array required");

    const staffDocs = await Staff.find({
      employeeId: { $in: ids },
      isActive: true,
    }).select("_id employeeId");
    const found = new Set(staffDocs.map((s) => s.employeeId));
    const notFound = ids.filter((id) => !found.has(id));

    const existing = await ChatMember.find({
      chat: chatId,
      user: { $in: staffDocs.map((s) => s._id) },
      status: "approved",
    }).select("user");
    const existingSet = new Set(existing.map((m) => String(m.user)));

    const added = [];
    for (const s of staffDocs) {
      if (existingSet.has(String(s._id))) continue;
      await ChatMember.findOneAndUpdate(
        { chat: chatId, user: s._id },
        {
          $set: { status: "approved", role: "member", addedBy: req.user._id },
          $setOnInsert: {
            accountType: "staff",
            employeeId: s.employeeId,
            joinedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );
      added.push(s);
    }

    const ns = chatNs(req);
    const addedUserIds = added.map((s) => s._id);
    S.joinRoom(ns, addedUserIds, chatId);
    S.notifyUsers(ns, addedUserIds, "chat:new", await fullChat(chatId, req.user._id));
    ns?.to(`chat:${chatId}`).emit("chat:members-updated", {
      chatId,
      added: added.map((s) => s.employeeId),
    });

    return res.status(200).json({
      success: true,
      message: `${added.length} member(s) added`,
      added: added.map((s) => s.employeeId),
      alreadyMembers: staffDocs
        .filter((s) => existingSet.has(String(s._id)))
        .map((s) => s.employeeId),
      notFound,
    });
  } catch (err) {
    return fail(res, err, "addMembers");
  }
};

// ============================================================
// DELETE /api/chat/:chatId/members/:userRef   (group admin)
// userRef = Mongo _id OR employeeId
// ============================================================
exports.removeMember = async (req, res) => {
  try {
    const { chatId, userRef } = req.params;
    if (!S.isValidId(chatId)) throw S.httpError(400, "Invalid chatId");

    const chat = await Chat.findById(chatId);
    if (!chat) throw S.httpError(404, "Chat not found");
    if (chat.type !== "group") throw S.httpError(400, "Only groups");
    if (!(await S.isGroupAdmin(chat, req.user._id)))
      throw S.httpError(403, "Group admin only");

    const target = await findParticipantByRef(userRef);
    if (!target) throw S.httpError(404, "User not found");
    if (String(target._id) === String(req.user._id))
      throw S.httpError(400, "Cannot remove yourself — delete the group instead");

    const result = await ChatMember.deleteOne({ chat: chatId, user: target._id });
    if (!result.deletedCount) throw S.httpError(404, "User is not in this group");

    const ns = chatNs(req);
    S.notifyUsers(ns, [target._id], "chat:removed", { chatId });
    S.leaveRoom(ns, [target._id], chatId);
    ns?.to(`chat:${chatId}`).emit("chat:members-updated", {
      chatId,
      removed: [target.employeeId || String(target._id)],
    });

    return res.status(200).json({ success: true, message: "Member removed" });
  } catch (err) {
    return fail(res, err, "removeMember");
  }
};

// ============================================================
// GET /api/chat     → my chats (with unread count)
// ============================================================
exports.getMyChats = async (req, res) => {
  try {
    const myId = req.user._id;

    const memberships = await ChatMember.find({ user: myId, status: "approved" })
      .populate({ path: "chat", populate: { path: "lastMessage" } })
      .lean();

    const active = memberships.filter((m) => m.chat && m.chat.isActive);
    const membersByChat = await S.decorateMembers(active.map((m) => m.chat._id));

    const result = await Promise.all(
      active.map(async (m) => {
        const list = membersByChat[String(m.chat._id)] || [];
        const peer =
          m.chat.type === "direct"
            ? list.find((x) => String(x.user) !== String(myId))?.userInfo || null
            : null;
        const unreadCount = await ChatMessage.countDocuments({
          chat: m.chat._id,
          sender: { $ne: myId },
          readBy: { $ne: myId },
          isDeleted: false,
        });
        return {
          ...m.chat,
          title: m.chat.type === "group" ? m.chat.name : peer?.displayName || "Chat",
          peer,
          myRole: m.role,
          unreadCount,
          members: list,
        };
      })
    );

    result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return fail(res, err, "getMyChats");
  }
};

// ============================================================
// GET /api/chat/:chatId
// ============================================================
exports.getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!S.isValidId(chatId)) throw S.httpError(400, "Invalid chatId");

    const member = await S.getApprovedMember(chatId, req.user._id);
    if (!member) throw S.httpError(403, "Access denied");

    const chat = await Chat.findById(chatId);
    if (!chat) throw S.httpError(404, "Chat not found");

    const data = await fullChat(chatId, req.user._id);
    return res.status(200).json({ success: true, data: { ...data, myRole: member.role } });
  } catch (err) {
    return fail(res, err, "getChatById");
  }
};

// ============================================================
// POST /api/chat/:chatId/message   (multipart or JSON)
// body: content?, messageType? (text|sticker), replyTo?, files[]
// ============================================================
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!S.isValidId(chatId)) throw S.httpError(400, "Invalid chatId");

    const member = await S.getApprovedMember(chatId, req.user._id);
    if (!member) throw S.httpError(403, "Access denied");

    const payload = await S.saveMessage({
      chatId,
      senderId: req.user._id,
      senderType: req.userType,
      content: req.body.content,
      messageType: req.body.messageType,
      attachments: buildAttachments(req.files),
      replyTo: req.body.replyTo,
    });

    chatNs(req)?.to(`chat:${chatId}`).emit("chat:message", payload);
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
    const { chatId } = req.params;
    if (!S.isValidId(chatId)) throw S.httpError(400, "Invalid chatId");

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);

    const member = await S.getApprovedMember(chatId, req.user._id);
    if (!member) throw S.httpError(403, "Access denied");

    const filter = { chat: chatId, isDeleted: false };
    const [total, messages] = await Promise.all([
      ChatMessage.countDocuments(filter),
      ChatMessage.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const decorated = await S.decorateMessages(messages);

    await ChatMessage.updateMany(
      { chat: chatId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );
    member.lastReadAt = new Date();
    await member.save();
    chatNs(req)?.to(`chat:${chatId}`).emit("chat:read", {
      chatId,
      userId: String(req.user._id),
    });

    return res.status(200).json({
      success: true,
      data: decorated.reverse(), // oldest → newest
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
    const { chatId } = req.params;
    const member = await S.getApprovedMember(chatId, req.user._id);
    if (!member) throw S.httpError(403, "Access denied");

    await ChatMessage.updateMany(
      { chat: chatId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );
    member.lastReadAt = new Date();
    await member.save();

    chatNs(req)?.to(`chat:${chatId}`).emit("chat:read", {
      chatId,
      userId: String(req.user._id),
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    return fail(res, err, "markRead");
  }
};

// ============================================================
// DELETE /api/chat/:chatId/messages/:messageId
// Sender or group admin
// ============================================================
exports.deleteMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    if (!S.isValidId(chatId) || !S.isValidId(messageId))
      throw S.httpError(400, "Invalid ids");

    const member = await S.getApprovedMember(chatId, req.user._id);
    if (!member) throw S.httpError(403, "Access denied");

    const message = await ChatMessage.findOne({ _id: messageId, chat: chatId });
    if (!message || message.isDeleted) throw S.httpError(404, "Message not found");

    const chat = await Chat.findById(chatId);
    const mine = String(message.sender) === String(req.user._id);
    if (!mine && !(await S.isGroupAdmin(chat, req.user._id)))
      throw S.httpError(403, "You cannot delete this message");

    removeAttachmentFiles(message.attachments);
    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = "";
    message.attachments = [];
    await message.save();

    chatNs(req)?.to(`chat:${chatId}`).emit("chat:message-deleted", {
      chatId,
      messageId,
    });
    return res.status(200).json({ success: true, message: "Message deleted" });
  } catch (err) {
    return fail(res, err, "deleteMessage");
  }
};

// ============================================================
// DELETE /api/chat/:chatId   (group admin / creator)
// ============================================================
exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!S.isValidId(chatId)) throw S.httpError(400, "Invalid chatId");

    const chat = await Chat.findById(chatId);
    if (!chat) throw S.httpError(404, "Chat not found");
    if (!(await S.isGroupAdmin(chat, req.user._id)))
      throw S.httpError(403, "Group admin only");

    const members = await ChatMember.find({ chat: chatId }).select("user").lean();
    const userIds = members.map((m) => m.user);

    const withFiles = await ChatMessage.find({
      chat: chatId,
      "attachments.0": { $exists: true },
    })
      .select("attachments")
      .lean();
    withFiles.forEach((m) => removeAttachmentFiles(m.attachments));

    await ChatMessage.deleteMany({ chat: chatId });
    await ChatMember.deleteMany({ chat: chatId });
    await Chat.findByIdAndDelete(chatId);

    const ns = chatNs(req);
    S.notifyUsers(ns, userIds, "chat:deleted", { chatId });
    S.leaveRoom(ns, userIds, chatId);

    return res.status(200).json({ success: true, message: "Chat deleted" });
  } catch (err) {
    return fail(res, err, "deleteChat");
  }
};