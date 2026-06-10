# Deploy to Vercel

1. Push to GitHub
2. Import repo at vercel.com/new
3. Framework: Vite (auto-detected)
4. No environment variables required
5. Click Deploy

# Custom domain
1. Vercel dashboard → Domains → Add domain
2. Add CNAME record at DNS provider pointing to cname.vercel-dns.com

# Update deployment
`git push origin main`  ← triggers automatic redeploy
