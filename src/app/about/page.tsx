import AboutPageIntro from "@/components/aboutPage/AboutPageIntro/AboutPageIntro";
import MeetOurTeam from "@/components/aboutPage/MeetOurTeam/MeetOurTeam";
import SafteyAndQuality from "@/components/aboutPage/SafteyAndQuality/SafteyAndQuality";
import Experts from "@/components/home-page/Experts/Experts";

export default function AboutPage() {
  return (
    <main>
      <AboutPageIntro />
      <MeetOurTeam />
      <SafteyAndQuality />
      <Experts />
    </main>
  );
}
