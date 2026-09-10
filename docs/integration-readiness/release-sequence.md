# Release sequence

Code/docs/tests → green PR CI → merge to main → verify target Numeria domain/auth → configure Growth Engine runtime base URL → one Cloudflare Production deployment → post-deploy handoff/API verification → later legacy-fallback cleanup.
