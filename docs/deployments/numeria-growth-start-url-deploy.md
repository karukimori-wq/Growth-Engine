# Numeria growth start URL deployment

This file triggers a production deployment after fixing Growth Engine's Numeria Studio handoff URL.

- Fixed source: `src/lib/screen-flow.ts`
- Required target path: `/app/growth/start`
- Required base URL: `https://numeria-studio.illusionddt.chatgpt.site`
- Safety: handoff URL contains reference IDs only and excludes payment, sales, report body, transcript, API key, and prompt data.
