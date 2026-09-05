const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

/**
 * Seeds admin accounts from environment variables.
 *
 * Supports two formats:
 *
 * 1. Multiple accounts (recommended) — a single ADMIN_ACCOUNTS variable,
 *    comma-separated pairs of email:password:
 *
 *      ADMIN_ACCOUNTS=owner@gmail.com:pass123,manager@gmail.com:pass456
 *
 * 2. Single account (legacy/simple) — ADMIN_EMAIL + ADMIN_PASSWORD.
 *    Still works if ADMIN_ACCOUNTS isn't set.
 *
 * Existing accounts are never overwritten here — if an admin already
 * exists (e.g. they changed their password via "Forgot password"), this
 * only creates the ones that are missing. It runs safely on every
 * server restart.
 */
module.exports = async function seedAdmin() {
  const accounts = parseAccounts();

  if (!accounts.length) {
    console.warn('[Seed] No admin accounts configured — set ADMIN_ACCOUNTS or ADMIN_EMAIL/ADMIN_PASSWORD in .env');
    return;
  }

  for (const { email, password } of accounts) {
    try {
      const existing = await Admin.findOne({ email });
      if (existing) continue;
      const hash = await bcrypt.hash(password, 10);
      await Admin.create({ email, password: hash });
      console.log('[Seed] Admin account created:', email);
    } catch (err) {
      console.error(`[Seed] Could not seed admin account "${email}" (DB likely unreachable):`, err.message);
    }
  }
};

function parseAccounts() {
  const raw = process.env.ADMIN_ACCOUNTS;

  if (raw && raw.trim()) {
    return raw
      .split(',')
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair) => {
        var idx = pair.indexOf(':');
        if (idx === -1) return null;
        var email = pair.slice(0, idx).trim();
        var password = pair.slice(idx + 1).trim();
        return email && password ? { email, password } : null;
      })
      .filter(Boolean);
  }

  // Fallback to the single-account variables
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) return [{ email, password }];

  return [];
}
