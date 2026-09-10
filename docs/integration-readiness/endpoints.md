# Professional endpoint paths

Numeria Studio:
- user handoff: `/app/growth/start`
- Session.Start integration check: `/api/sessions/start`

Velvet:
- Growth Engine Customer integration remains under the existing `/api/integrations/velvet/customers` boundary
- Visit integration check uses the configured Velvet base URL and `/api/visits`

Paths should remain stable through hosting/domain cutovers unless a shared contract change explicitly requires otherwise.
