# Velvet integration boundary

Growth Engine exposes only the narrow Customer integration required for Velvet to reference/create canonical Growth Engine customers. The response projection remains limited to the approved customer reference and display information.

Velvet Visit integration uses `VELVET_BASE_URL` and reference-only request data. It must not become a route for Reservation, Payment, Sales, Stripe data, full customer master data, or full professional notes.

This integration remains available independently of future Business offering status and does not grant Business entitlement.
