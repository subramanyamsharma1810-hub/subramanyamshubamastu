# 🌐 Bramhana Vivaha Vedika - GitHub & Netlify / Vercel Deployment Guide

This guide explains how to push your application repository to GitHub and publish it live on **Netlify** or **Vercel** with a custom domain (`.com`, `.in`, etc.).

---

### Step 1: Push Code to GitHub

1. **Create a New Repository on GitHub** (e.g., `bramhana-vivaha-vedika`).
2. Run the following commands in your terminal (or Git Bash) at your project root:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Bramhana Vivaha Vedika production build"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME.git
   git push -u origin main
   ```

---

### Step 2: Deploy on Netlify (Recommended & Free)

1. Go to [Netlify](https://www.netlify.com/) and log in with your GitHub account.
2. Click **"Add new site"** -> **"Import an existing project"**.
3. Choose **GitHub** and select your repository (`bramhana-vivaha-vedika`).
4. Netlify will automatically detect the build settings from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **Deploy site**. Your app will be live within 60 seconds on a free `.netlify.app` subdomain!

---

### Step 3: Connect Custom Domain (`.com` or `.in`)

1. Buy your domain from a registrar like **GoDaddy, Namecheap, Hostinger, or Google Domains** (e.g., `bramhanavivahavedika.com` or `bramhanamarriage.in`).
2. In your **Netlify Dashboard**, go to **Site settings** -> **Domain management** -> **Add custom domain**.
3. Enter your purchased domain (e.g., `www.bramhanavivahavedika.com`).
4. Update your domain registrar's DNS settings to point to Netlify's name servers:
   - `dns1.p01.nsone.net`
   - `dns2.p01.nsone.net`
   - `dns3.p01.nsone.net`
   - `dns4.p01.nsone.net`
5. Netlify will automatically issue a free **SSL/TLS HTTPS Certificate** for secure browsing.

---

### Alternative: Deploy on Vercel

1. Go to [Vercel](https://vercel.com/) and import your GitHub repository.
2. Vercel auto-detects Vite settings. Click **Deploy**.
3. Go to **Project Settings** -> **Domains** to link your `.com` or `.in` domain.
