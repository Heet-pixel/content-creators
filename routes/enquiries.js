const express = require('express');
const router = express.Router();
const Enquiry = require('../models/Enquiry');
const { sendMail } = require('../utils/mailer');

// POST /api/enquiries — public contact-form submission
router.post('/', async (req, res) => {
  try {
    const { fullName, businessName, phone, email, category, service, description } = req.body;

    if (!fullName || !businessName || !phone || !email || !category || !service || !description) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const enquiry = await Enquiry.create({
      fullName, businessName, phone, email, category, service, description
    });

    // Notify whoever is logged in as admin — fire-and-forget, never blocks the response
    const notifyTo = process.env.ADMIN_NOTIFY_EMAIL;
    if (notifyTo) {
      sendMail({
        to: notifyTo,
        subject: `New enquiry — ${fullName} (${businessName})`,
        html: `
          <h2 style="font-family:sans-serif;">New website enquiry</h2>
          <table style="font-family:sans-serif;font-size:14px;">
            <tr><td><b>Name</b></td><td>${fullName}</td></tr>
            <tr><td><b>Business</b></td><td>${businessName}</td></tr>
            <tr><td><b>Phone</b></td><td>${phone}</td></tr>
            <tr><td><b>Email</b></td><td>${email}</td></tr>
            <tr><td><b>Category</b></td><td>${category}</td></tr>
            <tr><td><b>Service</b></td><td>${service}</td></tr>
          </table>
          <p><b>Description:</b><br/>${description}</p>
          <p style="color:#888;font-size:12px;">Log in to the admin dashboard to view and manage this enquiry.</p>
        `
      }).catch(() => {});
    }

    res.status(201).json({ success: true, id: enquiry._id });
  } catch (err) {
    console.error('[Enquiries] Save failed:', err.message);
    res.status(500).json({ error: 'Could not save your enquiry right now. Please try again shortly.' });
  }
});

module.exports = router;
