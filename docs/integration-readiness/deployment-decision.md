# Current deployment decision

Do not run Cloudflare Production for this readiness/documentation batch.

Reason: the actual Numeria cutover depends on the target independent domain and authentication flow being verified plus the Growth Engine runtime variable being set. The branch can be fully validated and merged through CI first, then the eventual domain switch can be deployed once at the release boundary.
