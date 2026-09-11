# Numeria Growth.Start URL deployment

Growth Engine supports configurable Professional app endpoints, so the Numeria Studio handoff can move to an independent domain without another source-code change.

## Source of truth

- Handoff source: `src/lib/screen-flow.ts`
- User-facing target path: `/app/growth/start`
- Server-side integration check: `src/app/api/integrations/numeria-studio/session-start-test/route.ts`
- Session.Start target path: `/api/sessions/start`
- Cloudflare runtime defaults: `wrangler.jsonc`

## Configuration

The Growth Engine Cloudflare Worker runtime variable is:

```text
NUMERIA_STUDIO_BASE_URL=https://numeria-studio.com
```

Keep the value as an origin only. Do not include `/app/growth/start` or `/api/sessions/start`; Growth Engine appends those paths itself.

`wrangler.jsonc` already carries this default for the Worker deployment bundle. If Cloudflare dashboard runtime variables override repository defaults, confirm the dashboard value matches the same origin before the release-boundary deploy.

If the variable is not configured in a runtime that reads `src/lib/screen-flow.ts`, the current code fallback remains:

```text
https://numeria-studio.illusionddt.chatgpt.site
```

That fallback is intentionally preserved so local or incomplete environments do not break while the independent-domain cutover is prepared.

## Safety boundary

The Growth Engine handoff URL must continue to send reference IDs only:

- `workspaceId`
- `userId`
- `reservationId`
- `customerId`
- `intent=start_appraisal_session`

It must not send payment status, sales amount, report body, full transcript, API keys, secret prompts, or professional-memory content.

## Release sequence

1. Confirm `https://numeria-studio.com` is accessible and Clerk login works in Numeria Studio.
2. Confirm Growth Engine `wrangler.jsonc` and any Cloudflare dashboard override both use `NUMERIA_STUDIO_BASE_URL=https://numeria-studio.com`.
3. Run the Growth Engine Cloudflare Production workflow once at the release boundary.
4. Confirm `/health`, `/version`, `/contracts/status`, and `/api/persistence/status` stay green.
5. Confirm a Growth Engine reservation handoff opens Numeria Studio `/app/growth/start` with only the approved reference parameters.

Do not rerun the Production workflow for every small code change. Use the non-production CI workflow for PR validation first, then deploy once after the batch is ready.
