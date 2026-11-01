import { Hero } from "../components/home/Hero";
import { PlatformMarquee } from "../components/home/PlatformMarquee";
import { Stats } from "../components/home/Stats";
import { Features } from "../components/home/Features";
import { HowItWorks } from "../components/home/HowItWorks";
import { RecentDownloads } from "../components/home/RecentDownloads";
import { Faq } from "../components/home/Faq";
import { Cta } from "../components/home/Cta";

export function Home() {
  return (
    <>
      <Hero />
      <PlatformMarquee />
      <Stats />
      <Features />
      <HowItWorks />
      <RecentDownloads />
      <Faq />
      <Cta />
    </>
  );
}
