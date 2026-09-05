# Content Crafters — Website + Admin Dashboard

A full-stack site: the public marketing site, plus a password-protected
admin panel backed by MongoDB, email notifications, and Excel/PDF export.

## What's inside

```
/public                 ← the public website (served as static files)
  index.html, style.css, script.js
  /assets                ← logo, videos, poster images
  /admin
    login.html            ← admin sign-in + forgot-password/OTP flow
    dashboard.html         ← view & manage enquiries
    admin.css / admin-*.js

server.js                ← Express entry point
/config/db.js             ← MongoDB connection
/models                  ← Enquiry.js, Admin.js (Mongoose schemas)
/routes                  ← enquiries.js (public), admin.js (auth + data)
/middleware/auth.js       ← JWT guard for admin routes
/utils                   ← mailer.js (Nodemailer), exporters.js (Excel/PDF), seedAdmin.js
```

## 1. Local setup

Requires Node.js 18+ and a MongoDB instance (local `mongod`, or a free
[MongoDB Atlas](https://www.mongodb.com/atlas) cluster).

```bash
npm install
cp .env.example .env
# edit .env — at minimum set MONGODB_URI, JWT_SECRET
npm run dev        # http://localhost:5000
```

On first run, the server automatically creates the admin account using
`ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` (defaults to
`contentcrafters.in@gmail.com` / `12345678` if not set — **change these before going live**).

- Public site: `http://localhost:5000`
- Admin login: `http://localhost:5000/admin`

## 2. Email (Nodemailer)

The site works fully **without** SMTP configured — it just runs in "demo
mode," logging what *would* have been emailed to the server console
instead of sending it. This means the contact form and OTP flow both work
end-to-end for testing before you have real email credentials.

To send real emails, fill in `.env`:

```
SMTP_HOST=smtp.gmail.com          # or your provider
SMTP_PORT=587
SMTP_USER=you@yourdomain.com
SMTP_PASS=your-app-password       # Gmail needs an "App Password", not your normal password
SMTP_FROM="Content Crafters <no-reply@yourdomain.com>"
ADMIN_NOTIFY_EMAIL=you@yourdomain.com     # where new-enquiry alerts go
ADMIN_RECOVERY_EMAIL=you@yourdomain.com   # where forgot-password OTPs go
```

Any SMTP provider works (Gmail, Outlook, SendGrid, Mailgun, Resend, Zoho, etc.) —
just fill in that provider's host/port/user/pass.

## 3. Admin login credentials

- **Email:** whatever you set as `ADMIN_EMAIL` (default: `contentcrafters.in@gmail.com`)
- **Password:** whatever you set as `ADMIN_PASSWORD` (default: `12345678`)

Since the default email is now a real, deliverable Gmail address, "Forgot
password" OTPs are sent straight to it by default (via `ADMIN_RECOVERY_EMAIL`,
which falls back to `ADMIN_EMAIL` if unset) — no extra config needed once
SMTP is filled in.

**Change the default password after your first login**, and set a long
random `JWT_SECRET` before going live — anyone who knows the default
credentials and your JWT secret could otherwise forge admin sessions.

## 4. Deploying on Render

Render doesn't host MongoDB itself, so you'll need a database first:

1. **Create a free MongoDB Atlas cluster** at mongodb.com/atlas → get its
   connection string (looks like
   `mongodb+srv://user:pass@cluster.mongodb.net/contentcrafters`).
   Under Atlas → Network Access, allow access from anywhere (`0.0.0.0/0`)
   so Render can reach it.

2. **On Render:** New → Web Service → connect this repo.
   - Build command: `npm install`
   - Start command: `npm start`
   - Add environment variables (Render dashboard → Environment):
     - `MONGODB_URI` — your Atlas connection string
     - `JWT_SECRET` — a long random string
     - `ADMIN_EMAIL`, `ADMIN_PASSWORD`
     - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
     - `ADMIN_NOTIFY_EMAIL`, `ADMIN_RECOVERY_EMAIL`
   - Render sets `PORT` automatically — the app already reads
     `process.env.PORT`, so no change needed there.

3. Deploy. Your site will be live at `https://your-app.onrender.com`, and
   the admin panel at `https://your-app.onrender.com/admin`.

**Note on Render's free tier:** free web services spin down after periods
of inactivity and take ~30–60s to wake back up on the next request. That's
normal — either upgrade to a paid instance, or accept the occasional cold
start.

## 5. What the admin dashboard does

- Lists every enquiry submitted through the site's contact form
- Search by name/business/email, filter by status
- Change status inline: **Pending → Working On → Completed**
- Delete an enquiry
- Export everything to **Excel (.xlsx)** or **PDF**
- Fully responsive — the table becomes stacked cards on mobile

## 6. Portfolio content — what's real, what's still needed

Every portfolio video on the site is now real client footage — there is
no demo/placeholder video content left anywhere on the site. Categories
currently populated:

| Category | Real videos | Client |
|---|---|---|
| Real Estate | 2 | Yash Realty + 1 unnamed |
| Jewellery | 8 | Unnamed (no brand visible in footage) |
| Fashion | 3 | Unnamed (no brand visible in footage) |
| Weddings & Events | 1 | Devam & Helly (pre-wedding film) |
| Branding & Corporate | 1 | Cake 'N' Joy |
| AI Videos | 2 | AP Dziner + Nexus Overseas Services Kota Pvt. Ltd. |
| Interiors & Travel | 0 | — shows a clean "no projects yet" message rather than a broken empty grid |

**A few judgment calls worth double-checking:**
- The pre-wedding film runs about 3 minutes at full length — I trimmed
  it to a ~22-second highlight for the website (a 200MB, 3-minute video
  isn't practical to serve on a portfolio card). The original full-length
  file wasn't kept in the project, so if you want a different segment
  used as the highlight, you'll need to re-trim from your original file.
- I categorized `cake01.mp4` (Cake 'N' Joy) under **Branding & Corporate**
  rather than Weddings & Events, since the footage itself is lifestyle/
  social content for a bakery brand rather than an actual wedding or
  event. Move it in `PORTFOLIO` inside `public/script.js` if you'd
  place it differently.
- Client names for the Fashion and one Jewellery/Real Estate entry are
  still `[CLIENT NAME]` placeholders — no brand name was visible in
  that footage, so nothing was guessed or invented.

The About section's three images were also generic stock photography
before — they're now real stills from your own project footage
(pre-wedding, fashion, and the bakery brand) instead.

Testimonial avatars no longer use stock photos of random people
pretending to be your clients — they're simple initials badges until
real, permissioned client photos are available.

## 7. SEO status

Technical/on-page SEO has been implemented for what's confirmable right now:

- Unique, keyword-relevant `<title>` and meta description
- Canonical URL (`https://contentcrafters.in/`)
- Complete Open Graph + Twitter Card tags, with a real branded 1200×630
  share image (`public/assets/og-cover.jpg`) instead of a broken/missing one
- `Organization` + `WebSite` JSON-LD structured data — deliberately minimal,
  containing only confirmed facts (name, URL, logo, description)
- `robots.txt` (blocks `/admin` and `/api`, points to the sitemap) and
  `sitemap.xml`
- Single `<h1>`, logical heading hierarchy elsewhere
- Descriptive `alt` text audit across all images (no more bracket-style
  placeholder text like `[REAL IMAGE — ...]` sitting in production `alt`
  attributes)
- Admin pages already carry `noindex, nofollow`

**What's deliberately left out, and why:** structured data for `telephone`,
`email`, `sameAs` (social profile URLs) and any `LocalBusiness`/address
schema. Shipping placeholder text into structured data (e.g. a literal
`"[PHONE NUMBER]"` string) produces invalid data that can hurt trust
signals rather than help them. Add these once you have:

1. A real phone number and email → fill into the `Organization` JSON-LD
   in `public/index.html`
2. Real, verified social profile URLs → add as a `sameAs` array
3. A confirmed city/service area → add a `LocalBusiness` schema block and
   consider city-specific title tags (e.g. *"Digital Marketing Agency in
   [City] | Content Crafters"*)

**Not done (bigger scope, worth planning separately):** splitting into
dedicated `/services/seo`, `/services/branding-logo-design` etc. pages.
Right now this is a single page, which is fine for a focused brand/service
overview, but multi-page service content is generally what wins rankings
for competitive commercial terms like "SEO agency" or "branding agency" —
each service gets its own title, meta description, and in-depth content
instead of sharing one homepage's worth of SEO equity across nine services.
Happy to help build that out once you're ready — it's a meaningfully
bigger project than a metadata pass.

Also still needed before launch, per Google's guidelines against
low-value/misleading content: replace the placeholder stats (`[50]+
Projects delivered`, etc.) and placeholder testimonials with real,
verified numbers and genuine client reviews — or remove those sections
until real data is available.

## 8. Known limitation in this sandbox (not a real bug)

The hero section's looping reel was tested in a stripped-down headless
browser that lacks H.264 video decoding — it can't play *any* local MP4
at all in that specific test environment. Any normal browser (Chrome,
Safari, Firefox, Edge — desktop or mobile) supports H.264 natively and
will play it correctly. Worth a quick manual check after deploying, but
this isn't expected to be an issue in production.
#   c o n t e n t - c r e a t o r s  
 