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

export type ContractStatus = "success" | "warning" | "error" | "skipped";

export type ContractStatusResponse = {
  appName: typeof appName;
  status: ContractStatus;
  contractVersion: typeof contractVersion;
  identityMode: "workspaceId+userId";
  professionalIdRequired: false;
  usesLegacyEventNames: boolean;
  usesReportTerminology: boolean;
  canonicalOwnershipChecked: boolean;
  supportsVelvetProfessionalApp: boolean;
  supportsVelvetHandoff: boolean;
  supportsMessageDraft: boolean;
  velvetReferenceOnly: boolean;
  messageDraftReferenceOnly: boolean;
  paymentAndSalesCanonicalOwner: "growth-engine";
  supportedProfessionalApps: string[];
  velvetApiOperations: string[];
  velvetEndpoints: string[];
  velvetEvents: string[];
  velvetAcceptedReferences: string[];
  velvetReturnedReferences: string[];
  messageDraftOperations: string[];
  sourceOfTruth: Record<string, boolean | string>;
  monitoredStableEvents: string[];
  deniedCrossAppFields: string[];
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
    status: issues.length > 0 ? "warning" : "success",
    contractVersion,
    identityMode: "workspaceId+userId",
    professionalIdRequired: false,
    usesLegacyEventNames,
    usesReportTerminology,
    canonicalOwnershipChecked,
    supportsVelvetProfessionalApp: true,
    supportsVelvetHandoff: true,
    supportsMessageDraft: true,
    velvetReferenceOnly: true,
    messageDraftReferenceOnly: true,
    paymentAndSalesCanonicalOwner: "growth-engine",
    supportedProfessionalApps: ["numeria-studio", "velvet"],
    velvetApiOperations: [
      "VelvetHandoff.Start",
      "VelvetVisit.Start",
      "VelvetVisit.Complete",
      "VelvetMemory.Get",
      "VelvetMemory.Update",
      "VelvetNote.Create",
      "VelvetTimeline.List",
      "VelvetNextAction.Create"
    ],
    velvetEndpoints: [
      "POST /api/visits",
      "PATCH /api/visits/{visitId}",
      "GET /api/customers/{customerId}/memory",
      "PATCH /api/customers/{customerId}/memory",
      "POST /api/customers/{customerId}/notes",
      "GET /api/customers/{customerId}/timeline",
      "POST /api/customers/{customerId}/next-actions"
    ],
    velvetEvents: [
      "velvet.visit.started.v1",
      "velvet.visit.completed.v1",
      "velvet.memory.updated.v1",
      "velvet.note.created.v1",
      "velvet.next_action.created.v1"
    ],
    velvetAcceptedReferences: [
      "workspaceId",
      "userId",
      "customerId",
      "reservationId",
      "visitScheduleId",
      "intent",
      "traceId",
      "correlationId"
    ],
    velvetReturnedReferences: [
      "visitId",
      "noteId",
      "lastVisitAt",
      "nextActionRef",
      "summaryRef",
      "traceId",
      "correlationId"
    ],
    messageDraftOperations: [
      "MessageDraft.Generate",
      "MessageDraft.Rewrite",
      "MessageDraft.Metadata"
    ],
    sourceOfTruth: {
      customer: "growth-engine",
      reservation: "growth-engine",
      payment: "growth-engine",
      sales: "growth-engine",
      velvetVisit: false,
      velvetMemory: false,
      velvetNote: false,
      velvetNextAction: false,
      messageDraft: false,
      aiActivity: false,
      aiUsage: false,
      aiCapability: false
    },
    monitoredStableEvents: [
      "growth.customer.created.v1",
      "growth.customer.updated.v1",
      "growth.reservation.created.v1",
      "studio.session.started.v1",
      "studio.report.generated.v1",
      "velvet.visit.started.v1",
      "velvet.visit.completed.v1",
      "velvet.memory.updated.v1",
      "velvet.note.created.v1",
      "velvet.next_action.created.v1",
      "sns.post_draft.created.v1",
      "sns.message_draft.created.v1",
      "ai.activity.created.v1"
    ],
    deniedCrossAppFields: [
      "paymentStatus",
      "salesAmount",
      "Stripe情報",
      "Customer master records",
      "full report body",
      "full professional note body",
      "full professional memory body",
      "full conversation history",
      "API keys",
      "secret prompts"
    ],
    issues,
    timestamp: getTimestamp()
  };
}
