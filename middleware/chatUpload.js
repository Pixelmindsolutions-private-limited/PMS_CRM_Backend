// middleware/chatUpload.js
// Uploads for chat: images, videos, audio, documents, any file, stickers.
// Field name: "files" (up to 10 files, 500 MB each)
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const BASE_URL =
  process.env.BASE_URL || "https://pmsbackend.pixelmindsolutions.com";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
const MAX_FILES = 10;
const CHAT_UPLOAD_ROOT = path.join(__dirname, "../uploads/chat");

const BLOCKED = /\.(exe|bat|cmd|com|msi|scr|sh|php|jar|vbs|ps1)$/i;

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const now = new Date();
    const folder = path.join(
      CHAT_UPLOAD_ROOT,
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    );
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}_${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter(req, file, cb) {
    if (BLOCKED.test(file.originalname)) {
      return cb(new Error("This file type is not allowed"));
    }
    cb(null, true);
  },
});

// Express middleware that returns clean JSON errors
const uploadChatFiles = (req, res, next) => {
  upload.array("files", MAX_FILES)(req, res, (err) => {
    if (!err) return next();
    let message = err.message;
    if (err.code === "LIMIT_FILE_SIZE") message = "File too large (max 500 MB)";
    if (err.code === "LIMIT_FILE_COUNT")
      message = `Too many files (max ${MAX_FILES})`;
    return res.status(400).json({ success: false, message });
  });
};

function kindFromMime(mime = "", name = "") {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (
    /pdf|msword|officedocument|ms-excel|ms-powerpoint|text\/|opendocument/.test(
      mime
    ) ||
    /\.(pdf|docx?|xlsx?|pptx?|txt|csv|rtf)$/i.test(name)
  ) {
    return "document";
  }
  return "file";
}

// multer files -> attachment objects saved in DB
function buildAttachments(files = []) {
  return files.map((f) => {
    const rel = path
      .relative(CHAT_UPLOAD_ROOT, f.path)
      .split(path.sep)
      .join("/");
    // multer reads names as latin1; restore UTF-8 (Hindi/Telugu/emoji names)
    const fileName = Buffer.from(f.originalname, "latin1").toString("utf8");
    return {
      url: `${BASE_URL}/uploads/chat/${rel}`,
      fileName,
      mimeType: f.mimetype,
      size: f.size,
      kind: kindFromMime(f.mimetype, fileName),
    };
  });
}

function removeUploadedFiles(files = []) {
  for (const f of files) {
    try {
      if (f.path && fs.existsSync(f.path)) fs.unlinkSync(f.path);
    } catch (e) {
      console.error("cleanup error:", e.message);
    }
  }
}

// attachment.url -> absolute disk path (for deleting)
function attachmentToDiskPath(url = "") {
  const prefix = `${BASE_URL}/uploads/chat/`;
  if (!url.startsWith(prefix)) return null;
  const rel = url.slice(prefix.length);
  const full = path.join(CHAT_UPLOAD_ROOT, rel);
  return full.startsWith(CHAT_UPLOAD_ROOT) ? full : null; // path traversal guard
}

function removeAttachmentFiles(attachments = []) {
  for (const a of attachments) {
    const p = attachmentToDiskPath(a.url);
    try {
      if (p && fs.existsSync(p)) fs.unlinkSync(p);
    } catch (e) {
      console.error("attachment delete error:", e.message);
    }
  }
}

module.exports = {
  uploadChatFiles,
  buildAttachments,
  removeUploadedFiles,
  removeAttachmentFiles,
  CHAT_UPLOAD_ROOT,
};