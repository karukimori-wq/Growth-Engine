import { NextResponse } from "next/server";
import { appName, contractVersion, getTimestamp } from "@/server/app-metadata";

const deniedPayloadFields = [
  "paymentStatus",
  "salesAmount",
  "stripePaymentIntentId",
  "stripeCheckoutSessionId",
  "stripeSecret",
  "customerMaster",
  "customer",
  "fullConversationHistory",
  "fullConversationHistories",
  "conversationContextBody",
  "fullConversationContextBody",
  "fullReportBody",
  "fullProfessionalMemoryBody",
  "apiKey",
  "accessToken",
  "secretPrompt"
];

export async function GET() {
  return NextResponse.json(
    {
      appName,
      integration: "communication-planner",
      contractVersion,
      status: "success",
      sourceApp: "growth-engine",
      targetApp: "communication-planner",
      purpose:
        "Reference-first handoff from Growth Engine business workflows to 1-to-1 communication workflows.",
      canonicalOwnership: {
        growthEngine: [
          "Customer",
          "Lead",
          "Reservation",
          "Payment",
          "Sales",
          "Follow-up",
          "Repeat",
          "Referral",
          "Business contact-measure decisions"
        ],
        communicationPlanner: [
          "Communication Person projection",
          "ChannelIdentity",
          "Conversation",
          "Message",
          "ConversationContext",
          "Communication NextAction",
          "ReplyDraft",
          "SafetyCheck",
          "Send workflow"
        ],
        snsPlanner: ["Simple MessageDraft only; no live ConversationContext or SafetyCheck"]
      },
      operations: [
        "CommunicationInbox.List",
        "CommunicationPerson.Get",
        "CommunicationConversation.List",
        "CommunicationContext.Get",
        "CommunicationReplyDraft.Create",
        "CommunicationReplySafety.Check",
        "CommunicationReplyDraft.Send"
      ],
      acceptedReferences: [
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
      returnedReferences: [
        "personId",
        "conversationId",
        "promiseId",
        "nextActionId",
        "replyDraftId",
        "safetyCheckId",
        "messageRef",
        "traceId",
        "correlationId",
        "requestId"
      ],
      stableEvents: [
        "communication.message.received.v1",
        "communication.message.sent.v1",
        "communication.context.updated.v1",
        "communication.promise.created.v1",
        "communication.next_action.created.v1",
        "communication.reply_draft.created.v1",
        "communication.reply_safety.checked.v1",
        "communication.person_channel.linked.v1"
      ],
      prohibitedPayloadFields: deniedPayloadFields,
      dataSafety: {
        customerMasterSent: false,
        paymentStatusSentOutsideGrowthEngine: false,
        salesAmountSentOutsideGrowthEngine: false,
        stripeDataSent: false,
        fullConversationHistorySent: false,
        fullConversationContextBodySent: false,
        apiKeysSent: false,
        secretPromptSent: false
      },
      timestamp: getTimestamp()
    },
    { status: 200 }
  );
}
