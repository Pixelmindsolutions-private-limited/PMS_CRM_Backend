// // server.js
// const express = require("express");
// const dns = require("dns");
// dns.setServers(["8.8.8.8", "8.8.4.4"]);
// dns.setDefaultResultOrder("ipv4first");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const helmet = require("helmet");
// const morgan = require("morgan");
// const dotenv = require("dotenv");
// const path = require("path");
// const fs = require("fs");

// const app = express();
// const startAutoEndWork = require("./cron/autoEndWork");
// const { startIdleDetection } = require("./controllers/WorkSession.controller");

// // Load environment variables
// require("dotenv").config();

// // ==================== DATABASE ====================
// const MONGODB_URI =
//   process.env.MONGODB_URI ||
//   "mongodb+srv://syamsai455_db_user:ElxSqlS2uls0g5ZF@cluster0.dxd60hg.mongodb.net/crm_db?retryWrites=true&w=majority";

// mongoose
//   .connect(MONGODB_URI)
//   .then(() => console.log("✅ MongoDB connected successfully"))
//   .catch((err) => {
//     console.error("❌ MongoDB connection error:", err);
//     process.exit(1);
//   });

// const BASE_URL =
//   process.env.BASE_URL || "https://pmsbackend.pixelmindsolutions.com";
// console.log(`🌐 Base URL: ${BASE_URL}`);

// // ==================== MIDDLEWARE ====================

// // Security
// app.use(
//   helmet({
//     crossOriginResourcePolicy: { policy: "cross-origin" },
//     crossOriginOpenerPolicy: false,
//     crossOriginEmbedderPolicy: false,
//   }),
// );

// // CORS
// const allowedOrigins = [
//   "https://pmsbackend.pixelmindsolutions.com",
//   "https://pms-admin.onrender.com",
//   "http://localhost:3001",
//   "http://localhost:3002",
//   "http://31.97.228.17:3537",
//   "http://31.97.228.17:4477",
//   "https://pmsadmin.pixelmindsolutions.com",
//   "http://16.178.180.174:3000",
//   "http://13.211.179.187:3001"
// ];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin) return callback(null, true);
//       if (allowedOrigins.indexOf(origin) !== -1) {
//         callback(null, true);
//       } else {
//         console.log("⚠️ Blocked origin:", origin);
//         callback(null, true);
//       }
//     },
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
//     allowedHeaders: [
//       "Content-Type",
//       "Authorization",
//       "X-Requested-With",
//       "Accept",
//       "Origin",
//       "Access-Control-Allow-Origin",
//     ],
//     exposedHeaders: ["Content-Length", "X-Requested-With"],
//     preflightContinue: false,
//     optionsSuccessStatus: 204,
//   }),
// );

// app.options("*", (req, res) => {
//   const origin = req.headers.origin;
//   if (allowedOrigins.includes(origin)) {
//     res.header("Access-Control-Allow-Origin", origin);
//     res.header(
//       "Access-Control-Allow-Methods",
//       "GET, POST, PUT, DELETE, OPTIONS, PATCH",
//     );
//     res.header(
//       "Access-Control-Allow-Headers",
//       "Content-Type, Authorization, X-Requested-With, Accept",
//     );
//     res.header("Access-Control-Allow-Credentials", "true");
//     res.sendStatus(204);
//   } else {
//     res.sendStatus(204);
//   }
// });

// // Body parsers
// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// // Logging
// app.use(morgan("dev"));

// // ==================== STATIC FILES ====================
// const uploadsPath = path.join(__dirname, "uploads");
// console.log("📁 Uploads directory:", uploadsPath);
// console.log("📁 Uploads exists:", fs.existsSync(uploadsPath));

// // Ensure upload directories exist (including payment-proofs)
// const uploadDirs = [
//   path.join(__dirname, "uploads"),
//   path.join(__dirname, "uploads/staff"),
//   path.join(__dirname, "uploads/staff/profile"),
//   path.join(__dirname, "uploads/staff/idcards"),
//   path.join(__dirname, "uploads/staff/documents"),
//   path.join(__dirname, "uploads/temp"),
//   path.join(__dirname, "uploads/fingerprints"),
//   path.join(__dirname, "uploads/invoices"),
//   path.join(__dirname, "uploads/payment-proofs"), // NEW
// ];

