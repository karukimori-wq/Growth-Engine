# Minimum payload rule

Cross-app payloads should contain only identifiers and small allowlisted context required for the next app to continue the workflow. If a field is not required for the receiving app to resolve its own canonical state, do not copy it across the boundary.
