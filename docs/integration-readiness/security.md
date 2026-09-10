# Professional integration security boundary

Endpoint base URLs may be configured as runtime variables because they are public routing information. Authentication credentials, integration secrets, API keys, Stripe data, and other secret values must remain in secret storage and must never be committed to endpoint documentation or test fixtures.

Changing an endpoint variable must not weaken source-app authentication, workspace/user identity checks, entitlement checks, or minimal-data projections.
