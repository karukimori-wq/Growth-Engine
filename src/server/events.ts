import type { EventEnvelope, EventSource, PlatformEventType } from "@/domain/contracts";

type PublishEventInput<TPayload> = {
  eventType: PlatformEventType;
  source: EventSource;
  workspaceId: string;
  payload: TPayload;
  correlationId?: string;
};

export async function publishEvent<TPayload>(
  input: PublishEventInput<TPayload>
): Promise<EventEnvelope<TPayload>> {
  return {
    eventId: `evt_${Date.now()}`,
    eventType: input.eventType,
    version: 1,
    source: input.source,
    workspaceId: input.workspaceId,
    occurredAt: new Date().toISOString(),
    correlationId: input.correlationId,
    payload: input.payload
  };
}
