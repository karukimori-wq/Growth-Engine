# External verification separation

CI verifies Growth Engine code and contracts. The Numeria domain and Clerk flow are external runtime prerequisites and are verified separately before deployment. Keeping these checks separate avoids turning external availability into noisy code CI failures.