// uploadDirs.forEach((dir) => {
//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true });
//     console.log(`✅ Created directory: ${dir}`);
//   }
// });

// // Serve /uploads/* statically
// app.use(
//   "/uploads",
//   (req, res, next) => {
//     const fullPath = path.join(uploadsPath, req.path);
//     console.log(`📁 Static file request: ${req.path}`);
//     console.log(`📁 Looking for: ${fullPath}`);
//     console.log(`📁 File exists: ${fs.existsSync(fullPath)}`);
//     next();
//   },
//   express.static(uploadsPath, {
//     setHeaders: (res, filePath) => {
//       console.log(`📁 Serving file: ${filePath}`);
//       if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) {
//         res.setHeader("Content-Type", "image/jpeg");
//       } else if (filePath.endsWith(".png")) {
//         res.setHeader("Content-Type", "image/png");
//       } else if (filePath.endsWith(".pdf")) {
//         res.setHeader("Content-Type", "application/pdf");
//       } else if (filePath.endsWith(".doc") || filePath.endsWith(".docx")) {
//         res.setHeader("Content-Type", "application/msword");
//       }
//       res.setHeader("Cache-Control", "public, max-age=31536000");
//     },
//   }),
// );

// // Serve invoice PDFs inline
// const invoicesPath = path.join(__dirname, "uploads/invoices");
// console.log(`📁 Invoices directory: ${invoicesPath}`);
// console.log(`📁 Invoices exists: ${fs.existsSync(invoicesPath)}`);

// app.use(
//   "/uploads/invoices",
//   express.static(invoicesPath, {
//     setHeaders: (res) => {
//       res.setHeader("Content-Type", "application/pdf");
//       res.setHeader("Content-Disposition", "inline");
//       res.setHeader("Cache-Control", "public, max-age=31536000");
//     },
//   }),
// );

// console.log(`📁 Invoices static route configured`);

// // ==================== ROUTES ====================
// const authRoutes = require("./routes/auth.routes");
// const projectRoutes = require("./routes/project.routes");
// const clientRoutes = require("./routes/client.routes");
// const staffRoutes = require("./routes/staff.routes");
// const worksheetRoutes = require("./routes/worksheet.routes");
// const attendanceRoutes = require("./routes/attendance.routes");
// const dashboardRoutes = require("./routes/dashboard.routes");
// const fingerprintRoutes = require("./routes/fingerprint.routes");
// const workSessionRoutes = require("./routes/WorkSession.routes");
// const digitalMarketingRoutes = require("./routes/marketing.routes");
// const adminStaffLogin = require("./routes/adminStaff.routes");
// const manualInvoiceRoutes = require("./routes/manualinvoice.routes");
// const adminAuthRoutes = require("./routes/adminpannel.routes");
// const delayRequestRoutes = require("./routes/delayRequestRoutes");

// // NEW: Payment approval workflow routers
// // ⚠️ Use the exact filename you created: paymentRequestRoutes.js
// const paymentRequestRoutes = require("./routes/paymentRequestRoutes");

// // OPTIONAL: dedicated invoice router
// // If you haven't created ./routes/invoiceRoutes.js yet, comment out both
// // lines below (the invoice endpoints already exist under /api/projects).
// // const invoiceRoutes = require("./routes/invoiceRoutes");

// // Mount API routes
// app.use("/api/auth", authRoutes);
// app.use("/api/dashboard", dashboardRoutes);
// app.use("/api/clients", clientRoutes);
// app.use("/api/projects", projectRoutes);
// app.use("/api/staff", staffRoutes);
// app.use("/api/worksheets", worksheetRoutes);
// app.use("/api/attendance", attendanceRoutes);
// app.use("/api/fingerprint", fingerprintRoutes);
// app.use("/api/work-session", workSessionRoutes);
// app.use("/api/digitalmarketing", digitalMarketingRoutes);
// app.use("/api/admin-staff", adminStaffLogin);
// app.use("/api/manual-invoices", manualInvoiceRoutes);
// app.use("/api/adminpanel", adminAuthRoutes);
// app.use("/api/work-session", delayRequestRoutes);

