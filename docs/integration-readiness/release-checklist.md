# Professional integration release checklist

Before a Numeria Studio or Velvet integration release:

- non-production CI is green
- `workspaceId + userId` identity remains intact
- no `professionalId` requirement is introduced for MVP
- Growth Engine remains canonical for Customer, Reservation, customer Payment, and Sales
- Numeria payloads remain reference-only and do not contain payment/sales/report-body/transcript/secret data
- Velvet projections remain narrow and do not expose Reservation/Payment/Sales or full professional memory
- Free/Pro do not authorize Business APIs
- Business remains unavailable unless the shared offering status and feature flag explicitly enable it
- required runtime base URLs are configured before Production deployment
- Production workflow is run once at the release boundary, after CI and runtime configuration are ready
