# Future Numeria release request

When all prerequisites are ready, the deployment request should be a single action bundle:

- set Growth Engine runtime variable `NUMERIA_STUDIO_BASE_URL` to `https://numeria-studio.com`
- run `Cloudflare Production` once
- report the workflow result so handoff and Session.Start verification can continue

Do not send this request before the independent domain/auth flow is verified.
