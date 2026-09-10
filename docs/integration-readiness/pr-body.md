# Proposed PR body

## Summary
- replace stale fixed Numeria deployment guidance with runtime-configurable independent-domain cutover/rollback steps
- document Numeria/Velvet identity, ownership, data-safety, Business, CI, and release boundaries
- add Professional integration data-safety regression tests

## Verification
- PR CI: install, typecheck, contract tests, Next build, OpenNext/Cloudflare build

## Safety
- no Production deployment
- no Business enablement
- no Free/Pro entitlement change
- no D1 schema change
- no secret values
