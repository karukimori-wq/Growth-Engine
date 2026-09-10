# Numeria Studio integration boundary

Growth Engine starts Numeria Studio work using approved references rather than copying professional content into the business system.

User handoff:
- destination path: `/app/growth/start`
- references: workspace, user, reservation, customer
- intent: start appraisal session

Server integration check:
- destination path: `/api/sessions/start`
- base URL configured by `NUMERIA_STUDIO_BASE_URL`

Numeria Studio owns Session, Report, calculation/appraisal results, and Numeria snapshots. Growth Engine must not absorb those canonical records or send payment/sales/full-report/full-transcript/secret data as part of the handoff.
