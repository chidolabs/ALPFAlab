"use server";

import { supabaseServer } from "@/lib/supabase-server";
import { companiesMatch } from "@/lib/company";
import type {
  ConfSession,
  PartnerLead,
  PartnershipAssignment,
  Shift,
  SponsorContact,
  VolunteerDetail,
  VolunteerName,
} from "@/lib/types";

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

export async function getConfSchedule(): Promise<ConfSession[]> {
  const { data, error } = await supabaseServer
    .from("conf_schedule")
    .select("id, session, type, room, day_order, day_label, start_time, end_time")
    .order("day_order", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}
