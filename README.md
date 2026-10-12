# Weather Dashboard

This repository contains a React/Vite client, an Express/MongoDB API with Socket.IO, and ESP weather-station firmware.

## Local development

1. Copy `server/.env.example` to `server/.env` and set your MongoDB connection and local admin credentials.
2. Install and start the API:

   ```sh
   cd server
   npm ci
   npm run dev
   ```

3. Copy `client/.env.example` to `client/.env`. For local development, set:

   ```dotenv
   VITE_API_URL=/api/v1
   VITE_SOCKET_URL=/
   ```

4. In another terminal, install and start the client:

   ```sh
   cd client
   npm ci
   npm run dev
   ```

The Vite development server proxies API and Socket.IO traffic to `http://localhost:5000`.

## Deploy the API to Render

1. Create a MongoDB Atlas database and allow network access from Render (or configure Atlas network access for your deployment).
2. In Render, create a Blueprint from this repository and use the included `render.yaml`. It creates the API web service from `server/`.
3. Set the prompted secrets/environment values:
   - `MONGODB_URI`: MongoDB Atlas connection string.
   - `FRONTEND_URL`: the exact Netlify site origin, such as `https://your-site.netlify.app` (no trailing slash). Multiple comma-separated origins are supported.
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD`: credentials for the initial administrator account.
4. Render generates `JWT_SECRET` for the service. Keep all secrets in the Render environment settings, never in Git.

The API health check is available at `/api/v1/health`. The free Render service may take a short time to wake after inactivity.

## Deploy the client to Netlify

1. Import this repository as a Netlify site. The included `netlify.toml` configures the client build and SPA fallback.
2. Set these environment variables in Netlify:
   - `VITE_API_URL`: `https://<your-render-service>.onrender.com/api/v1`
   - `VITE_SOCKET_URL`: `https://<your-render-service>.onrender.com`
3. Trigger a new deploy after setting the variables. Vite embeds them at build time.
4. Set the same Netlify site origin in the Render `FRONTEND_URL` variable.

After changing either service's environment variables, redeploy the relevant service. Authentication uses secure cross-site cookies in production, so the client and API must both use HTTPS.
