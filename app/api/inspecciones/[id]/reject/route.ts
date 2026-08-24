import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role !== "administrador") {
    return NextResponse.json({ error: "Solo un administrador puede rechazar" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { reason?: string };
  const reason = body.reason?.trim();

  if (!reason) {
    return NextResponse.json({ error: "Debe indicar el motivo del rechazo" }, { status: 400 });
  }

  const { error } = await supabase
    .from("inspecciones")
    .update({ status: "rechazado", rejected_reason: reason })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
