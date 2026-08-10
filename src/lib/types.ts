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
