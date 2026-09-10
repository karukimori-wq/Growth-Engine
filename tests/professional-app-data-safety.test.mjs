import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Numeria handoff stays reference-only", async () => {
  const source = await read("src/lib/screen-flow.ts");
  const numeriaSection = source.slice(
    source.indexOf("export function createNumeriaStartUrl"),
    source.indexOf("export function createGrowthReturnUrl"),
  );

  for (const required of ["workspaceId", "userId", "reservationId", "customerId", "start_appraisal_session"]) {
    assert.match(numeriaSection, new RegExp(required));
  }

  for (const forbidden of ["paymentStatus", "salesAmount", "reportBody", "transcript", "apiKey", "promptData"]) {
    assert.doesNotMatch(numeriaSection, new RegExp(forbidden, "i"));
  }
});

test("Velvet Visit integration keeps sensitive business and professional data out", async () => {
  const source = await read("src/app/api/integrations/velvet/visit-start-test/route.ts");

  for (const safetyFlag of [
    /customerMasterSent\s*:\s*false/,
    /paymentStatusSent\s*:\s*false/,
    /salesAmountSent\s*:\s*false/,
    /stripeDataSent\s*:\s*false/,
    /fullProfessionalNotesSent\s*:\s*false/,
  ]) {
    assert.match(source, safetyFlag);
  }
});
