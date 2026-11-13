// services/chat.service.js
// Logic shared by the REST controller and the Socket.IO handlers.
const mongoose = require("mongoose");
const { Chat, ChatMember, ChatMessage } = require("../models/Chat");
const { resolveParticipant } = require("../utils/resolveUser");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const makeDirectKey = (a, b) => [String(a), String(b)].sort().join("_");
const httpError = (status, message) =>
  Object.assign(new Error(message), { status });

// ---------- membership ----------
async function getApprovedMember(chatId, userId) {
  if (!isValidId(chatId) || !isValidId(userId)) return null;
  return ChatMember.findOne({ chat: chatId, user: userId, status: "approved" });
}

async function upsertMember(chatId, userId, accountType, extra = {}) {
  return ChatMember.findOneAndUpdate(
    { chat: chatId, user: userId },
    {
      $setOnInsert: {
        accountType,
        employeeId: extra.employeeId || null,
        role: extra.role || "member",
        status: "approved",
        addedBy: extra.addedBy || null,
        joinedAt: new Date(),
      },
    },
    { upsert: true, new: true }
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

// ---------- direct chat ----------
// returns { chat, created }
async function getOrCreateDirectChat(me, target) {
  const directKey = makeDirectKey(me.id, target._id);
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
      if (err.code === 11000) {
        chat = await Chat.findOne({ type: "direct", directKey }); // race
      } else throw err;
    }
  }

  await upsertMember(chat._id, me.id, me.type, {
    employeeId: me.employeeId,
    addedBy: me.id,
  });
  await upsertMember(chat._id, target._id, target.accountType, {
    employeeId: target.employeeId,
    addedBy: me.id,
  });

  return { chat, created };
}

// ---------- decorating ----------
async function decorateMembers(chatIds) {
  const all = await ChatMember.find({
    chat: { $in: chatIds },
    status: "approved",
  }).lean();

  const cache = new Map();
  const info = (m) => {
    const k = String(m.user);
    if (!cache.has(k)) cache.set(k, resolveParticipant(m.user, m.accountType));
    return cache.get(k);
  };

  const grouped = {};
  await Promise.all(
    all.map(async (m) => {
      const key = String(m.chat);
      (grouped[key] = grouped[key] || []).push({
        ...m,
        userInfo: await info(m),
      });
    })
  );
  return grouped;
}

async function decorateMessages(messages) {
  const cache = new Map();
  const info = (id, type) => {
    const k = String(id);
    if (!cache.has(k)) cache.set(k, resolveParticipant(id, type));
    return cache.get(k);
  };

  const replyIds = messages.map((m) => m.replyTo).filter(Boolean);
  const replies = replyIds.length
    ? await ChatMessage.find({ _id: { $in: replyIds } })
        .select("content messageType sender senderType attachments isDeleted")
        .lean()
    : [];
  const replyMap = new Map(replies.map((r) => [String(r._id), r]));

  return Promise.all(
    messages.map(async (m) => ({
      ...m,
      senderInfo: await info(m.sender, m.senderType),
      replyToMessage: m.replyTo ? replyMap.get(String(m.replyTo)) || null : null,
    }))
  );
}

// ---------- messages ----------
function pickMessageType(requested, attachments) {
  if (attachments.length) {
    const first = attachments[0];
    if (requested === "sticker" && first.kind === "image") return "sticker";
    return first.kind; // image | video | audio | document | file
  }
  return requested === "sticker" ? "sticker" : "text";
}

async function saveMessage({
  chatId,
  senderId,
  senderType,
  content,
  messageType,
  attachments = [],
  replyTo,
}) {
  const text = typeof content === "string" ? content.trim() : "";
  if (!text && attachments.length === 0) {
    throw httpError(400, "Message text or a file is required");
  }

  let replyId = null;
  if (replyTo) {
    if (!isValidId(replyTo)) throw httpError(400, "Invalid replyTo id");
    const exists = await ChatMessage.exists({ _id: replyTo, chat: chatId });
    if (!exists) throw httpError(404, "Replied message not found in this chat");
    replyId = replyTo;
  }

  const message = await ChatMessage.create({
    chat: chatId,
    sender: senderId,
    senderType,
    content: text,
    messageType: pickMessageType(messageType, attachments),
    attachments,
    replyTo: replyId,
    readBy: [senderId],
  });

  await Chat.updateOne({ _id: chatId }, { lastMessage: message._id });
  await ChatMember.updateOne(
    { chat: chatId, user: senderId },
    { lastReadAt: new Date() }
  );

  const [payload] = await decorateMessages([message.toObject()]);
  return payload;
}

// ---------- socket room helpers (ns = io.of("/chat")) ----------
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
  makeDirectKey,
  httpError,
  getApprovedMember,
  upsertMember,
  isGroupAdmin,
  getOrCreateDirectChat,
  decorateMembers,
  decorateMessages,
  saveMessage,
  joinRoom,
  leaveRoom,
  notifyUsers,
};