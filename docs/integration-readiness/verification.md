# Readiness verification

The branch is ready to merge only when the non-production CI workflow succeeds for:

- dependency installation
- TypeScript typecheck
- contract tests, including Professional app data-safety checks
- Next.js build
- Cloudflare/OpenNext build

A green readiness CI result does not itself mean the Numeria independent-domain runtime variable has been deployed. Runtime cutover is a separate release step.
