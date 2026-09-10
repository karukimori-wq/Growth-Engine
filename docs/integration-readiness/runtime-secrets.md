# Runtime variables and secrets

Public base URLs such as `NUMERIA_STUDIO_BASE_URL` and `VELVET_BASE_URL` are routing configuration. Authentication credentials such as integration secrets remain secret values.

Never place secret values in `.env.example`, documentation, test fixtures, PR descriptions, or observability output. A domain cutover should require only the public base URL to change unless the external authentication provider itself requires a separately managed secret rotation.
