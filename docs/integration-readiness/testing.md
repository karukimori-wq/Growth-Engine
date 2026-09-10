# Professional integration testing

Contract tests should fail if an integration accidentally expands sensitive payloads or drops required reference identity. Tests should focus on stable boundaries rather than external-service availability.

External domain/auth availability is verified separately at the release boundary so transient provider behavior does not turn routine code CI into a Production deployment loop.
