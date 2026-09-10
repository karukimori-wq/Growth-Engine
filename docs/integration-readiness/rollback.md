# Numeria endpoint rollback

If the independent Numeria Studio domain fails after cutover, restore `NUMERIA_STUDIO_BASE_URL` to the previously verified Numeria endpoint and redeploy Growth Engine once.

Rollback must not modify Customer, Reservation, Payment, Sales, entitlement, or D1 data. The endpoint change is transport configuration only.

After rollback, verify `/app/growth/start` handoff and `/api/sessions/start` integration behavior before resuming the independent-domain cutover.
