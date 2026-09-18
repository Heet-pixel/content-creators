require("dotenv").config();

const serverless = require("serverless-http");
const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");
const seedAdmin = require("./utils/seedAdmin");

const enquiryRoutes = require("./routes/enquiries");
const adminRoutes = require("./routes/admin");

const app = express();

app.use(cors());

app.use(express.json({ limit: "1mb" }));

// ─── Health Check ──────────────────────────────────────────────────────────
// Used by Better Stack to check that the Render server is online.
// This endpoint does NOT require MongoDB.

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "online",
  });
});

// ─── Admin HTML pages ──────────────────────────────────────────────────────

app.get(["/admin", "/admin/"], (req, res) =>
  res.sendFile(path.join(__dirname, "public", "admin", "login.html")),
);

app.get(["/admin/dashboard", "/admin/dashboard/"], (req, res) =>
  res.sendFile(path.join(__dirname, "public", "admin", "dashboard.html")),
);

// ─── Video CDN base URL ───────────────────────────────────────────────────

const S3_BASE = (process.env.S3_BASE_URL || "").replace(/\/$/, "");

// Also keep the server-side redirect as a fallback for direct URL access
if (S3_BASE) {
  app.get("/assets/splash-reel.mp4", (req, res) =>
    res.redirect(301, `${S3_BASE}/assets/splash-reel.mp4`),
  );

  app.get("/assets/videos/*", (req, res) =>
    res.redirect(301, `${S3_BASE}${req.path}`),
  );
}

// ─── Inject VIDEO_BASE into HTML ───────────────────────────────────────────

app.get(["/", "/index.html"], (req, res) => {
  const fs = require("fs");

  const htmlPath = path.join(__dirname, "public", "index.html");

  let html = fs.readFileSync(htmlPath, "utf8");

  // Inject VIDEO_BASE before </body>
  const injection = `<script>window.__VIDEO_BASE__="${S3_BASE}";</script>`;

  if (html.includes("</body>")) {
    html = html.replace("</body>", injection + "\n</body>");
  } else {
    html += injection;
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");

  res.send(html);
});

// ─── Static frontend ──────────────────────────────────────────────────────

app.use(
  express.static(path.join(__dirname, "public"), {
    maxAge: "7d",
    etag: true,

    setHeaders: (res, filePath) => {
      if (/\.(html|js|css)$/i.test(filePath)) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  }),
);

// ─── API routes ────────────────────────────────────────────────────────────

app.use("/api/enquiries", enquiryRoutes);

app.use("/api/admin", adminRoutes);

// ─── Fallback (SPA / deep links) ──────────────────────────────────────────

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─── Binary MIME types for API Gateway ─────────────────────────────────────

const BINARY_MIME_TYPES = [
  "image/*",
  "audio/*",
  "font/*",
  "application/octet-stream",
  "application/pdf",
  "application/zip",
  "application/font-woff",
  "application/font-woff2",
  "application/x-font-ttf",
  "application/vnd.ms-fontobject",
];

// ─── Local dev / Render ────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () =>
    console.log(`Content Crafters server running on port ${PORT}`),
  );

  connectDB().then(() => seedAdmin());
}

// ─── AWS Lambda ────────────────────────────────────────────────────────────

const serverlessApp = serverless(app, {
  binary: BINARY_MIME_TYPES,
});

let dbReady = false;

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (!dbReady) {
    await connectDB();
    await seedAdmin();
    dbReady = true;
  }

  return serverlessApp(event, context);
};
