# External Intelligence development integration

Growth Engine uses External Intelligence System (EIS) only as development intelligence. EIS does not own Growth Engine Customer, Reservation, Payment, Sales, or Public Site business records.

## Development identity

Use the following identity when retrieving development context:

- `workspaceId`: `professional-platform-dev`
- `appId`: `growth-engine`
- `componentId`: `web`
- `projectId`: `Growth-Engine`
- `repository`: `karukimori-wq/Growth-Engine`

Repository HEAD alone is not sufficient to treat development context as fresh. Shared Knowledge changes must be able to refresh context.

## Automated result recording

Two non-blocking GitHub Actions workflows record evidence through GitHub OIDC without a long-lived EIS token in this repository.

- `external-intelligence-ci-result.yml`: records successful main CI as `implementation_result`.
- `external-intelligence-production-result.yml`: records successful manual Cloudflare Production runs with the Production checks the deployment workflow actually establishes.

CI success does not imply Production usability. The Production workflow currently establishes deployment identity, authorization boundaries, D1 readiness, and Customer/Reservation persistence roundtrip, but it does not prove intended-user UI operation or human verification. External integrations are not marked verified unless their actual execution is established by the source workflow.

## Production success rule

Do not promote Growth Engine knowledge to `production_verified_success` solely because code exists, CI is Green, documentation says complete, or Production APIs respond. Confirm the intended user-facing route, correct plan/role behavior, persistence/readback, required integrations, and human-visible behavior when those dimensions apply.
