# Cutover risk controls

Risk is reduced by keeping the domain change separate from schema, entitlement, and ownership changes. The cutover should change only the verified endpoint configuration, then validate navigation and Session.Start behavior.

If verification fails, rollback the endpoint configuration. Do not attempt compensating business-data migrations for a routing failure.
