# Professional integration data safety

Cross-app requests should carry the minimum references needed to continue the workflow.

Numeria Studio handoff may carry workspace/user/reservation/customer references and an approved intent. Growth Engine must not send payment status, sales amount, report body, full consultation text, API keys, secrets, or prompt data through this handoff.

Velvet Visit handoff may carry workspace/user/customer/reservation references and intent. Growth Engine must not send full customer master data, payment state, sales amount, Stripe data, or full professional notes.

These exclusions are release invariants and should remain covered by contract tests when integration code changes.
