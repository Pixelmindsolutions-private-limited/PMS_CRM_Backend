// routes/chat.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/chat.controller");
const { chatProtect } = require("../middleware/chatAuth.middleware");
const { uploadChatFiles } = require("../middleware/chatUpload");

// Every chat route needs a valid token (admin OR staff)
router.use(chatProtect);

// ----- Direct (1-to-1) -----
router.post("/direct", ctrl.createDirectChat);
router.post("/direct/send", uploadChatFiles, ctrl.sendDirectMessage);

// ----- Group (admin creates, adds staff by employeeId) -----
router.post("/group", ctrl.createGroupChat);
router.post("/:chatId/members", ctrl.addMembers);
router.delete("/:chatId/members/:userRef", ctrl.removeMember);

// ----- Listing -----
router.get("/", ctrl.getMyChats);
router.get("/:chatId", ctrl.getChatById);

// ----- Messages (text, emoji, sticker, files) -----
router.post("/:chatId/message", uploadChatFiles, ctrl.sendMessage);
router.get("/:chatId/messages", ctrl.getMessages);
router.patch("/:chatId/read", ctrl.markRead);
router.delete("/:chatId/messages/:messageId", ctrl.deleteMessage);

// ----- Delete whole chat -----
router.delete("/:chatId", ctrl.deleteChat);

module.exports = router;