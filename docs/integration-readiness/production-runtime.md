# Professional app runtime variables

Public application base URLs are configuration, not secrets. Secret integration credentials remain separate and must never be committed.

Growth Engine currently recognizes these endpoint variables:

- `NUMERIA_STUDIO_BASE_URL`: server-side Numeria Studio integration base URL. Independent-domain target: `https://numeria-studio.com` after verification.
- `VELVET_BASE_URL`: Velvet integration base URL.
- `SNS_PLANNER_BASE_URL`: SNS Planner integration base URL where supported by the calling surface.

Changing a base URL does not grant an entitlement and must not change canonical data ownership. A domain cutover should be verified with the same reference-only payload and Business guardrails used before the cutover.
