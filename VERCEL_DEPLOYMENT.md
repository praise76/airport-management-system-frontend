# Vercel Deployment Guide for TanStack Start

This project is configured to deploy on Vercel with TanStack Start SSR.

## Configuration Files

### `vercel.json`

- Configures the build output directory (`dist/client`)
- Sets up rewrites to route all requests through the serverless function
- Configures the serverless function runtime and resources

### `api/server.js`

- Serverless function handler that bridges Vercel's request/response format with TanStack Start's Request/Response API
- Dynamically imports the built server entry from `dist/server/server.js`
- Handles ESM module loading and request/response conversion

## Build Process

1. Vercel runs `pnpm build` which creates:

   - `dist/client/` - Static assets for the client
   - `dist/server/` - Server-side code including `server.js`

2. The serverless function at `api/server.js` imports and uses the server entry

3. All routes are rewritten to `/api/server` which handles SSR

## Troubleshooting

### 404 Errors

- Ensure `vercel.json` is in the root directory
- Check that `api/server.js` exists and is properly configured
- Verify the build output includes `dist/server/server.js`
- Check Vercel deployment logs for import errors

### Module Import Errors

- Ensure `package.json` has `"type": "module"` (already set)
- The dynamic import in `api/server.js` should handle ESM modules
- Check that all server dependencies are included in the build

### Request/Response Issues

- The handler converts between Vercel's format and Web Request/Response API
- Check Vercel function logs for any conversion errors
- Ensure headers are properly forwarded

## Environment Variables

Make sure to set any required environment variables in Vercel:

- `VITE_API_BASE_URL` - Your API base URL
- Any other environment variables your app needs

## Additional Notes

- The serverless function has 1GB memory and 30s max duration
- Static assets are served from `dist/client`
- All dynamic routes go through the serverless function for SSR
