// sockets/chat.socket.js
// Namespace: /chat      Auth: token in handshake (auth.token or Bearer header)
const { ChatMember, ChatMessage } = require("../models/Chat");
const {
  resolveTokenUser,
  findParticipantByRef,
} = require("../utils/resolveUser");
const S = require("../services/chat.service");

function socketBaseUrl(socket) {
  const h = socket.handshake.headers || {};
  const first = (v) => String(v || "").split(",")[0].trim();
  const host = first(h["x-forwarded-host"]) || first(h.host);
  if (!host) return process.env.BASE_URL || "";
  const proto = first(h["x-forwarded-proto"]) || "http";
  return `${proto}://${host}`;
}

function initializeChat(io) {
  const chatNs = io.of("/chat");

  // ---------- AUTH ----------
  chatNs.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");
      const { user, type } = await resolveTokenUser(token);
      socket.user = user;
      socket.userType = type;
      next();
    } catch (err) {
      next(new Error("Unauthorized: " + err.message));
    }
  });

  chatNs.on("connection", async (socket) => {
    const userId = String(socket.user._id);
    const userType = socket.userType;
    const me = S.toRef(socket.user, userType);
    console.log(`💬 [chat] connected user=${userId} type=${userType}`);

    // personal room + every chat I belong to
    socket.join(`user:${userId}`);
    try {
      const memberships = await ChatMember.find({
        user: userId,
        status: "approved",
      })
        .select("chat")
        .lean();
      memberships.forEach((m) => socket.join(`chat:${m.chat}`));
      socket.emit("chat:ready", {
        userId,
        userType,
        chats: memberships.map((m) => String(m.chat)),
      });
    } catch (err) {
      console.error("chat auto-join error:", err.message);
    }

    // ---------- JOIN / LEAVE ----------
    socket.on("chat:join", async ({ chatId } = {}, ack) => {
      try {
        const m = await S.getApprovedMember(chatId, userId);
        if (!m) return ack?.({ success: false, message: "Access denied" });
        socket.join(`chat:${chatId}`);
        ack?.({ success: true, chatId });
      } catch (err) {
        ack?.({ success: false, message: err.message });
      }
    });

    socket.on("chat:leave", ({ chatId } = {}) => {
      if (chatId) socket.leave(`chat:${chatId}`);
    });

    // ---------- SEND (text / emoji / sticker) ----------
    // Existing chat : { chatId, content, messageType?, replyTo? }
    // New 1-to-1    : { receiverId | employeeId, content, ... }
    // Files go through the HTTP upload endpoints
    socket.on("chat:send", async (data = {}, ack) => {
      try {
        let chatId = data.chatId;

        if (!chatId && (data.receiverId || data.employeeId)) {
          const found = await findParticipantByRef(
            data.receiverId || data.employeeId
          );
          if (!found) return ack?.({ success: false, message: "Receiver not found" });
          const target = S.toRef(found);
          if (String(target.id) === userId)
            return ack?.({ success: false, message: "Cannot message yourself" });

          const { chat, created } = await S.getOrCreateDirectChat(me, target);
          chatId = String(chat._id);
          S.joinRoom(chatNs, [userId, String(target.id)], chatId);

          if (created) {
            const view = await S.getChatView(chatId, target.id, socketBaseUrl(socket));
            S.notifyUsers(chatNs, [target.id], "chat:new", view);
          }
        }

        const m = await S.getApprovedMember(chatId, userId);
        if (!m) return ack?.({ success: false, message: "Access denied" });

        const payload = await S.saveMessage({
          chatId,
          sender: me,
          content: data.content,
          messageType: data.messageType,
          replyTo: data.replyTo,
          baseUrl: socketBaseUrl(socket),
        });

        chatNs.to(`chat:${chatId}`).emit("chat:message", payload);
        ack?.({ success: true, data: payload });
      } catch (err) {
        console.error("chat:send error:", err.message);
        ack?.({ success: false, message: err.message });
      }
    });

    // ---------- TYPING ----------
    socket.on("chat:typing", async ({ chatId, isTyping } = {}) => {
      try {
        const m = await S.getApprovedMember(chatId, userId);
        if (!m) return;
        socket.to(`chat:${chatId}`).emit("chat:typing", {
          chatId,
          userId,
          userType,
          name: socket.user.employeeName || socket.user.name || "",
          isTyping: !!isTyping,
        });
      } catch (err) {
        /* ignore */
      }
    });

    // ---------- READ RECEIPT ----------
    socket.on("chat:read", async ({ chatId } = {}, ack) => {
      try {
        const m = await S.getApprovedMember(chatId, userId);
        if (!m) return ack?.({ success: false, message: "Access denied" });
        await ChatMessage.updateMany(
          { chat: chatId, readBy: { $ne: userId } },
          { $addToSet: { readBy: userId } }
        );
        m.lastReadAt = new Date();
        await m.save();
        chatNs.to(`chat:${chatId}`).emit("chat:read", { chatId, userId });
        ack?.({ success: true });
      } catch (err) {
        console.error("chat:read error:", err.message);
        ack?.({ success: false, message: err.message });
      }
    });

    socket.on("disconnect", () => {
      console.log(`💬 [chat] disconnected user=${userId}`);
    });
  });

  return chatNs;
}

module.exports = initializeChat;