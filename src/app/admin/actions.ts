"use server";

import { supabaseServer } from "@/lib/supabase-server";

export async function assignRoomCoverageVolunteer(
  roomSessionId: string,
  volunteerId: string | null
): Promise<void> {
  const { error } = await supabaseServer
    .from("room_sessions")
    .update({ covering_volunteer_id: volunteerId, covering_volunteer_name: null })
    .eq("id", roomSessionId);
  if (error) throw new Error(error.message);
}

export async function assignRoomCoverageFreeName(
  roomSessionId: string,
  name: string
): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Enter a name.");
  const { error } = await supabaseServer
    .from("room_sessions")
    .update({ covering_volunteer_name: trimmed, covering_volunteer_id: null })
    .eq("id", roomSessionId);
  if (error) throw new Error(error.message);
}

export async function assignRoomSupportVolunteer(
  roomSessionId: string,
  volunteerId: string | null
): Promise<void> {
  const { error } = await supabaseServer
    .from("room_sessions")
    .update({ support_volunteer_id: volunteerId, support_volunteer_name: null })
    .eq("id", roomSessionId);
  if (error) throw new Error(error.message);
}

export async function assignRoomSupportFreeName(roomSessionId: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Enter a name.");
  const { error } = await supabaseServer
    .from("room_sessions")
    .update({ support_volunteer_name: trimmed, support_volunteer_id: null })
    .eq("id", roomSessionId);
  if (error) throw new Error(error.message);
}
