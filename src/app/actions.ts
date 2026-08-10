"use server";

import { supabaseServer } from "@/lib/supabase-server";
import type {
  ConfSession,
  PartnershipAssignment,
  Shift,
  SponsorContact,
  VolunteerDetail,
  VolunteerName,
} from "@/lib/types";

function normCompany(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\b(llp|llc|inc\.?|corp\.?|corporation|co\.?)\b/g, "")
    .trim();
}

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
      const target = normCompany(a.sponsor_company);
      const contact =
        (contacts ?? []).find((c) => {
          const candidate = normCompany(c.company_name);
          return candidate === target || candidate.includes(target) || target.includes(candidate);
        }) ?? null;
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

export async function getConfSchedule(): Promise<ConfSession[]> {
  const { data, error } = await supabaseServer
    .from("conf_schedule")
    .select("id, session, type, room, day_order, day_label, start_time, end_time")
    .order("day_order", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}
