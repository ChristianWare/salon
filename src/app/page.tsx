import AboutUsSection from "@/components/home-page/AboutUsSection/AboutUsSection";
import Consultation from "@/components/home-page/Consultation/Consultation";
import Experts from "@/components/home-page/Experts/Experts";
import FeaturedServices from "@/components/home-page/FeaturedServices/FeaturedServices";
import Hero from "@/components/home-page/Hero/Hero";
import ValueProposition from "@/components/home-page/ValueProposition/ValueProposition";
import WhyChooseUs from "@/components/home-page/WhyChooseUs/WhyChooseUs";

export default function Home() {
  return (
    <main>
      <Hero />
      <ValueProposition />
      <AboutUsSection />
      <WhyChooseUs />
      <Experts />
      <FeaturedServices />
      <Consultation />
      <h2>Footer Here</h2>
    </main>
  );
}
