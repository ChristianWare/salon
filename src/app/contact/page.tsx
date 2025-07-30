import ContactDetails from "@/components/contactPage/ContactDetails/ContactDetails";
import ContactPageIntro from "@/components/contactPage/ContactPageIntro/ContactPageIntro";
import Consultation from "@/components/home-page/Consultation/Consultation";

export default function ContactPage() {
  return (
    <main>
      <ContactPageIntro />
      <ContactDetails />
      <Consultation />
    </main>
  );
}
