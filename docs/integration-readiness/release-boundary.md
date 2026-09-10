# Release boundary

A Professional integration release boundary is reached when code/contract/docs changes are green in CI and required external runtime configuration is known.

At that point, batch the runtime-variable update and Production deployment together, then verify the affected handoff/API once. Do not repeatedly deploy Production while ordinary code failures are still being resolved in CI.
