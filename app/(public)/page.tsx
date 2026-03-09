import Hero         from "@/components/sections/Hero";
import HowItWorks   from "@/components/sections/HowItWorks";
import Journey      from "@/components/sections/Journey";
import Pricing      from "@/components/sections/Pricing";
import Testimonials from "@/components/sections/Testimonials";
import CTA          from "@/components/sections/CTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Journey />
      <Pricing />
      <Testimonials />
      <CTA />
    </>
  );
}