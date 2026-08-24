// Pre-production (Hetzner), on smiletimeclinic.rs — the real domain, replacing
// the sslip.io hostnames this used before. The `preprod.` prefix is deliberate:
// production will take the bare api. / admin. names on the same domain.
export const environment = {
  production: true,
  apiUrl: 'https://preprod.api.smiletimeclinic.rs',
};
