import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type DBMessage = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

// ----------------------------------------------------------------
// Client helpers
// ----------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSupabaseAdmin(): SupabaseClient<any> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. " +
        "Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }

  return createClient(url, key);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let browserClient: SupabaseClient<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabaseBrowser(): SupabaseClient<any> {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. " +
        "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
  }

  browserClient = createClient(url, key);
  return browserClient;
}

// ----------------------------------------------------------------
// Data helpers (server-side)
// ----------------------------------------------------------------

/** List all conversations ordered by most recently updated */
export async function listConversations(): Promise<Conversation[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("conversations")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Create a new conversation, optionally with a title */
export async function createConversation(
  title = "New Conversation"
): Promise<Conversation> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("conversations")
    .insert({ title })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Update a conversation's title */
export async function updateConversationTitle(
  id: string,
  title: string
): Promise<void> {
  const db = getSupabaseAdmin();
  const { error } = await db
    .from("conversations")
    .update({ title })
    .eq("id", id);

  if (error) throw error;
}

/** Delete a conversation (cascades to messages) */
export async function deleteConversation(id: string): Promise<void> {
  const db = getSupabaseAdmin();
  const { error } = await db.from("conversations").delete().eq("id", id);
  if (error) throw error;
}

/** Get all messages for a conversation (ordered oldest → newest) */
export async function getMessages(conversationId: string): Promise<DBMessage[]> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Append a single message to a conversation */
export async function appendMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
): Promise<DBMessage> {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("messages")
    .insert({ conversation_id: conversationId, role, content })
    .select()
    .single();

  if (error) throw error;

  // Bump the conversation's updated_at so it sorts to the top
  await db
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return data;
}

/** Auto-generate a short title from the first user message */
export function generateTitle(firstUserMessage: string): string {
  const trimmed = firstUserMessage.trim();
  if (trimmed.length <= 50) return trimmed;
  return trimmed.slice(0, 47) + "…";
}
