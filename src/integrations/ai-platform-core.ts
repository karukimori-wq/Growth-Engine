import type { AiCapability } from "@/domain/contracts";

export type AiActivityRequest<TInput> = {
  workspaceId: string;
  capability: AiCapability;
  input: TInput;
};

export type AiActivityResponse<TOutput> = {
  activityId: string;
  capability: AiCapability;
  output: TOutput;
  evidence: string[];
};

export type AiPlatformCoreClient = {
  runActivity: <TInput, TOutput>(request: AiActivityRequest<TInput>) => Promise<AiActivityResponse<TOutput>>;
};

export function createAiPlatformCoreClient(): AiPlatformCoreClient {
  return {
    async runActivity<TInput, TOutput>(request: AiActivityRequest<TInput>) {
      return {
        activityId: `ai_activity_${Date.now()}`,
        capability: request.capability,
        output: {} as TOutput,
        evidence: []
      };
    }
  };
}
