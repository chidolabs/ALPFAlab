"use server";

import { supabaseServer } from "@/lib/supabase-server";
import { companiesMatch } from "@/lib/company";
import type {
  ConfSession,
  DayVolunteer,
  KeyContact,
  PartnerLead,
  PartnershipAssignment,
  PartnershipTeamMember,
  RoomSession,
  Shift,
  SponsorContact,
  VolunteerDetail,
  VolunteerName,
} from "@/lib/types";

const PARTNERSHIP_TEAM = "Partnership Support";

export async function getVolunteerNames(): Promise<VolunteerName[]> {
  const { data, error } = await supabaseServer
    .from("volunteers")
    .select("id, full_name, team")
    .order("full_name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getVolunteerDetail(
  volunteerId: string
): Promise<VolunteerDetail | null> {
  const { data: volunteer, error: volunteerError } = await supabaseServer
    .from("volunteers")
    .select("id, full_name, email, phone, member_type, team, roles")
    .eq("id", volunteerId)
    .single();
  if (volunteerError) throw new Error(volunteerError.message);
  if (!volunteer) return null;

  const { data: assignments, error: assignmentsError } = await supabaseServer
    .from("partnership_assignments")
    .select("sponsor_company")
    .eq("volunteer_id", volunteerId);
  if (assignmentsError) throw new Error(assignmentsError.message);

  let partnerships: PartnershipAssignment[] = [];
  if (assignments && assignments.length > 0) {
    const { data: contacts, error: contactsError } = await supabaseServer
      .from("sponsor_contacts")
      .select("id, company_name, first_name, last_name, title, email, phone, sponsorship_level");
    if (contactsError) throw new Error(contactsError.message);

    partnerships = assignments.map((a) => {
      const contact =
        (contacts ?? []).find((c) => companiesMatch(c.company_name, a.sponsor_company)) ?? null;
      return { sponsor_company: a.sponsor_company, contact };
    });
  }

  return {
    ...volunteer,
    roles: volunteer.roles ?? [],
    partnerships,
  };
}

export async function getVolunteerShifts(volunteerId: string): Promise<Shift[]> {
  const { data, error } = await supabaseServer
    .from("shifts")
    .select("id, day_order, day_label, start_time, end_time, session, location, team, leads")
    .eq("volunteer_id", volunteerId)
    .order("day_order", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getSponsorDirectory(): Promise<SponsorContact[]> {
  const { data, error } = await supabaseServer
    .from("sponsor_contacts")
    .select("id, company_name, first_name, last_name, title, email, phone, sponsorship_level")
    .order("company_name", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPartnershipLeads(): Promise<PartnerLead[]> {
  const { data: assignments, error: assignmentsError } = await supabaseServer
    .from("partnership_assignments")
    .select("sponsor_company, volunteer_id");
  if (assignmentsError) throw new Error(assignmentsError.message);
  if (!assignments || assignments.length === 0) return [];

  const { data: volunteers, error: volunteersError } = await supabaseServer
    .from("volunteers")
    .select("id, full_name, email, phone");
  if (volunteersError) throw new Error(volunteersError.message);

  const byId = new Map((volunteers ?? []).map((v) => [v.id, v]));

  return assignments.flatMap((a) => {
    const volunteer = byId.get(a.volunteer_id);
    if (!volunteer) return [];
    return [{ sponsor_company: a.sponsor_company, volunteer }];
  });
}

export async function getPartnershipTeamOverview(): Promise<PartnershipTeamMember[]> {
  const { data: volunteers, error: volunteersError } = await supabaseServer
    .from("volunteers")
    .select("id, full_name, email, phone")
    .eq("team", PARTNERSHIP_TEAM)
    .order("full_name", { ascending: true });
  if (volunteersError) throw new Error(volunteersError.message);
  if (!volunteers || volunteers.length === 0) return [];

  const { data: assignments, error: assignmentsError } = await supabaseServer
    .from("partnership_assignments")
    .select("volunteer_id, sponsor_company")
    .in(
      "volunteer_id",
      volunteers.map((v) => v.id)
    );
  if (assignmentsError) throw new Error(assignmentsError.message);

  const byVolunteer = new Map<string, string[]>();
  for (const a of assignments ?? []) {
    if (!byVolunteer.has(a.volunteer_id)) byVolunteer.set(a.volunteer_id, []);
    byVolunteer.get(a.volunteer_id)!.push(a.sponsor_company);
  }

  return volunteers.map((v) => ({
    ...v,
    sponsor_companies: byVolunteer.get(v.id) ?? [],
  }));
}

export async function getKeyContacts(): Promise<KeyContact[]> {
  const { data, error } = await supabaseServer
    .from("key_contacts")
    .select("id, area, name, role, phone, email, notes")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addKeyContact(input: {
  area: string;
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  notes?: string;
}): Promise<KeyContact> {
  const area = input.area.trim();
  const name = input.name.trim();
  if (!area || !name) throw new Error("Area and name are required.");

  const phone = input.phone?.trim() || null;
  const email = input.email?.trim() || null;
  if (!phone && !email) throw new Error("Add a phone number or email.");

  const { data, error } = await supabaseServer
    .from("key_contacts")
    .insert({
      area,
      name,
      role: input.role?.trim() || null,
      phone,
      email,
      notes: input.notes?.trim() || null,
    })
    .select("id, area, name, role, phone, email, notes")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getRoomSessions(): Promise<RoomSession[]> {
  const { data, error } = await supabaseServer
    .from("room_sessions")
    .select(
      "id, room, capacity, day_order, day_label, time_label, time_order, company, cpe, covering_volunteer_id, covering_volunteer_name"
    )
    .order("day_order", { ascending: true })
    .order("time_order", { ascending: true })
    .order("room", { ascending: true });
  if (error) throw new Error(error.message);
  const sessions = data ?? [];

  const volunteerIds = [...new Set(sessions.map((s) => s.covering_volunteer_id).filter(Boolean))];
  let volunteerMap = new Map<string, { id: string; full_name: string; phone: string | null; email: string | null }>();
  if (volunteerIds.length > 0) {
    const { data: vols, error: volsError } = await supabaseServer
      .from("volunteers")
      .select("id, full_name, phone, email")
      .in("id", volunteerIds);
    if (volsError) throw new Error(volsError.message);
    volunteerMap = new Map((vols ?? []).map((v) => [v.id, v]));
  }

  return sessions.map((s) => ({
    ...s,
    covering_volunteer: s.covering_volunteer_id ? volunteerMap.get(s.covering_volunteer_id) ?? null : null,
  }));
}

export async function getVolunteersActiveOnDay(dayOrder: number): Promise<DayVolunteer[]> {
  const { data: shifts, error: shiftsError } = await supabaseServer
    .from("shifts")
    .select("volunteer_id, start_time, end_time")
    .eq("day_order", dayOrder);
  if (shiftsError) throw new Error(shiftsError.message);
  if (!shifts || shifts.length === 0) return [];

  const volunteerIds = [...new Set(shifts.map((s) => s.volunteer_id).filter(Boolean))] as string[];
  const { data: volunteers, error: volunteersError } = await supabaseServer
    .from("volunteers")
    .select("id, full_name, phone, email, team")
    .in("id", volunteerIds);
  if (volunteersError) throw new Error(volunteersError.message);

  const { data: covering, error: coveringError } = await supabaseServer
    .from("room_sessions")
    .select("id, room, company, time_label, covering_volunteer_id")
    .eq("day_order", dayOrder)
    .not("covering_volunteer_id", "is", null);
  if (coveringError) throw new Error(coveringError.message);

  const coveringByVolunteer = new Map(
    (covering ?? []).map((c) => [
      c.covering_volunteer_id as string,
      { roomSessionId: c.id, company: c.company, room: c.room, time_label: c.time_label },
    ])
  );

  const shiftsByVolunteer = new Map<string, { start_time: string | null; end_time: string | null }[]>();
  for (const s of shifts) {
    if (!s.volunteer_id) continue;
    if (!shiftsByVolunteer.has(s.volunteer_id)) shiftsByVolunteer.set(s.volunteer_id, []);
    shiftsByVolunteer.get(s.volunteer_id)!.push({ start_time: s.start_time, end_time: s.end_time });
  }

  return (volunteers ?? [])
    .map((v) => ({
      ...v,
      shiftRanges: shiftsByVolunteer.get(v.id) ?? [],
      covering: coveringByVolunteer.get(v.id) ?? null,
    }))
    .sort((a, b) => a.full_name.localeCompare(b.full_name));
}

export async function getPartnerRoomSessions(volunteerId: string): Promise<RoomSession[]> {
  const { data: assignments, error: assignmentsError } = await supabaseServer
    .from("partnership_assignments")
    .select("sponsor_company")
    .eq("volunteer_id", volunteerId);
  if (assignmentsError) throw new Error(assignmentsError.message);
  if (!assignments || assignments.length === 0) return [];

  const sessions = await getRoomSessions();
  return sessions.filter((s) => assignments.some((a) => companiesMatch(a.sponsor_company, s.company)));
}

export async function getConfSchedule(): Promise<ConfSession[]> {
  const { data, error } = await supabaseServer
    .from("conf_schedule")
    .select("id, session, type, room, day_order, day_label, start_time, end_time")
    .order("day_order", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}
