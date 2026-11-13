// models/Chat.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const ACCOUNT_TYPES = ["admin", "staff"];

// ============ ChatMember (per-user state inside a chat) ============
const chatMemberSchema = new Schema(
  {
    chat: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
    // _id of the Admin OR Staff document (no single ref because 2 collections)
    user: { type: Schema.Types.ObjectId, required: true },
    accountType: { type: String, enum: ACCOUNT_TYPES, required: true },
    employeeId: { type: String, default: null }, // only for staff
    role: { type: String, enum: ["admin", "member"], default: "member" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    addedBy: { type: Schema.Types.ObjectId, default: null },
    lastReadAt: { type: Date, default: null },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

chatMemberSchema.index({ chat: 1, user: 1 }, { unique: true });
chatMemberSchema.index({ user: 1, status: 1 });

// ============ Chat ============
const chatSchema = new Schema(
  {
    type: { type: String, enum: ["direct", "group"], required: true },
    name: { type: String, trim: true, default: "" },
    // "<smallerId>_<biggerId>" — only for direct chats (prevents duplicates)
    directKey: { type: String, index: true, sparse: true, unique: true },
    createdBy: { type: Schema.Types.ObjectId, required: true },
    creatorType: { type: String, enum: ACCOUNT_TYPES, required: true },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "ChatMessage",
      default: null,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

chatSchema.index({ type: 1 });

// ============ ChatMessage ============
const attachmentSchema = new Schema(
  {
    url: { type: String, required: true },
    fileName: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 }, // bytes
    kind: {
      type: String,
      enum: ["image", "video", "audio", "document", "file"],
      default: "file",
    },
  },
  { _id: false }
);

const chatMessageSchema = new Schema(
  {
    chat: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
    sender: { type: Schema.Types.ObjectId, required: true },
    senderType: { type: String, enum: ACCOUNT_TYPES, required: true },
    // text / emoji (unicode) / sticker id or url. Can be empty if files exist.
    content: { type: String, trim: true, default: "" },
    messageType: {
      type: String,
      enum: ["text", "image", "video", "audio", "document", "file", "sticker"],
      default: "text",
    },
    attachments: { type: [attachmentSchema], default: [] },
    replyTo: { type: Schema.Types.ObjectId, ref: "ChatMessage", default: null },
    readBy: [{ type: Schema.Types.ObjectId }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

chatMessageSchema.index({ chat: 1, createdAt: -1 });

chatMessageSchema.pre("validate", function (next) {
  if (!this.content && (!this.attachments || this.attachments.length === 0)) {
    return next(new Error("Message needs text or at least one file"));
  }
  next();
});

const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema);
const ChatMember =
  mongoose.models.ChatMember || mongoose.model("ChatMember", chatMemberSchema);
const ChatMessage =
  mongoose.models.ChatMessage ||
  mongoose.model("ChatMessage", chatMessageSchema);

module.exports = { Chat, ChatMember, ChatMessage };