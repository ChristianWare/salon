import AboutUsSection from "@/components/home-page/AboutUsSection/AboutUsSection";
import Consultation from "@/components/home-page/Consultation/Consultation";
import Experts from "@/components/home-page/Experts/Experts";
import FeaturedServices from "@/components/home-page/FeaturedServices/FeaturedServices";
import Hero from "@/components/home-page/Hero/Hero";
import HowItWorks from "@/components/home-page/HowItWorks/HowItWorks";
import PostHero from "@/components/home-page/PostHero/PostHero";
import Reviews from "@/components/home-page/Reviews/Reviews";
import ValueProposition from "@/components/home-page/ValueProposition/ValueProposition";
import WhyChooseUs from "@/components/home-page/WhyChooseUs/WhyChooseUs";
import Footer from "@/components/shared/Footer/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <PostHero />
      <ValueProposition />
      <AboutUsSection />
      <WhyChooseUs />
      <Experts />
      <FeaturedServices />
      <HowItWorks />
      <Reviews />
      <Consultation />
      <Footer />
    </main>
  );
}
