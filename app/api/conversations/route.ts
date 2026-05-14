import { NextRequest, NextResponse } from "next/server";
import {
  listConversations,
  createConversation,
} from "@/lib/supabase";

// GET /api/conversations — list all conversations
export async function GET() {
  try {
    const conversations = await listConversations();
    return NextResponse.json(conversations);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to list conversations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/conversations — create a new conversation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const title = typeof body.title === "string" ? body.title : "New Conversation";
    const conversation = await createConversation(title);
    return NextResponse.json(conversation, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create conversation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
