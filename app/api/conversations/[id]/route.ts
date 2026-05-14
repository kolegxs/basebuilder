import { NextRequest, NextResponse } from "next/server";
import {
  getMessages,
  deleteConversation,
  updateConversationTitle,
} from "@/lib/supabase";

// GET /api/conversations/[id] — fetch messages for a conversation
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const messages = await getMessages(id);
    return NextResponse.json(messages);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch messages";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/conversations/[id] — rename a conversation
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { title } = await req.json();
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    await updateConversationTitle(id, title);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to rename conversation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/conversations/[id] — delete a conversation + all its messages
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteConversation(id);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete conversation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
