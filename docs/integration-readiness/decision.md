# Endpoint cutover decision

Decision: prepare Numeria Studio's independent-domain move as a runtime endpoint change, not a product-contract or database migration.

This minimizes risk: the shared paths and reference payload stay stable, while rollback is limited to restoring the previous base URL and redeploying.
