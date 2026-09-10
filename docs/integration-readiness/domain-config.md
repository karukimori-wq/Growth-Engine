# Domain configuration principle

Professional app domains should be runtime configuration rather than hardcoded release logic whenever practical. This lets a verified endpoint move between hosting/domain providers without changing the cross-app contract.

A domain change must preserve paths, identity, payload minimization, authentication, observability, entitlement behavior, and canonical ownership.
