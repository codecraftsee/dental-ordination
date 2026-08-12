// Production is not wired up yet — there is no prod server and no domain.
// This host is deliberately unresolvable (.invalid is reserved by RFC 2606) so
// a prod bundle fails loudly instead of silently talking to the wrong backend.
// It replaces the retired Railway API, which still answered on DNS and so read
// as working while returning 404 to everything.
//
// Replace with api.ourdomain.rs — or api.<dashed-ip>.sslip.io in the interim,
// the pattern preprod uses — when the prod box exists. See
// .github/workflows/deploy-prod.yml for everything else that has to happen first.
export const environment = {
  production: true,
  apiUrl: 'https://api.CHANGE-ME.invalid',
};
