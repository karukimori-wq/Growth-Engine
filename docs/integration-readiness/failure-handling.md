# Integration failure handling

A Professional app outage or domain problem must not corrupt Growth Engine's canonical business data. Treat upstream availability failures as integration failures and keep Customer/Reservation/Payment/Sales state owned locally by Growth Engine.

Endpoint rollback is preferred over schema/data changes when the failure is purely routing or external-service availability.
