# Production API versus integration checks

Routes named `*-test` are integration checks and must not be treated as the final production cross-app API contract simply because they can reach an upstream service.

Production-grade cross-app APIs should be added only when the shared contracts require them, with explicit authentication, entitlement, payload validation, observability, error semantics, and canonical ownership boundaries.
