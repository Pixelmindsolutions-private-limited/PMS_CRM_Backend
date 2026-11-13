// middleware/chatUpload.js
// Multipart field name: "files"  (max 10 files, 500 MB each)
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const BASE_URL =
  process.env.BASE_URL || "https://pmsbackend.pixelmindsolutions.com";

const MAX_FILE_SIZE = 500 * 1024 * 1024;
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

// multer files → attachments saved in DB
function buildAttachments(files = []) {
  return files.map((f) => {
    const rel = path
      .relative(CHAT_UPLOAD_ROOT, f.path)
      .split(path.sep)
      .join("/");
    return {
      url: `/uploads/chat/${rel}`, // relative path; base URL is added per request
      // multer decodes names as latin1; restore UTF-8
      fileName: Buffer.from(f.originalname, "latin1").toString("utf8"),
      mimeType: f.mimetype,
      size: f.size,
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

function removeAttachmentFiles(attachments = []) {
  for (const a of attachments) {
    // works for relative urls and old absolute urls
    const rel = (a.url || "").replace(/^https?:\/\/[^/]+/i, "");
    if (!rel.startsWith("/uploads/chat/")) continue;
    const full = path.join(CHAT_UPLOAD_ROOT, rel.slice("/uploads/chat/".length));
    if (!full.startsWith(CHAT_UPLOAD_ROOT)) continue; // path traversal guard
    try {
      if (fs.existsSync(full)) fs.unlinkSync(full);
    } catch (e) {
      console.error("attachment delete error:", e.message);
    }
  }
}

// Base URL from the incoming request:
//   local  -> http://localhost:5000
//   by IP  -> http://31.97.228.17:4477
//   domain -> https://pmsbackend.pixelmindsolutions.com (needs nginx X-Forwarded-Proto)
function getBaseUrl(req) {
  const first = (v) => String(v || "").split(",")[0].trim();
  const host = first(req.headers["x-forwarded-host"]) || first(req.get("host"));
  if (!host) return process.env.BASE_URL || "";
  const proto = first(req.headers["x-forwarded-proto"]) || req.protocol || "http";
  return `${proto}://${host}`;
}

module.exports = {
  uploadChatFiles,
  buildAttachments,
  removeUploadedFiles,
  removeAttachmentFiles,
  getBaseUrl,
};