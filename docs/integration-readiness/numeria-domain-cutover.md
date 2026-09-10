# Numeria independent-domain cutover checklist

Target: `https://numeria-studio.com`

Before changing Growth Engine Production runtime configuration:
- Numeria Studio domain resolves and loads the expected app
- Clerk login/registration flow works on the independent domain
- `/app/growth/start` exists and accepts the approved Growth Engine references
- `/api/sessions/start` remains compatible with the shared Session.Start contract
- Growth Engine CI is green

Then set `NUMERIA_STUDIO_BASE_URL` to the independent domain and perform one Production deployment. Verify the user handoff and server integration after deployment. If either fails, use the documented endpoint rollback without changing canonical business data.
