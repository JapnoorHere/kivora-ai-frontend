export const environment = {
  production: true,
  // Same-origin by default so the auth cookie is first-party. Point this at the
  // deployed API host and add that origin to the backend's ALLOWED_ORIGINS.
  apiUrl: '/api/v1',
};
