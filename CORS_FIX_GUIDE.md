# CORS Error Fix Guide

## Understanding the Error

**Error:** "No 'Access-Control-Allow-Origin' header is present on the requested resource"

**What it means:** 
- Your frontend (`https://fof-iota.vercel.app`) tries to make API requests to your backend (`https://fof-3m3x.onrender.com`)
- The browser first sends a "preflight" OPTIONS request to check if cross-origin requests are allowed
- The server must respond with proper CORS headers to allow the request
- If these headers are missing, the browser blocks the actual request for security

## What Was Fixed

The following changes were made to `server/src/index.ts`:

1. **Enhanced CORS Configuration:**
   - Added explicit `methods` array: `["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]`
   - Added `allowedHeaders`: `["Content-Type", "Authorization", "X-Requested-With"]`
   - Added `exposedHeaders`: `["Content-Type", "Authorization"]`
   - Enabled `credentials: true` for cookie/auth support

2. **Simplified OPTIONS Handler:**
   - Changed from manual handler to `app.options("*", cors())`
   - This lets the CORS middleware handle all preflight requests automatically

3. **Request Logging:**
   - Added middleware to log all requests: `→ METHOD URL | Origin: xxx`
   - Helps debug which requests hit the server

4. **Improved Error Handling:**
   - Added specific handler for CORS errors
   - Returns proper 403 status with clear error message

## How to Deploy to Render

### Option 1: Manual Deploy (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your backend service: `fof-3m3x`
3. Click the **"Manual Deploy"** button (top right)
4. Select **"Deploy latest commit"**
5. Wait 2-5 minutes for deployment to complete

### Option 2: Force Redeploy via Git

```bash
# Make a trivial change to trigger auto-deploy
cd /home/nikhil/Downloads/sport-sync-space-8a16796750e838d0897c0ad36f1a958af865a072
git commit --allow-empty -m "trigger redeploy"
git push origin main
```

## How to Verify the Fix

### 1. Check Render Deployment Logs

In Render Dashboard → Your Service → Logs, you should see:

```
CORS allowed origins: [ 'https://fof-iota.vercel.app', ... ]
Server running on port 3000
Environment: production
```

### 2. Test the Health Endpoint

Open this URL in your browser:
```
https://fof-3m3x.onrender.com/health
```

You should see:
```json
{"status":"ok","timestamp":"2025-11-10T..."}
```

### 3. Check Browser Network Tab

1. Open your frontend: `https://fof-iota.vercel.app`
2. Open DevTools (F12) → Network tab
3. Refresh the page
4. Look for requests to `fof-3m3x.onrender.com`
5. Check the **preflight OPTIONS request** (it appears before GET/POST requests)
6. It should show:
   - Status: `200 OK`
   - Response Headers should include:
     ```
     Access-Control-Allow-Origin: https://fof-iota.vercel.app
     Access-Control-Allow-Credentials: true
     Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
     ```

### 4. Check for Request Logs

In Render logs, you should see:
```
→ OPTIONS /api/calendar | Origin: https://fof-iota.vercel.app
→ GET /api/calendar | Origin: https://fof-iota.vercel.app
```

## Troubleshooting

### Issue: Still getting CORS error after deploy

**Solution:** Clear your browser cache
```bash
# Chrome/Edge: Ctrl+Shift+Delete → Clear cached images and files
# Or use Incognito/Private mode
```

### Issue: Render not auto-deploying

**Solution:** Check auto-deploy settings
1. Render Dashboard → Your Service → Settings
2. Scroll to "Build & Deploy"
3. Ensure "Auto-Deploy" is set to "Yes"

### Issue: Build fails on Render

**Solution:** Check build logs for errors
1. Render Dashboard → Your Service → Events
2. Click on the failed deploy
3. Check the build output for TypeScript errors

### Issue: Server crashes after deploy

**Solution:** Check environment variables
1. Ensure `DATABASE_URL` is set correctly
2. Ensure `FRONTEND_URL` is set (optional, defaults to fof-iota.vercel.app)
3. Check `NODE_ENV` is set to `production`

## Additional Configuration (Optional)

If you need to allow more origins, you can set the `ALLOWED_ORIGINS` environment variable in Render:

```
ALLOWED_ORIGINS=https://example.com,https://another-domain.com
```

This will be added to the allowed origins list automatically.

## Summary

✅ **Code is fixed and committed** (commit: 1045f79)
✅ **Code is pushed to origin/main**
✅ **Build succeeds locally**
⏳ **Needs manual redeploy on Render**

Once Render redeploys with the latest code, the CORS error should be resolved!