// // NEW: payment requests
// app.use("/api/payment-requests", paymentRequestRoutes);

// // OPTIONAL: invoice router (uncomment once you create routes/invoiceRoutes.js)
// // app.use("/api/invoices", invoiceRoutes);

// // Login sync endpoints
// app.post("/login-sync", require("./controllers/auth.controller").loginSync);
// app.get(
//   "/login-sync/pending/:syncId",
//   require("./controllers/auth.controller").consumeLoginSync,
// );

// // Cron jobs
// const startReminderJob = require("./cron/installmentReminder");
// startReminderJob();

// // ==================== HEALTH CHECK ====================
// app.get("/api/health", (req, res) => {
//   const profileDir = path.join(__dirname, "uploads/staff/profile");
//   const profileFiles = fs.existsSync(profileDir)
//     ? fs.readdirSync(profileDir)
//     : [];

//   res.json({
//     status: "OK",
//     timestamp: new Date(),
//     environment: process.env.NODE_ENV || "production",
//     baseUrl: BASE_URL,
//     uploadsPath,
//     uploadsExists: fs.existsSync(uploadsPath),
//     profileImagesCount: profileFiles.length,
//     sampleProfileImage:
//       profileFiles.length > 0
//         ? `${BASE_URL}/uploads/staff/profile/${profileFiles[0]}`
//         : null,
//   });
// });

// // ==================== ERROR HANDLING ====================

// // 404 handler for API routes
// app.use("/api/*", (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: `API Route not found: ${req.originalUrl}`,
//   });
// });

// // Catch-all
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "Route not found",
//   });
// });

// // Global error handler
// app.use((err, req, res, next) => {
//   console.error("Error:", err.stack);
//   res.status(err.status || 500).json({
//     success: false,
//     message: err.message || "Internal server error",
//     ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
//   });
// });

// // ==================== START SERVER ====================
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
//   startAutoEndWork();
//   startIdleDetection();
//   console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
//   console.log(`🌐 Base URL: ${BASE_URL}`);
//   console.log(`📁 Uploads path: ${uploadsPath}`);
//   console.log(`📁 Uploads exists: ${fs.existsSync(uploadsPath)}`);

//   const profileDir = path.join(__dirname, "uploads/staff/profile");
//   if (fs.existsSync(profileDir)) {
//     const files = fs.readdirSync(profileDir);
//     console.log(`📸 Profile images found: ${files.length}`);
//     if (files.length > 0) {
//       console.log(`📸 Sample: ${BASE_URL}/uploads/staff/profile/${files[0]}`);
//     }
//   } else {
//     console.log("⚠️ Profile directory does not exist");
//   }
// });

// server.js

// Load env BEFORE importing app modules
require("dotenv").config();

const express = require("express");
const dns = require("dns");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");

const { createServer } = require("http");
const { Server } = require("socket.io");

// Existing background jobs
const startAutoEndWork = require("./cron/autoEndWork");
const { startIdleDetection } = require("./controllers/WorkSession.controller");

// ==================== DNS ====================
dns.setServers(["8.8.8.8", "8.8.4.4"]);
dns.setDefaultResultOrder("ipv4first");

// ==================== APPLICATION ====================
const app = express();
const httpServer = createServer(app);

// ==================== ENV VALIDATION ====================
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is required in .env");
}
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required in .env");
}

// ==================== DATABASE ====================
const databaseReady = mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

const BASE_URL =
  process.env.BASE_URL || "https://pmsbackend.pixelmindsolutions.com";
console.log(`🌐 Base URL: ${BASE_URL}`);

// ==================== MIDDLEWARE ====================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

