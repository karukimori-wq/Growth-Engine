# Integration observability

Professional integration checks should preserve trace/correlation/request identifiers where already supported and use the shared integration status vocabulary: `success`, `warning`, `error`, `skipped`.

Observability must not log payment secrets, Stripe data, full consultation/report content, full professional notes, API keys, or integration secrets.
