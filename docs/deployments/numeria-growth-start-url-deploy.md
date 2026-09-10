# Numeria Growth Start URL deployment

Growth Engine's Numeria Studio handoff endpoint is configurable so a domain cutover does not require a source-code edit.

## Current integration boundary

- Handoff source: `src/lib/screen-flow.ts`
- Session.Start integration check: `src/app/api/integrations/numeria-studio/session-start-test/route.ts`
- Required target path: `/app/growth/start`
- Server integration base URL variable: `NUMERIA_STUDIO_BASE_URL`
- Current fallback: `https://numeria-studio.illusionddt.chatgpt.site`
- Intended independent-domain target after verification: `https://numeria-studio.com`

## Cutover procedure

1. Verify `https://numeria-studio.com` serves the expected Numeria Studio application and authentication flow.
2. In the Growth Engine Cloudflare Worker runtime variables, set `NUMERIA_STUDIO_BASE_URL=https://numeria-studio.com`.
3. Run the Cloudflare Production workflow once at the release boundary; do not use Production deployment as routine code CI.
4. Verify the Growth Engine → Numeria handoff reaches `/app/growth/start` and the Session.Start integration check reaches `/api/sessions/start`.
5. Keep the previous endpoint available as rollback context until the independent-domain flow is verified.

## Safety constraints

The handoff may contain only the approved reference context (`workspaceId`, `userId`, `reservationId`, `customerId`, and intent). It must not include payment status, sales amount, report body, consultation transcript, API keys, secrets, or prompt data.

This cutover does not enable Business. Free/Pro entitlement behavior, Business offering status, D1 schema, and canonical ownership boundaries remain unchanged.