const allowedOrigins = [
  "https://pmsbackend.pixelmindsolutions.com",
  "https://pms-admin.onrender.com",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://31.97.228.17:3537",
  "http://31.97.228.17:4477",
  "https://pmsadmin.pixelmindsolutions.com",
  "http://16.178.180.174:3000",
  "http://13.211.179.187:3001",
];

// ==================== SOCKET.IO ====================
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 100 * 1024,
  pingInterval: 25000,
  pingTimeout: 20000,
});

// ✅ CHAT: lets REST controllers broadcast live via req.app.get("io")
app.set("io", io);

// Allow long HTTP file uploads
httpServer.requestTimeout = 30 * 60 * 1000;

// ==================== HTTP CORS ====================
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log("⚠️ Blocked origin:", origin);
        callback(null, true);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Allow-Origin",
    ],
    exposedHeaders: ["Content-Length", "X-Requested-With"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

app.options("*", (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, Accept"
    );
    res.header("Access-Control-Allow-Credentials", "true");
    res.sendStatus(204);
  } else {
    res.sendStatus(204);
  }
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("dev"));

// ==================== STATIC FILES ====================
const uploadsPath = path.join(__dirname, "uploads");
console.log("📁 Uploads directory:", uploadsPath);
console.log("📁 Uploads exists:", fs.existsSync(uploadsPath));

const uploadDirs = [
  path.join(__dirname, "uploads"),
  path.join(__dirname, "uploads/staff"),
  path.join(__dirname, "uploads/staff/profile"),
  path.join(__dirname, "uploads/staff/idcards"),
  path.join(__dirname, "uploads/staff/documents"),
  path.join(__dirname, "uploads/temp"),
  path.join(__dirname, "uploads/fingerprints"),
  path.join(__dirname, "uploads/invoices"),
  path.join(__dirname, "uploads/payment-proofs"),
  path.join(__dirname, "uploads/chat"), // ✅ CHAT attachments
];

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

app.use(
  "/uploads",
  (req, res, next) => {
    const fullPath = path.join(uploadsPath, req.path);
    console.log(`📁 Static file request: ${req.path}`);
    console.log(`📁 Looking for: ${fullPath}`);
    console.log(`📁 File exists: ${fs.existsSync(fullPath)}`);
    next();
  },
  express.static(uploadsPath, {
    setHeaders: (res, filePath) => {
      console.log(`📁 Serving file: ${filePath}`);
      if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) {
        res.setHeader("Content-Type", "image/jpeg");
      } else if (filePath.endsWith(".png")) {
        res.setHeader("Content-Type", "image/png");
      } else if (filePath.endsWith(".pdf")) {
        res.setHeader("Content-Type", "application/pdf");
      } else if (
        filePath.endsWith(".doc") ||
        filePath.endsWith(".docx")
      ) {
        res.setHeader("Content-Type", "application/msword");
      }
      res.setHeader("Cache-Control", "public, max-age=31536000");
    },
  })
);

const invoicesPath = path.join(__dirname, "uploads/invoices");
console.log(`📁 Invoices directory: ${invoicesPath}`);
console.log(`📁 Invoices exists: ${fs.existsSync(invoicesPath)}`);

app.use(
  "/uploads/invoices",
  express.static(invoicesPath, {
    setHeaders: (res) => {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline");
      res.setHeader("Cache-Control", "public, max-age=31536000");
    },
  })
);

console.log("📁 Invoices static route configured");

// ==================== ROUTES ====================
const authRoutes = require("./routes/auth.routes");
const projectRoutes = require("./routes/project.routes");
const clientRoutes = require("./routes/client.routes");
const staffRoutes = require("./routes/staff.routes");
const worksheetRoutes = require("./routes/worksheet.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const fingerprintRoutes = require("./routes/fingerprint.routes");
const workSessionRoutes = require("./routes/WorkSession.routes");
const digitalMarketingRoutes = require("./routes/marketing.routes");
const adminStaffLogin = require("./routes/adminStaff.routes");
const manualInvoiceRoutes = require("./routes/manualinvoice.routes");
const adminAuthRoutes = require("./routes/adminpannel.routes");
const delayRequestRoutes = require("./routes/delayRequestRoutes");
const paymentRequestRoutes = require("./routes/paymentRequestRoutes");

// Chat routes — safe load
let chatRoutes = null;
try {
  chatRoutes = require("./routes/chat.routes");
} catch (err) {
  console.warn("⚠️ Chat routes skipped:", err.message);
}

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/worksheets", worksheetRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/fingerprint", fingerprintRoutes);
app.use("/api/work-session", workSessionRoutes);
app.use("/api/digitalmarketing", digitalMarketingRoutes);
app.use("/api/admin-staff", adminStaffLogin);
app.use("/api/manual-invoices", manualInvoiceRoutes);
app.use("/api/adminpanel", adminAuthRoutes);
app.use("/api/work-session", delayRequestRoutes);
app.use("/api/payment-requests", paymentRequestRoutes);

