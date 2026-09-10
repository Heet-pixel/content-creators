# Deployment Guide — Content Crafters on AWS Lambda + S3

## Why S3 for videos?

Lambda has a **6 MB response limit**. Your videos range from 1 MB to 21 MB.
Any video over 6 MB returns a "502 Bad Gateway". The fix: videos live on S3
and the browser streams them directly from there. Lambda only handles API calls
and small static files (HTML, CSS, JS, images, posters).

---

## Step 1 — Create an S3 Bucket

1. Go to **AWS S3** → **Create bucket**
2. Name it (e.g. `contentcrafters-assets`)
3. Region: `ap-south-1` (Mumbai) — or wherever your Lambda is
4. **Uncheck** "Block all public access" (videos must be publicly readable)
5. Acknowledge the warning → Create bucket

### Set Bucket Policy (allow public read)

In your bucket → **Permissions** → **Bucket Policy**, paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```
Replace `your-bucket-name` with your actual bucket name.

### Set CORS (so your site can stream videos)

In your bucket → **Permissions** → **CORS**, paste:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["https://contentcrafters.in", "http://localhost:5000"],
    "ExposeHeaders": ["Content-Length", "Content-Range"],
    "MaxAgeSeconds": 3000
  }
]
```

---

## Step 2 — Upload Videos to S3

Edit `upload-videos-to-s3.sh`:
- Set `BUCKET="contentcrafters-assets"` (your bucket name)
- Set `REGION="ap-south-1"` (your region)

Then run:
```bash
# Install AWS CLI if needed: https://aws.amazon.com/cli/
aws configure        # enter your Access Key, Secret, region
./upload-videos-to-s3.sh
```

Your S3 Base URL will be:
```
https://your-bucket-name.s3.ap-south-1.amazonaws.com
```

---

## Step 3 — Set Lambda Environment Variables

In AWS Lambda → your function → **Configuration** → **Environment variables**:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://...` (your Atlas URI) |
| `JWT_SECRET` | a long random string |
| `ADMIN_ACCOUNTS` | `contentcrafters.in@gmail.com:yourpassword` |
| `ADMIN_NOTIFY_EMAIL` | your@email.com |
| `S3_BASE_URL` | `https://your-bucket-name.s3.ap-south-1.amazonaws.com` |

---

## Step 4 — Deploy Lambda Code

```bash
# In your project root (this folder):
npm install

# Zip everything (node_modules included):
zip -r lambda-deploy.zip . --exclude ".env" --exclude "*.zip" --exclude ".git/*"

# Upload in AWS Lambda → Upload from → .zip file
# Handler: lambda.handler
```

---

## Step 5 — API Gateway Binary Types

In **API Gateway** → your API → **Settings** → **Binary Media Types**, add:
```
image/*
audio/*
font/*
application/pdf
*/*
```
Then: **Actions** → **Deploy API** → select your stage → **Deploy**

---

## After Deployment

Your architecture:
```
Browser
 ├── /assets/videos/* ──────────► S3 (direct stream, no Lambda involved)
 ├── /assets/splash-reel.mp4 ──► S3
 ├── /api/* ─────────────────────► API Gateway → Lambda → MongoDB
 └── /* (HTML/CSS/JS/images) ───► API Gateway → Lambda → express.static
```

Videos will play instantly. Images and the site will load through Lambda as before.
