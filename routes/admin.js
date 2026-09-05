const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const Admin = require('../models/Admin');
const Enquiry = require('../models/Enquiry');
const requireAdmin = require('../middleware/auth');
const { sendMail } = require('../utils/mailer');
const { buildExcel, buildPDF } = require('../utils/exporters');

/* ---------------------------------------------------------
   PUBLIC (admin-auth) ROUTES
--------------------------------------------------------- */

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials.' });

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET || 'dev_secret_change_me',
      { expiresIn: '12h' }
    );
    res.json({ token, email: admin.email });
  } catch (err) {
    console.error('[Admin] Login failed:', err.message);
    res.status(500).json({ error: 'Login failed. Is the database connected?' });
  }
});

// POST /api/admin/forgot-password — sends a 6-digit OTP to the configured recovery email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const admin = await Admin.findOne({ email });
    // Always respond success either way, so we never leak which accounts exist
    if (admin) {
      const otp = String(crypto.randomInt(100000, 999999));
      admin.otpCode = otp;
      admin.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await admin.save();

      const recoveryTo = process.env.ADMIN_RECOVERY_EMAIL || admin.email;
      await sendMail({
        to: recoveryTo,
        subject: 'Your Content Crafters admin OTP',
        html: `
          <p style="font-family:sans-serif;">Your one-time password is:</p>
          <h2 style="font-family:sans-serif;letter-spacing:6px;">${otp}</h2>
          <p style="font-family:sans-serif;color:#888;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
        `
      });
    }
    res.json({ success: true, message: 'If that account exists, an OTP has been sent.' });
  } catch (err) {
    console.error('[Admin] Forgot-password failed:', err.message);
    res.status(500).json({ error: 'Could not process request.' });
  }
});

// POST /api/admin/reset-password — verifies OTP and sets a new password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }

    const admin = await Admin.findOne({ email });
    const validOtp =
      admin && admin.otpCode === otp && admin.otpExpires && admin.otpExpires > new Date();

    if (!validOtp) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    admin.otpCode = undefined;
    admin.otpExpires = undefined;
    await admin.save();

    res.json({ success: true });
  } catch (err) {
    console.error('[Admin] Reset-password failed:', err.message);
    res.status(500).json({ error: 'Could not reset password.' });
  }
});

/* ---------------------------------------------------------
   PROTECTED ROUTES — everything below requires a valid token
--------------------------------------------------------- */
router.use(requireAdmin);

// GET /api/admin/enquiries — list all, newest first
router.get('/enquiries', async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.json(enquiries);
  } catch (err) {
    res.status(500).json({ error: 'Could not load enquiries.' });
  }
});

// POST /api/admin/enquiries — manually add a client/enquiry from the dashboard
router.post('/enquiries', async (req, res) => {
  try {
    const { fullName, businessName, phone, email, category, service, description, status } = req.body;

    if (!fullName || !businessName || !phone || !email || !category || !service) {
      return res.status(400).json({ error: 'Name, business, phone, email, category and service are required.' });
    }

    const enquiry = await Enquiry.create({
      fullName,
      businessName,
      phone,
      email,
      category,
      service,
      description: description || '(Added manually by admin — no description provided.)',
      status: ['Pending', 'Working On', 'Completed'].includes(status) ? status : 'Pending'
    });

    res.status(201).json(enquiry);
  } catch (err) {
    console.error('[Admin] Manual enquiry create failed:', err.message);
    res.status(500).json({ error: 'Could not save this client.' });
  }
});

// PATCH /api/admin/enquiries/:id — update status / notes
router.patch('/enquiries/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const update = {};
    if (status) update.status = status;
    if (typeof notes === 'string') update.notes = notes;

    const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!enquiry) return res.status(404).json({ error: 'Not found.' });
    res.json(enquiry);
  } catch (err) {
    res.status(500).json({ error: 'Could not update enquiry.' });
  }
});

// DELETE /api/admin/enquiries/:id
router.delete('/enquiries/:id', async (req, res) => {
  try {
    await Enquiry.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete enquiry.' });
  }
});

// GET /api/admin/export/excel
router.get('/export/excel', async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    const buffer = await buildExcel(enquiries);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="content-crafters-enquiries.xlsx"');
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: 'Could not export Excel file.' });
  }
});

// GET /api/admin/export/pdf
router.get('/export/pdf', async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    const buffer = await buildPDF(enquiries);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="content-crafters-enquiries.pdf"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'Could not export PDF file.' });
  }
});

module.exports = router;
