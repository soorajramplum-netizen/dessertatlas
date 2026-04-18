# Dessert Atlas — Deployment Guide

## Project Structure
```
/
├── index.html          ← your website (unchanged design)
├── api/
│   └── order.js        ← Vercel serverless function (sends email via Resend)
├── vercel.json         ← Vercel routing config
└── README.md
```

---

## Step 1 — Get a Resend API Key
1. Sign up at [resend.com](https://resend.com) (free tier covers 100 emails/day)
2. Go to **API Keys** → Create a new key
3. (Optional but recommended) Add and verify your own domain under **Domains** so emails come from `orders@yourdomain.com` instead of the default Resend address

---

## Step 2 — Push to GitHub
1. Create a new repo on [github.com](https://github.com) (can be private)
2. Push these files:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/dessert-atlas.git
git push -u origin main
```

---

## Step 3 — Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Leave all build settings as default (Vercel auto-detects the static site + API route)
4. Click **Deploy**

---

## Step 4 — Set Environment Variables
In your Vercel project → **Settings → Environment Variables**, add:

| Variable | Value | Required? |
|---|---|---|
| `RESEND_API_KEY` | Your Resend API key (`re_xxxx...`) | ✅ Yes |
| `NOTIFY_EMAIL` | Email where orders should land (e.g. `ajitha@gmail.com`) | ✅ Yes |
| `FROM_EMAIL` | Verified sender on Resend (e.g. `orders@yourdomain.com`). If you haven't set up a domain, use `onboarding@resend.dev` for testing | ✅ Yes |

After adding variables, go to **Deployments → Redeploy** so they take effect.

---

## How it works
When a customer clicks **Place Order ✓**:
1. The browser POSTs the order details (customer info, items, total, payment method) to `/api/order`
2. The Vercel serverless function sends a formatted HTML email to `NOTIFY_EMAIL` via Resend
3. The customer sees the success modal regardless (email failure won't block them)

---

## Testing locally (optional)
```bash
npm i -g vercel
vercel dev
```
Set env vars in a `.env.local` file:
```
RESEND_API_KEY=re_your_key_here
NOTIFY_EMAIL=you@example.com
FROM_EMAIL=onboarding@resend.dev
```
