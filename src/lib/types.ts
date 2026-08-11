export type VolunteerName = {
  id: string;
  full_name: string;
  team: string | null;
};

export type Shift = {
  id: string;
  day_order: number | null;
  day_label: string | null;
  start_time: string | null;
  end_time: string | null;
  session: string;
  location: string | null;
  team: string | null;
  leads: string[];
};

export type SponsorContact = {
  id: string;
  company_name: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  sponsorship_level: string | null;
};

export type PartnershipAssignment = {
  sponsor_company: string;
  contact: SponsorContact | null;
};

export type PartnerLead = {
  sponsor_company: string;
  volunteer: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
  };
};

export type VolunteerDetail = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  member_type: string | null;
  team: string | null;
  roles: string[];
  partnerships: PartnershipAssignment[];
};

export type KeyContact = {
  id: string;
  area: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

export type PartnershipTeamMember = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  sponsor_companies: string[];
};

export type RoomSession = {
  id: string;
  room: string;
  capacity: number | null;
  day_order: number | null;
  day_label: string | null;
  time_label: string | null;
  time_order: number | null;
  company: string;
  cpe: boolean;
  covering_volunteer_id: string | null;
  covering_volunteer: { id: string; full_name: string; phone: string | null; email: string | null } | null;
  covering_volunteer_name: string | null;
  support_volunteer_id: string | null;
  support_volunteer: { id: string; full_name: string; phone: string | null; email: string | null } | null;
  support_volunteer_name: string | null;
};

export type DayVolunteer = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  team: string | null;
  shiftRanges: { start_time: string | null; end_time: string | null }[];
  covering: {
    roomSessionId: string;
    company: string;
    room: string;
    time_label: string | null;
    role: "lead" | "support";
  }[];
};

export type ConfSession = {
  id: string;
  session: string;
  type: string | null;
  room: string | null;
  day_order: number | null;
  day_label: string | null;
  start_time: string | null;
  end_time: string | null;
};
