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

// ─── Redirect video requests to S3 ────────────────────────────────────────
// Lambda has a 6 MB response limit — any MP4 larger than that returns a
// 502 Bad Gateway. We redirect /assets/videos/* and the splash reel to
// S3 where the files live, so the browser streams directly from S3.
const S3_BASE = (process.env.S3_BASE_URL || "").replace(/\/$/, "");

if (S3_BASE) {
  app.get("/assets/splash-reel.mp4", (req, res) =>
    res.redirect(301, `${S3_BASE}/assets/splash-reel.mp4`),
  );
  app.get("/assets/videos/*", (req, res) =>
    res.redirect(301, `${S3_BASE}${req.path}`),
  );
}

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
