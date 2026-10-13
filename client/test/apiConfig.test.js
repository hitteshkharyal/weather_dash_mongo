import assert from 'node:assert/strict';
import test from 'node:test';
import { PRODUCTION_API_BASE_URL, resolveApiConfig } from '../src/config/api.js';

test('production defaults to the deployed Render API and sensor ingest endpoint', () => {
  const config = resolveApiConfig({
    isProduction: true,
    origin: 'https://weatherdashhitesh.netlify.app',
  });

  assert.equal(config.apiBaseUrl, PRODUCTION_API_BASE_URL);
  assert.equal(config.socketBaseUrl, 'https://weather-dash-mongo.onrender.com');
  assert.equal(
    config.sensorDataUrl,
    'https://weather-dash-mongo.onrender.com/api/v1/sensors/data'
  );
});

test('production ignores a relative API URL that would point to the frontend host', () => {
  const config = resolveApiConfig({
    apiUrl: '/api/v1',
    isProduction: true,
    origin: 'https://weatherdashhitesh.netlify.app',
  });

  assert.equal(config.apiBaseUrl, PRODUCTION_API_BASE_URL);
  assert.equal(
    config.sensorDataUrl,
    'https://weather-dash-mongo.onrender.com/api/v1/sensors/data'
  );
});

test('local firmware URL uses the LAN origin serving the dashboard', () => {
  const config = resolveApiConfig({
    isProduction: false,
    origin: 'http://192.168.137.1:3000',
  });

  assert.equal(config.apiBaseUrl, '/api/v1');
  assert.equal(config.socketBaseUrl, '/');
  assert.equal(
    config.sensorDataUrl,
    'http://192.168.137.1:3000/api/v1/sensors/data'
  );
});

test('configured API and socket overrides are respected', () => {
  const config = resolveApiConfig({
    apiUrl: 'https://api.example.com/api/v1/',
    socketUrl: 'https://socket.example.com',
    isProduction: true,
    origin: 'https://weatherdashhitesh.netlify.app',
  });

  assert.equal(config.apiBaseUrl, 'https://api.example.com/api/v1');
  assert.equal(config.socketBaseUrl, 'https://socket.example.com');
  assert.equal(config.sensorDataUrl, 'https://api.example.com/api/v1/sensors/data');
});
