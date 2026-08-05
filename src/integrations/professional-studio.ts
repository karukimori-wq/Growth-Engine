import type { ProfessionalStudioType } from "@/domain/common";

export type StartStudioSessionRequest = {
  workspaceId: string;
  customerId: string;
  reservationId: string;
  productId: string;
  professionalStudioType: ProfessionalStudioType;
  scheduledStartAt: string;
  consultationTheme?: string;
  intakeAnswers?: Record<string, unknown>;
  sourceChannel?: string;
  campaignId?: string;
  paymentStatus?: string;
};

export type StartStudioSessionResponse = {
  sessionId: string;
  customerId: string;
  reservationId: string;
  status: "started";
};

export type StudioReportGeneratedPayload = {
  workspaceId: string;
  customerId: string;
  sessionId: string;
  reportId: string;
  generatedAt: string;
};

export type ProfessionalStudioClient = {
  startSession: (request: StartStudioSessionRequest) => Promise<StartStudioSessionResponse>;
};

export function createProfessionalStudioClient(): ProfessionalStudioClient {
  return {
    async startSession(request) {
      return {
        sessionId: `session_${Date.now()}`,
        customerId: request.customerId,
        reservationId: request.reservationId,
        status: "started"
      };
    }
  };
}
