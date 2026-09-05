require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const connectDB = require('./config/db');
const seedAdmin = require('./utils/seedAdmin');
const enquiryRoutes = require('./routes/enquiries');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Admin panel routes — defined BEFORE express.static so a bare
// "/admin" request can't be redirected by static's directory
// handling and accidentally fall through to the main site.
app.get(['/admin', '/admin/'], (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'))
);
app.get(['/admin/dashboard', '/admin/dashboard/'], (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'))
);

// Static frontend (public site + admin panel assets)
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/admin', adminRoutes);
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Fallback to the main site for anything else (keeps deep-links like /#contact working)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;

// Start serving the site immediately — never let a slow/unreachable
// database keep the whole website from loading. DB-dependent routes
// will simply return a graceful error until MONGODB_URI is reachable.
app.listen(PORT, () => {
  console.log(`Content Crafters server running on port ${PORT}`);
});

connectDB().then(() => {
  seedAdmin();
});
