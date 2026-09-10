# Post-deploy verification

After the Numeria independent-domain release:

- open the Growth Engine handoff path and confirm it reaches Numeria `/app/growth/start`
- confirm workspace/user/reservation/customer references are preserved
- confirm no forbidden payment/sales/report/transcript/secret fields appear in the handoff
- run the Session.Start integration check and confirm the expected Studio event contract
- verify Growth Engine Customer/Reservation/Payment/Sales behavior is unchanged

If the handoff or server integration fails, rollback only the Numeria base URL and redeploy once.
