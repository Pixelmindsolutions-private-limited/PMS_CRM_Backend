// routes/chat.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/chat.controller");
const { chatProtect } = require("../middleware/chatAuth.middleware");
const { uploadChatFiles } = require("../middleware/chatUpload");

// Every chat route needs a valid token (admin OR staff)
router.use(chatProtect);

// NOTE: fixed paths (/users, /groups, /direct, /unread-count) must stay
// ABOVE the "/:chatId" routes, otherwise they are treated as a chatId.

// ----- Helpers / lists -----
router.get("/users", ctrl.searchUsers); // ?search=
router.get("/unread-count", ctrl.getUnreadCount);
router.get("/groups", ctrl.getMyGroups);
router.get("/direct", ctrl.getMyDirectChats);
router.get("/", ctrl.getMyChats); // ?type=direct|group&search=

// ----- Direct (1-to-1) -----
router.post("/direct", ctrl.createDirectChat);
router.post("/direct/send", uploadChatFiles, ctrl.sendDirectMessage);

// ----- Group (admin creates, adds staff by employeeId) -----
router.post("/group", ctrl.createGroupChat);

// ----- Single chat -----
router.get("/:chatId", ctrl.getChatById);
router.put("/:chatId", ctrl.updateChat); // edit group name / description
router.patch("/:chatId", ctrl.updateChat);
router.delete("/:chatId", ctrl.deleteChat);

// ----- Members -----
router.get("/:chatId/members", ctrl.getChatMembers);
router.post("/:chatId/members", ctrl.addMembers);
router.delete("/:chatId/members/:userRef", ctrl.removeMember);
router.patch("/:chatId/members/:userRef/role", ctrl.setMemberRole);
router.post("/:chatId/leave", ctrl.leaveChat);

// ----- Messages (text, emoji, sticker, files) -----
router.post("/:chatId/message", uploadChatFiles, ctrl.sendMessage);
router.get("/:chatId/messages", ctrl.getMessages);
router.patch("/:chatId/read", ctrl.markRead);
router.patch("/:chatId/messages/:messageId", ctrl.editMessage);
router.delete("/:chatId/messages/:messageId", ctrl.deleteMessage);

module.exports = router;