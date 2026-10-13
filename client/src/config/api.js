export const PRODUCTION_API_BASE_URL = 'https://weather-dash-mongo.onrender.com/api/v1';

function isAbsoluteUrl(value) {
  return /^[a-z][a-z\d+.-]*:\/\//i.test(value);
}

export function resolveApiConfig({ apiUrl, socketUrl, isProduction, origin }) {
  const configuredApiUrl = apiUrl?.trim();
  const candidateApiUrl = configuredApiUrl || (isProduction ? PRODUCTION_API_BASE_URL : '/api/v1');
  const apiBaseUrl = (
    isProduction && !isAbsoluteUrl(candidateApiUrl)
      ? PRODUCTION_API_BASE_URL
      : candidateApiUrl
  ).replace(/\/+$/, '');
  const parsedApiUrl = new URL(apiBaseUrl, origin);
  const apiPath = parsedApiUrl.pathname.replace(/\/+$/, '');
  const configuredSocketUrl = socketUrl?.trim();
  const socketBaseUrl = configuredSocketUrl && (!isProduction || isAbsoluteUrl(configuredSocketUrl))
    ? configuredSocketUrl
    : isAbsoluteUrl(apiBaseUrl)
      ? parsedApiUrl.origin
      : '/';

  return {
    apiBaseUrl,
    socketBaseUrl,
    sensorDataUrl: `${parsedApiUrl.origin}${apiPath}/sensors/data`,
  };
}

const viteEnv = import.meta.env || {};

export const API_CONFIG = resolveApiConfig({
  apiUrl: viteEnv.VITE_API_URL,
  socketUrl: viteEnv.VITE_SOCKET_URL,
  isProduction: viteEnv.PROD,
  origin: globalThis.window?.location?.origin || 'http://localhost',
});
