import packageJson from "../../package.json";

export const appName = "growth-engine";
export const contractVersion = "0.1.0";
export const appVersion = packageJson.version;

export function getTimestamp(): string {
  return new Date().toISOString();
}

export function getCommitSha(): string | undefined {
  return process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT_SHA;
}

export type ContractStatus = "ok" | "warning" | "error";

export type ContractStatusResponse = {
  appName: typeof appName;
  status: ContractStatus;
  contractVersion: typeof contractVersion;
  identityMode: "workspaceId+userId";
  professionalIdRequired: false;
  usesLegacyEventNames: boolean;
  usesReportTerminology: boolean;
  canonicalOwnershipChecked: boolean;
  issues: string[];
  timestamp: string;
};

export function getContractStatus(): ContractStatusResponse {
  const issues: string[] = [];
  const usesLegacyEventNames = false;
  const usesReportTerminology = true;
  const canonicalOwnershipChecked = true;

  return {
    appName,
    status: issues.length > 0 ? "warning" : "ok",
    contractVersion,
    identityMode: "workspaceId+userId",
    professionalIdRequired: false,
    usesLegacyEventNames,
    usesReportTerminology,
    canonicalOwnershipChecked,
    issues,
    timestamp: getTimestamp()
  };
}