// Mount chat only if loaded successfully
if (chatRoutes) {
  app.use("/api/chat", chatRoutes);
  console.log("💬 Chat API mounted at /api/chat");
} else {
  console.warn("⚠️ Chat API NOT mounted (routes failed to load)");
}

// ==================== LOGIN SYNC ====================
app.post(
  "/login-sync",
  require("./controllers/auth.controller").loginSync
);
app.get(
  "/login-sync/pending/:syncId",
  require("./controllers/auth.controller").consumeLoginSync
);

// ==================== REMINDER JOB ====================
const startReminderJob = require("./cron/installmentReminder");
startReminderJob();

// ==================== HEALTH ====================
app.get("/api/health", (req, res) => {
  const profileDir = path.join(__dirname, "uploads/staff/profile");
  const profileFiles = fs.existsSync(profileDir)
    ? fs.readdirSync(profileDir)
    : [];

  res.json({
    status: "OK",
    timestamp: new Date(),
    environment: process.env.NODE_ENV || "production",
    baseUrl: BASE_URL,
    uploadsPath,
    uploadsExists: fs.existsSync(uploadsPath),
    profileImagesCount: profileFiles.length,
    sampleProfileImage:
      profileFiles.length > 0
        ? `${BASE_URL}/uploads/staff/profile/${profileFiles[0]}`
        : null,
    chatEnabled: !!chatRoutes,
  });
});

// ==================== ERROR HANDLING ====================
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.originalUrl}`,
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

async function startServer() {
  // 1. Wait for DB
  await databaseReady;

  // 2. Initialize chat socket (safe)
  try {
    const initializeChat = require("./sockets/chat.socket");
    initializeChat(io);
    console.log("💬 Chat socket namespace initialized");
  } catch (err) {
    console.warn("⚠️ Chat socket skipped:", err.message);
  }

  // 3. Create chat indexes (safe)
  try {
    const chatModels = require("./models/Chat");
    for (const Model of [
      chatModels.Chat,
      chatModels.ChatMember,
      chatModels.ChatMessage,
    ]) {
      if (Model && typeof Model.syncIndexes === "function") {
        await Model.syncIndexes();
      }
    }
    console.log("💬 Chat indexes ready");
  } catch (err) {
    console.warn("⚠️ Chat indexes skipped:", err.message);
  }

  // 4. Start listening
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    startAutoEndWork();
    startIdleDetection();
    console.log(
      `📝 Environment: ${process.env.NODE_ENV || "development"}`
    );
    console.log(`🌐 Base URL: ${BASE_URL}`);
    console.log(`📁 Uploads path: ${uploadsPath}`);
    console.log(`📁 Uploads exists: ${fs.existsSync(uploadsPath)}`);

    const profileDir = path.join(__dirname, "uploads/staff/profile");
    if (fs.existsSync(profileDir)) {
      const files = fs.readdirSync(profileDir);
      console.log(`📸 Profile images found: ${files.length}`);
      if (files.length > 0) {
        console.log(
          `📸 Sample: ${BASE_URL}/uploads/staff/profile/${files[0]}`
        );
      }
    } else {
      console.log("⚠️ Profile directory does not exist");
    }
  });
}

startServer().catch((error) => {
  console.error("❌ Server startup error:", error);
  process.exit(1);
});