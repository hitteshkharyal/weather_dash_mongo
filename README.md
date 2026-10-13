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
   - `VITE_SOCKET_URL` (optional): `https://<your-render-service>.onrender.com`. If omitted, the client derives the Socket.IO host from `VITE_API_URL`.
3. Trigger a new deploy after setting the variables. Vite embeds them at build time.
4. Set the same Netlify site origin in the Render `FRONTEND_URL` variable.

After changing either service's environment variables, redeploy the relevant service. Authentication uses secure cross-site cookies in production, so the client and API must both use HTTPS.

## Assign sensors and generate ESP firmware

1. Sign in as an administrator and open **Admin Console → Sites**.
2. Use the radio icon on a site to assign sensors from the supported 15-item environmental sensor catalog. The selected sensors are listed on the site dashboard; unassigned sensor data is rejected by the API.
3. Use **Firmware** to choose ESP32 or ESP8266, enter the site device API key (pre-filled from the site) and Wi-Fi name/password, and generate `config.h` plus `weather_station.ino`. Keep `config.h` private: it contains Wi-Fi credentials and the site's device API key.
4. Put both generated files in the same Arduino sketch folder, select the matching board, install the libraries listed below, and compile before flashing.

The firmware supports BME280, DHT11, DHT22, BMP280, SCD41, MQ-2, MQ-3, MQ-7, MQ-135, LTR390, BH1750, rain-drop, soil-moisture, anemometer, and wind-vane sensors. MQ sensors report raw ADC values, not calibrated gas concentration; sensor-specific calibration and warm-up are required before interpreting those readings. ESP8266 has only one analog input, and ESP32 has a limited number of Wi-Fi-compatible ADC inputs, so multiple analog sensors may require an external multiplexer and pin changes. BME280 and BMP280 also need compatible, non-conflicting I2C addresses.

Install the Arduino libraries for Adafruit BME280, Adafruit BMP280, DHT sensor, Adafruit Unified Sensor, Sensirion I2C SCD4x, Adafruit LTR390, BH1750, and ArduinoJson. HTTPS firmware generation requires the API server's root CA certificate in PEM format; certificate verification remains enabled. Local HTTP URLs may be used for development on a trusted network.

## Local test database

Keep the production `MONGODB_URI` in the production service's private environment settings. To run the server against the local test database, use `NODE_ENV=test` and `MONGODB_TEST_URI=mongodb://localhost:27017/weather_test_db`; do not point production deployments at the test URI. The tracked `server/.env.example` documents both variables.
