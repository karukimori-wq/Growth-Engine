# Release owner actions

Only at the actual Numeria independent-domain release boundary, the deployment owner needs to:

1. confirm the target Numeria domain/auth flow is working
2. set Growth Engine `NUMERIA_STUDIO_BASE_URL` to the verified target in Cloudflare runtime variables
3. run the Cloudflare Production workflow once
4. verify the handoff and Session.Start integration

No owner action is required while this readiness branch is being validated through CI.
