# Quick Deployment Checklist

## Backend (Render)
- [ ] Create Azure SQL Database
- [ ] Update connection string in `appsettings.json`
- [ ] Push code to GitHub
- [ ] Connect repository to Render
- [ ] Set environment variables
- [ ] Deploy and test API endpoints

## Frontend (Netlify)
- [ ] Update `environment.prod.ts` with backend URL
- [ ] Run `npm run build`
- [ ] Deploy `dist/growurbuisness-ui` to Netlify
- [ ] Test all features work

## URLs to Update
Replace placeholders:
- `YOUR_SERVER.database.windows.net` in backend
- `https://your-backend-url.onrender.com` in frontend

## Test Endpoints
- GET `/api/dashboard/stats`
- GET `/api/reports/sales`
- GET `/api/reports/purchase`
- GET `/api/reports/purchase/detailed`

## Final URLs
- Frontend: `https://your-app.netlify.app`
- Backend: `https://your-backend.onrender.com/api`
