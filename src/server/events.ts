import type { EventEnvelope, EventSource, PlatformEventType } from "@/domain/contracts";
import { isApprovedEventType } from "@/domain/contracts";
import type { EventOutboxEntry, EventOutboxStatus } from "@/domain/entities";
import { eventOutbox } from "@/lib/mock-data";

type PublishEventInput<TPayload> = {
  eventType: PlatformEventType;
  source: EventSource;
  workspaceId: string;
  payload: TPayload;
  correlationId?: string;
};

export type EventPublisher = {
  publish<TPayload>(input: PublishEventInput<TPayload>): Promise<EventEnvelope<TPayload>>;
  listPending(workspaceId?: string): Promise<EventOutboxEntry[]>;
  markPublished(eventId: string, publishedAt?: string): Promise<EventOutboxEntry | undefined>;
  markFailed(eventId: string): Promise<EventOutboxEntry | undefined>;
};

function createMockEventPublisher(): EventPublisher {
  return {
    async publish<TPayload>(input: PublishEventInput<TPayload>) {
      if (!isApprovedEventType(input.eventType)) {
        throw new Error(`Unapproved event type: ${input.eventType}`);
      }

      const now = new Date().toISOString();
      const envelope: EventEnvelope<TPayload> = {
        eventId: `evt_${Date.now()}`,
        eventType: input.eventType,
        version: 1,
        source: input.source,
        workspaceId: input.workspaceId,
        occurredAt: now,
        correlationId: input.correlationId,
        payload: input.payload
      };

      eventOutbox.push({
        id: envelope.eventId,
        workspaceId: envelope.workspaceId,
        eventType: envelope.eventType,
        source: envelope.source,
        payload: envelope.payload,
        correlationId: envelope.correlationId,
        status: "pending",
        attempts: 0,
        occurredAt: envelope.occurredAt,
        createdAt: now,
        updatedAt: now
      });

      return envelope;
    },

    async listPending(workspaceId) {
      return eventOutbox.filter(
        (entry) => entry.status === "pending" && (!workspaceId || entry.workspaceId === workspaceId)
      );
    },

    async markPublished(eventId, publishedAt = new Date().toISOString()) {
      return updateEventOutboxStatus(eventId, "published", publishedAt);
    },

    async markFailed(eventId) {
      return updateEventOutboxStatus(eventId, "failed");
    }
  };
}

const eventPublisher = createMockEventPublisher();

export function getEventPublisher(): EventPublisher {
  return eventPublisher;
}

export async function publishEvent<TPayload>(
  input: PublishEventInput<TPayload>
): Promise<EventEnvelope<TPayload>> {
  return eventPublisher.publish(input);
}

export async function listPendingEvents(workspaceId?: string): Promise<EventOutboxEntry[]> {
  return eventPublisher.listPending(workspaceId);
}

export async function markEventPublished(eventId: string, publishedAt = new Date().toISOString()) {
  return eventPublisher.markPublished(eventId, publishedAt);
}

export async function markEventFailed(eventId: string) {
  return eventPublisher.markFailed(eventId);
}

function updateEventOutboxStatus(
  eventId: string,
  status: EventOutboxStatus,
  publishedAt?: string
): EventOutboxEntry | undefined {
  const index = eventOutbox.findIndex((entry) => entry.id === eventId);

  if (index < 0) {
    return undefined;
  }

  const current = eventOutbox[index];
  const updated = {
    ...current,
    status,
    attempts: current.attempts + 1,
    publishedAt: status === "published" ? publishedAt : current.publishedAt,
    updatedAt: new Date().toISOString()
  };

  eventOutbox[index] = updated;
  return updated;
}
