# Professional integration release gate

A Production release request should not be made until all of these are true:

- relevant main/PR CI is green
- target external domain/service is confirmed available
- required runtime configuration is known
- rollback value is known
- post-deploy verification steps are defined

This gate exists to batch deployment work and avoid repeated Production runs during ordinary development.
