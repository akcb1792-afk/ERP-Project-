# ERP Demo Site Deployment Checklist

## Backend (Render) - REQUIRED
- [ ] Sign up/login to Render.com
- [ ] Connect GitHub repo: akcb1792-afk/ERP-Project-
- [ ] Set runtime: C#
- [ ] Set build command: dotnet build
- [ ] Set start command: dotnet run
- [ ] Set root directory: GrowURBuisness.API
- [ ] Add environment variable: ASPNETCORE_ENVIRONMENT=Production
- [ ] Deploy and get backend URL

## Database (Azure SQL) - REQUIRED
- [ ] Create Azure SQL Database (free tier)
- [ ] Get connection string
- [ ] Add connection string to Render environment variables
- [ ] Test database connection

## Frontend (Netlify) - REQUIRED
- [ ] Update environment.prod.ts with backend URL
- [ ] Run: npm run build
- [ ] Deploy dist/growurbuisness-ui to Netlify
- [ ] Test all features work

## Final Testing
- [ ] Test dashboard loads
- [ ] Test sales reports
- [ ] Test purchase reports
- [ ] Test navigation between pages
- [ ] Verify CORS is working

## Expected URLs
- Backend: https://your-app-name.onrender.com/api
- Frontend: https://your-app-name.netlify.app

## Cost: $0/month (using free tiers)
