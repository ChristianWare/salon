import Experts from "@/components/home-page/Experts/Experts";
import WhyChooseUs from "@/components/home-page/WhyChooseUs/WhyChooseUs";
import AllServices from "@/components/servicesPage/AllServices/AllServices";
import ServicesPageIntro from "@/components/servicesPage/ServicesPageIntro/ServicesPageIntro";

export default function ServicesPage() {
  return (
    <main>
      <ServicesPageIntro />
      <AllServices />
      <WhyChooseUs />
      <Experts />
    </main>
  );
}
