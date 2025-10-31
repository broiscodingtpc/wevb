# Deployment Guide - Railway

## Prerequisites

1. Railway account: https://railway.app
2. GitHub account
3. Git installed locally

## Deployment Steps

### 1. Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial commit: MetaPulse AI Signal Console"
```

### 2. Push to GitHub

```bash
# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/metapulse-ai.git
git branch -M main
git push -u origin main
```

### 3. Deploy on Railway

1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Authorize Railway to access your GitHub
5. Select the `metapulse-ai` repository
6. Railway will automatically detect the project and deploy

### 4. Configure Environment (Optional)

In Railway dashboard:
- Go to "Variables"
- Add any environment variables if needed:
  - `PORT` (default: 3000)
  - `NODE_ENV=production`

### 5. Get Your Domain

Railway automatically provides:
- A `.railway.app` domain
- SSL/HTTPS automatically configured

Optionally generate a custom domain:
1. Go to "Settings"
2. Click "Generate Domain"
3. Or add your custom domain

## Post-Deployment

Your site will be live at: `https://your-app.railway.app`

## Troubleshooting

### Build Fails
- Check Railway logs in dashboard
- Ensure `package.json` is correct
- Verify Node.js version compatibility

### 404 Errors
- Ensure `metapulse-wow.html` exists in root
- Check Express routing in `server.js`

### Performance Issues
- Railway includes CDN by default
- Images should be optimized
- Consider adding caching headers

## Continuous Deployment

Railway automatically deploys on every push to main branch.

To disable auto-deploy:
1. Go to Project Settings
2. Modify deployment triggers

## Monitoring

Railway provides:
- Real-time logs
- Metrics dashboard
- Error tracking
- Uptime monitoring

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway

