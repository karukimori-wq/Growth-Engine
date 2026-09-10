# Integration invariants

The following must remain true across endpoint/domain changes:

- workspaceId + userId identity
- Growth Engine canonical Customer/Reservation/customer Payment/Sales ownership
- Numeria canonical Session/Report/appraisal ownership
- Velvet canonical professional-memory/Visit/timeline ownership
- minimal reference-only cross-app payloads
- no secret values in source/docs/tests
- Free/Pro do not authorize Business
- Business remains unavailable until explicitly enabled by shared contract and feature gating
