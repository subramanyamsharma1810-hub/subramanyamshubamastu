# 🌐 Bramhana Vivaha Vedika - GitHub & Netlify / Vercel Deployment Guide

This guide explains how to push your application repository to GitHub and publish it live on **Netlify** or **Vercel** with your custom domain (`shubhamastu.in`) and subdomains (`registration.shubhamastu.in`, `login.shubhamastu.in`, `admin.shubhamastu.in`).

---

### Step 1: Push Code to GitHub

1. **Create a New Repository on GitHub** (e.g., `shubhamastu-matrimony`).
2. Run the following commands in your terminal (or Git Bash) at your project root:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Shubhamastu Matrimony production build"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME.git
   git push -u origin main
   ```

---

### Step 2: Deploy on Netlify or Vercel

1. Go to [Netlify](https://www.netlify.com/) or [Vercel](https://vercel.com/) and log in with GitHub.
2. Import your repository (`shubhamastu-matrimony`).
3. Netlify/Vercel will automatically detect the build settings (`npm run build`, output: `dist`).
4. Click **Deploy**.

---

### Step 3: Connect Custom Domain & Subdomains (`shubhamastu.in`)

1. In your **Netlify/Vercel Dashboard**, go to **Domain management** -> **Add custom domain**:
   - Enter `shubhamastu.in` and `www.shubhamastu.in`.
2. **Subdomain Mapping (`registration.shubhamastu.in`, `login.shubhamastu.in`, `admin.shubhamastu.in`)**:
   - In your domain registrar (GoDaddy, Hostinger, Namecheap, Cloudflare, etc.), add **CNAME records**:
     - `Type: CNAME` | `Name: @` | `Value: your-site.netlify.app` (or Vercel target)
     - `Type: CNAME` | `Name: www` | `Value: your-site.netlify.app`
     - `Type: CNAME` | `Name: registration` | `Value: your-site.netlify.app`
     - `Type: CNAME` | `Name: login` | `Value: your-site.netlify.app`
     - `Type: CNAME` | `Name: admin` | `Value: your-site.netlify.app`
3. Netlify/Vercel will automatically issue free **SSL/TLS HTTPS Certificates** for all subdomains!
