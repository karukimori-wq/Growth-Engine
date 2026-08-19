# Growth Engine Agent Instructions

Before substantial coding, debugging, deployment, persistence, integration, or production-readiness work, consult `karukimori-wq/ai-development-intelligence`.

Start with its `AGENTS.md`, `core/task-retrieval-protocol.md`, compact index/ranking, and `memory/growth-engine/`. Retrieve only relevant intelligence; do not bulk-load the library.

## Operational learning

For substantial tasks, follow `core/operational-learning-loop.md` in the intelligence repository. Use one non-sensitive `taskRunId` to correlate retrieval/use/rejection/extraction events when event capture is available. Record usefulness only after verification; retrieval alone is not `knowledge_used`.

## Authority

Current Growth Engine code is authoritative for implementation. `professional-platform-contracts` is authoritative for formal contracts. Learned intelligence is advisory and must be revalidated against current code/contracts.

## After meaningful work

Run the knowledge-extraction review. Capture only reusable discoveries, failures/root causes, decisions, repeated patterns, contradictions, or evidence that can change a future engineering decision. Prefer updating existing knowledge over duplicates.

Never copy secrets, credentials, connection strings, tokens, customer/personal data, or raw sensitive logs into development intelligence.