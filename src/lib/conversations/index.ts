/**
 * Bot conversation state — manages multi-step interactive flows per user.
 *
 * Each conversation is identified by (channel, handle) and has:
 *   - flow: which flow is active (e.g. 'subscribe', 'khatma_setup', 'manage_subs')
 *   - step: which step of the flow the user is on
 *   - data: accumulated answers from previous steps
 *   - expiresAt: conversation auto-expires after 10 minutes of inactivity
 *
 * Bismillah Ar-Rahman Ar-Raheem.
 */
import { collections } from "@/lib/lightbase/client";
import { logger } from "@/lib/logger";

const log = logger("conversations");
const conversations = collections("bot_conversations");

const EXPIRES_AFTER_MS = 10 * 60 * 1000; // 10 min

export interface Conversation {
  id: string;
  channel: string;
  handle: string;
  flow: string;
  step: string;
  data: Record<string, unknown>;
  startedAt: string;
  updatedAt: string;
  expiresAt: string;
}

/**
 * Get the active conversation for a user, or null if none.
 * Expired conversations are treated as non-existent.
 */
export async function getConversation(channel: string, handle: string): Promise<Conversation | null> {
  try {
    const list = await conversations.list({
      filter: { and: [
        { field: "channel", op: "eq", value: channel },
        { field: "handle", op: "eq", value: handle },
      ] },
      limit: 1,
      sort: "updatedAt:desc",
    });
    if (list.data.length === 0) return null;
    const c = list.data[0] as any;
    // Check expiry
    if (new Date(c.expiresAt).getTime() < Date.now()) {
      return null;
    }
    return {
      id: c.id,
      channel: c.channel,
      handle: c.handle,
      flow: c.flow,
      step: c.step,
      data: c.data ?? {},
      startedAt: c.startedAt,
      updatedAt: c.updatedAt,
      expiresAt: c.expiresAt,
    };
  } catch (e) {
    log.error({ err: e, channel, handle }, "Failed to get conversation");
    return null;
  }
}

/**
 * Start a new conversation. If one is already active, it's overwritten.
 */
export async function startConversation(
  channel: string,
  handle: string,
  flow: string,
  initialStep: string = "start",
  initialData: Record<string, unknown> = {},
): Promise<Conversation> {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + EXPIRES_AFTER_MS).toISOString();

  // Find and expire any existing conversation for this user
  const existing = await getConversation(channel, handle);
  if (existing) {
    try {
      await conversations.update(existing.id, { expiresAt: now });
    } catch {}
  }

  const doc = await conversations.insert({
    channel,
    handle,
    flow,
    step: initialStep,
    data: initialData,
    startedAt: now,
    updatedAt: now,
    expiresAt,
  });
  log.info({ channel, handle, flow, step: initialStep }, "Conversation started");
  return {
    id: doc.id,
    channel,
    handle,
    flow,
    step: initialStep,
    data: initialData,
    startedAt: now,
    updatedAt: now,
    expiresAt,
  };
}

/**
 * Advance the conversation to the next step, optionally merging in new data.
 */
export async function advanceConversation(
  conversationId: string,
  nextStep: string,
  dataPatch?: Record<string, unknown>,
): Promise<Conversation | null> {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + EXPIRES_AFTER_MS).toISOString();
  try {
    const current = await conversations.get(conversationId);
    if (!current) return null;
    const mergedData = { ...(current.data ?? {}), ...(dataPatch ?? {}) };
    await conversations.update(conversationId, {
      step: nextStep,
      data: mergedData,
      updatedAt: now,
      expiresAt,
    });
    return {
      id: conversationId,
      channel: current.channel,
      handle: current.handle,
      flow: current.flow,
      step: nextStep,
      data: mergedData,
      startedAt: current.startedAt,
      updatedAt: now,
      expiresAt,
    };
  } catch (e) {
    log.error({ err: e, conversationId }, "Failed to advance conversation");
    return null;
  }
}

/**
 * End (expire) the conversation.
 */
export async function endConversation(conversationId: string): Promise<void> {
  const now = new Date().toISOString();
  try {
    await conversations.update(conversationId, { expiresAt: now, updatedAt: now });
  } catch (e) {
    log.error({ err: e, conversationId }, "Failed to end conversation");
  }
}
