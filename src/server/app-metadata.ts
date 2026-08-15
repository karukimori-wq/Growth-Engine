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
  supportsCommunicationPlanner: boolean;
  supportsCommunicationPlannerHandoff: boolean;
  supportsMessageDraft: boolean;
  velvetReferenceOnly: boolean;
  communicationPlannerReferenceOnly: boolean;
  messageDraftReferenceOnly: boolean;
  paymentAndSalesCanonicalOwner: "growth-engine";
  supportedProfessionalApps: string[];
  velvetApiOperations: string[];
  velvetEndpoints: string[];
  velvetEvents: string[];
  velvetAcceptedReferences: string[];
  velvetReturnedReferences: string[];
  communicationPlannerApiOperations: string[];
  communicationPlannerEndpoints: string[];
  communicationPlannerEvents: string[];
  communicationPlannerAcceptedReferences: string[];
  communicationPlannerReturnedReferences: string[];
  communicationPlannerBusinessBoundary: Record<string, string>;
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
    supportsCommunicationPlanner: true,
    supportsCommunicationPlannerHandoff: true,
    supportsMessageDraft: true,
    velvetReferenceOnly: true,
    communicationPlannerReferenceOnly: true,
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
    communicationPlannerApiOperations: [
      "CommunicationInbox.List",
      "CommunicationPerson.Get",
      "CommunicationConversation.List",
      "CommunicationContext.Get",
      "CommunicationPromise.Create",
      "CommunicationNextAction.Create",
      "CommunicationReplyDraft.Create",
      "CommunicationReplySafety.Check",
      "CommunicationReplyDraft.Send"
    ],
    communicationPlannerEndpoints: [
      "GET /api/inbox",
      "GET /api/persons/{personId}",
      "GET /api/persons/{personId}/conversations",
      "GET /api/persons/{personId}/context",
      "POST /api/conversations/{conversationId}/reply-drafts",
      "POST /api/reply-drafts/{replyDraftId}/safety-check",
      "POST /api/reply-drafts/{replyDraftId}/send"
    ],
    communicationPlannerEvents: [
      "communication.message.received.v1",
      "communication.message.sent.v1",
      "communication.context.updated.v1",
      "communication.promise.created.v1",
      "communication.next_action.created.v1",
      "communication.reply_draft.created.v1",
      "communication.reply_safety.checked.v1",
      "communication.person_channel.linked.v1"
    ],
    communicationPlannerAcceptedReferences: [
      "workspaceId",
      "userId",
      "customerId",
      "personId",
      "conversationId",
      "purpose",
      "inputRef",
      "traceId",
      "correlationId"
    ],
    communicationPlannerReturnedReferences: [
      "personId",
      "conversationId",
      "promiseId",
      "nextActionId",
      "replyDraftId",
      "safetyCheckId",
      "messageRef",
      "traceId",
      "correlationId"
    ],
    communicationPlannerBusinessBoundary: {
      growthEngineOwns: "Follow-up, Repeat, Referral and business contact-measure decisions",
      communicationPlannerOwns: "Conversation, ConversationContext, ReplyDraft, SafetyCheck and conversation next actions",
      snsMessageDraftRole: "Simple business-initiated contact drafts only; no live conversation context or send workflow"
    },
    messageDraftOperations: [
      "MessageDraft.Generate",
      "MessageDraft.Rewrite",
      "MessageDraft.Metadata"
    ],
    sourceOfTruth: {
      customer: "growth-engine",
      lead: "growth-engine",
      reservation: "growth-engine",
      payment: "growth-engine",
      sales: "growth-engine",
      followup: "growth-engine",
      repeat: "growth-engine",
      referral: "growth-engine",
      communicationPerson: false,
      conversation: false,
      conversationContext: false,
      communicationNextAction: false,
      replyDraft: false,
      safetyCheck: false,
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
      "communication.message.received.v1",
      "communication.message.sent.v1",
      "communication.context.updated.v1",
      "communication.promise.created.v1",
      "communication.next_action.created.v1",
      "communication.reply_draft.created.v1",
      "communication.reply_safety.checked.v1",
      "communication.person_channel.linked.v1",
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
      "full ConversationContext body",
      "API keys",
      "secret prompts"
    ],
    issues,
    timestamp: getTimestamp()
  };
}
