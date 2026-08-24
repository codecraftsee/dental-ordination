// Production is not wired up yet — there is no prod server and no domain.
// This host is deliberately unresolvable (.invalid is reserved by RFC 2606) so
// a prod bundle fails loudly instead of silently talking to the wrong backend.
// It replaces the retired Railway API, which still answered on DNS and so read
// as working while returning 404 to everything.
//
// Replace with api.smiletimeclinic.rs when the prod box exists. The bare api.
// name is reserved for production; preprod sits on preprod.api. of the same
// domain. See .github/workflows/deploy-prod.yml for everything else that has
// to happen first.
export const environment = {
  production: true,
  apiUrl: 'https://api.CHANGE-ME.invalid',
};
