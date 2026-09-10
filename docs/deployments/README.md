# Deployment workflow policy

Growth Engine separates code verification from Production deployment.

- `.github/workflows/ci.yml` is the routine verification path for pull requests and pushes to `main`. It installs dependencies and runs typecheck, contract tests, Next.js build, and Cloudflare/OpenNext build.
- `.github/workflows/cloudflare-production.yml` is the Production release path. It must not be used merely to discover ordinary code or contract-test failures.

A normal change should reach a green CI result before a Production run is requested. Runtime-variable changes and external-service cutovers should be batched with the related code/documentation changes so the user is asked for a Production run only at a meaningful release boundary.
