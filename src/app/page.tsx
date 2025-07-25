import FeaturedServices from "@/components/home-page/FeaturedServices/FeaturedServices";
import Hero from "@/components/home-page/Hero/Hero";
import ValueProposition from "@/components/home-page/ValueProposition/ValueProposition";

export default function Home() {
  return (
    <main>
      <Hero />
      <ValueProposition />
      <FeaturedServices />
    </main>
  );
}
