// services/chat.service.js  (shared by REST controller and Socket.IO)
const mongoose = require("mongoose");
const { Chat, ChatMember, ChatMessage } = require("../models/Chat");
const { resolveParticipant } = require("../utils/resolveUser");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const makeDirectKey = (a, b) => [String(a), String(b)].sort().join("_");
const httpError = (status, message) =>
  Object.assign(new Error(message), { status });

/**
 * Normalise any user/doc into { id, type, employeeId }.
 * type = "admin" | "staff"
 */
function toRef(x, type) {
  if (!x) throw httpError(400, "Invalid user");
  const id = x._id || x.id;
  let t = type || x.accountType || x.userType;
  if (t !== "admin" && t !== "staff") {
    t = x.employeeId ? "staff" : "admin";
  }
  return { id, type: t, employeeId: x.employeeId || null };
}

// current logged-in user from an express request
const actorFromReq = (req) => toRef(req.user, req.userType);

// ---------- membership ----------
function getApprovedMember(chatId, userId) {
  if (!isValidId(chatId) || !isValidId(userId)) return null;
  return ChatMember.findOne({ chat: chatId, user: userId, status: "approved" });
}

function upsertMember(chatId, ref, extra = {}) {
  return ChatMember.findOneAndUpdate(
    { chat: chatId, user: ref.id },
    {
      $set: { status: "approved" },
      $setOnInsert: {
        accountType: ref.type,
        employeeId: ref.employeeId || null,
        role: extra.role || "member",
        addedBy: extra.addedBy || null,
        joinedAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function isGroupAdmin(chat, userId) {
  if (String(chat.createdBy) === String(userId)) return true;
  const m = await ChatMember.findOne({
    chat: chat._id,
    user: userId,
    role: "admin",
    status: "approved",
  });
  return !!m;
}

// ---------- direct chat → { chat, created } ----------
async function getOrCreateDirectChat(me, target) {
  const directKey = makeDirectKey(me.id, target.id);
  let chat = await Chat.findOne({ type: "direct", directKey });
  let created = false;

  if (!chat) {
    try {
      chat = await Chat.create({
        type: "direct",
        directKey,
        createdBy: me.id,
        creatorType: me.type,
      });
      created = true;
    } catch (err) {
      if (err.code !== 11000) throw err;
      chat = await Chat.findOne({ type: "direct", directKey }); // race
    }
  }

  await upsertMember(chat._id, me, { addedBy: me.id });
  await upsertMember(chat._id, target, { addedBy: me.id });
  return { chat, created };
}

// ---------- attachment urls ----------
function withBase(message, base) {
  if (!message || !base || !message.attachments || !message.attachments.length)
    return message;
  return {
    ...message,
    attachments: message.attachments.map((a) => ({
      ...a,
      url: base + String(a.url || "").replace(/^https?:\/\/[^/]+/i, ""),
    })),
  };
}

// ---------- decorating ----------
function makeInfoLookup() {
  const cache = new Map();
  return (id, type) => {
    const k = `${type || "any"}:${String(id)}`;
    if (!cache.has(k)) cache.set(k, resolveParticipant(id, type));
    return cache.get(k);
  };
}

// { chatId: [ {...member, userInfo} ] }
async function decorateMembers(chatIds) {
  const all = await ChatMember.find({
    chat: { $in: chatIds },
    status: "approved",
  }).lean();

  const info = makeInfoLookup();
  const grouped = {};
  const decorated = await Promise.all(
    all.map(async (m) => ({
      ...m,
      userInfo: await info(m.user, m.accountType),
    }))
  );
  for (const m of decorated) {
    const key = String(m.chat);
    (grouped[key] = grouped[key] || []).push(m);
  }
  return grouped;
}

async function decorateMessages(messages, base) {
  const info = makeInfoLookup();

  // reply previews
  const replyIds = [
    ...new Set(messages.map((m) => m.replyTo && String(m.replyTo)).filter(Boolean)),
  ];
  const replyDocs = replyIds.length
    ? await ChatMessage.find({ _id: { $in: replyIds } })
        .select("sender senderType content messageType isDeleted attachments")
        .lean()
    : [];
  const replyMap = new Map(replyDocs.map((r) => [String(r._id), r]));

  return Promise.all(
    messages.map(async (m) => {
      const reply = m.replyTo ? replyMap.get(String(m.replyTo)) : null;
      return {
        ...withBase(m, base),
        senderInfo: await info(m.sender, m.senderType),
        replyToMessage: reply
          ? {
              _id: reply._id,
              sender: reply.sender,
              messageType: reply.messageType,
              content: reply.isDeleted ? "" : reply.content,
              isDeleted: !!reply.isDeleted,
            }
          : null,
      };
    })
  );
}

/**
 * Turns lean chat docs (lastMessage populated) into API-ready chats:
 * members, myRole, unreadCount, title (other person's name for direct chats).
 */
async function buildChatViews(chats, viewerId, base) {
  if (!chats.length) return [];
  const ids = chats.map((c) => c._id);
  const membersByChat = await decorateMembers(ids);

  const mine = await ChatMember.find({ chat: { $in: ids }, user: viewerId })
    .select("chat role")
    .lean();
  const roleByChat = new Map(mine.map((m) => [String(m.chat), m.role]));

  const unread = await Promise.all(
    ids.map((id) =>
      ChatMessage.countDocuments({
        chat: id,
        isDeleted: false,
        sender: { $ne: viewerId },
        readBy: { $ne: viewerId },
      })
    )
  );

  return chats.map((c, i) => {
    const members = membersByChat[String(c._id)] || [];
    let title = c.name || "";
    let otherUser = null;
    if (c.type === "direct") {
      const other = members.find((m) => String(m.user) !== String(viewerId));
      otherUser = other ? other.userInfo : null;
      title = (otherUser && otherUser.displayName) || "Chat";
    }
    return {
      ...c,
      title,
      otherUser,
      lastMessage: withBase(c.lastMessage, base),
      myRole: roleByChat.get(String(c._id)) || null,
      unreadCount: unread[i],
      members,
    };
  });
}

async function getChatView(chatId, viewerId, base) {
  const chat = await Chat.findById(chatId).populate("lastMessage").lean();
  if (!chat) throw httpError(404, "Chat not found");
  const [view] = await buildChatViews([chat], viewerId, base);
  return view;
}

// ---------- messages ----------
function typeFromAttachment(a) {
  const mime = a.mimeType || "";
  const name = a.fileName || "";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (
    /pdf|msword|officedocument|ms-excel|ms-powerpoint|^text\/|opendocument/.test(
      mime
    ) ||
    /\.(pdf|docx?|xlsx?|pptx?|txt|csv|rtf)$/i.test(name)
  ) {
    return "document";
  }
  return "file";
}

function pickMessageType(requested, attachments) {
  if (attachments.length) {
    const type = typeFromAttachment(attachments[0]);
    return requested === "sticker" && type === "image" ? "sticker" : type;
  }
  return requested === "sticker" ? "sticker" : "text";
}

/**
 * sender = { id, type, employeeId }  (see toRef)
 */
async function saveMessage({
  chatId,
  sender,
  content,
  messageType,
  attachments = [],
  replyTo,
  baseUrl,
}) {
  if (!sender || !sender.id || !sender.type) {
    throw httpError(400, "Sender is required");
  }

  const text = typeof content === "string" ? content.trim() : "";
  if (!text && attachments.length === 0) {
    throw httpError(400, "Message text or a file is required");
  }

  let replyToId = null;
  if (replyTo) {
    if (!isValidId(replyTo)) throw httpError(400, "Invalid replyTo");
    const exists = await ChatMessage.exists({ _id: replyTo, chat: chatId });
    if (!exists) throw httpError(404, "Reply target not found in this chat");
    replyToId = replyTo;
  }

  const files = attachments.map((a) => ({ ...a, kind: typeFromAttachment(a) }));

  const message = await ChatMessage.create({
    chat: chatId,
    sender: sender.id,
    senderType: sender.type,
    content: text,
    messageType: pickMessageType(messageType, files),
    attachments: files,
    replyTo: replyToId,
    readBy: [sender.id],
  });

  await Chat.updateOne({ _id: chatId }, { lastMessage: message._id });
  await ChatMember.updateOne(
    { chat: chatId, user: sender.id },
    { lastReadAt: new Date() }
  );

  const [payload] = await decorateMessages([message.toObject()], baseUrl);
  return payload;
}

// ---------- socket helpers (ns = io.of("/chat")) ----------
function joinRoom(ns, userIds, chatId) {
  if (!ns) return;
  for (const id of userIds) ns.in(`user:${id}`).socketsJoin(`chat:${chatId}`);
}
function leaveRoom(ns, userIds, chatId) {
  if (!ns) return;
  for (const id of userIds) ns.in(`user:${id}`).socketsLeave(`chat:${chatId}`);
}
function notifyUsers(ns, userIds, event, data) {
  if (!ns) return;
  for (const id of userIds) ns.to(`user:${id}`).emit(event, data);
}

module.exports = {
  isValidId,
  httpError,
  toRef,
  actorFromReq,
  getApprovedMember,
  upsertMember,
  isGroupAdmin,
  getOrCreateDirectChat,
  decorateMembers,
  decorateMessages,
  buildChatViews,
  getChatView,
  withBase,
  saveMessage,
  joinRoom,
  leaveRoom,
  notifyUsers,
};