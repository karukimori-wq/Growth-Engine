# Integration CI policy

Professional integration changes should be validated in pull requests without touching Production.

Required routine checks:
- dependency installation
- TypeScript typecheck
- contract tests
- Next.js build
- Cloudflare/OpenNext build

Production deployment is a separate release action. This keeps code failures, contract failures, and build failures out of the Production workflow and allows related fixes to be batched before a single deployment request.
