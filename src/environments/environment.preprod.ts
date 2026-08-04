// Pre-production (Hetzner). sslip.io resolves to the IP encoded in the hostname,
// which gives real Let's Encrypt certificates without owning a domain yet.
export const environment = {
  production: true,
  apiUrl: 'https://api.62-238-37-26.sslip.io',
};
