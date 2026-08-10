import { getKeyContacts } from "@/app/actions";
import ContactsView from "@/components/ContactsView";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const data = await getKeyContacts();
  return <ContactsView data={data} />;
}
