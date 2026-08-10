"use server";

import { supabaseServer } from "@/lib/supabase-server";
import type { Shift } from "@/lib/types";

const DAY_LABELS: Record<number, string> = {
  1: "Saturday",
  2: "Sunday",
  3: "Monday",
  4: "Tuesday",
  5: "Wednesday",
  6: "Thursday",
};

export async function addShift(input: {
  volunteerId: string;
  dayOrder: number;
  startTime: string;
  endTime: string;
  session: string;
  location?: string;
  team?: string;
  leads?: string;
}): Promise<Shift> {
  const session = input.session.trim();
  if (!session) throw new Error("Session name is required.");
  if (!input.startTime || !input.endTime) throw new Error("Start and end time are required.");

  const leads = (input.leads ?? "")
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);

  const { data, error } = await supabaseServer
    .from("shifts")
    .insert({
      volunteer_id: input.volunteerId,
      day_order: input.dayOrder,
      day_label: DAY_LABELS[input.dayOrder] ?? null,
      start_time: input.startTime,
      end_time: input.endTime,
      session,
      location: input.location?.trim() || null,
      team: input.team?.trim() || null,
      leads,
    })
    .select("id, day_order, day_label, start_time, end_time, session, location, team, leads")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteShift(shiftId: string): Promise<void> {
  const { error } = await supabaseServer.from("shifts").delete().eq("id", shiftId);
  if (error) throw new Error(error.message);
}
