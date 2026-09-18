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

// ─── Admin HTML pages ──────────────────────────────────────────────────────
app.get(["/admin", "/admin/"], (req, res) =>
  res.sendFile(path.join(__dirname, "public", "admin", "login.html")),
);
app.get(["/admin/dashboard", "/admin/dashboard/"], (req, res) =>
  res.sendFile(path.join(__dirname, "public", "admin", "dashboard.html")),
);

// ─── Video CDN base URL ───────────────────────────────────────────────────
// Lambda has a 6 MB response limit — any MP4 larger than that returns a
// 502 Bad Gateway. Set S3_BASE_URL in your Lambda env vars to your S3
// bucket URL (e.g. https://your-bucket.s3.amazonaws.com or CloudFront URL).
// The client JS reads window.__VIDEO_BASE__ and prepends it to all video
// src attributes, so videos stream directly from S3/CloudFront.
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

// ─── Inject VIDEO_BASE into HTML ──────────────────────────────────────────
// Intercept index.html and prepend a <script> tag so the client knows
// where to load videos from without going through Lambda.
app.get(["/", "/index.html"], (req, res, next) => {
  const fs = require("fs");
  const htmlPath = require("path").join(__dirname, "public", "index.html");
  let html = fs.readFileSync(htmlPath, "utf8");
  const injection = `<script>window.__VIDEO_BASE__="${S3_BASE}";</script>`;
  html = html.replace("<script src=\"script.js\">", injection + "\n<script src=\"script.js\">");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.send(html);
});

// ─── Static frontend (images, CSS, JS, posters, HTML) ─────────────────────
// Images and posters are small enough to pass through Lambda fine.
app.use(
  express.static(path.join(__dirname, "public"), {
    // Keep large media cached, but always revalidate page code after a deploy.
    maxAge: "7d",
    etag: true,
    setHeaders: (res, filePath) => {
      if (/\.(?:html|js|css)$/i.test(filePath)) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  }),
);

// ─── API routes ────────────────────────────────────────────────────────────
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/admin", adminRoutes);
app.get("/api/health", (req, res) => res.json({ ok: true }));

// ─── Fallback (SPA / deep links) ──────────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─── Binary MIME types for API Gateway ────────────────────────────────────
// Images / fonts / small assets still pass through Lambda — they need
// base64 encoding so API Gateway doesn't corrupt them.
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

// ─── Local dev ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () =>
    console.log(`Content Crafters server running on port ${PORT}`),
  );
  connectDB().then(() => seedAdmin());
}

// ─── AWS Lambda ────────────────────────────────────────────────────────────
const serverlessApp = serverless(app, { binary: BINARY_MIME_TYPES });

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