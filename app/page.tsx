import Footer from "@/components/Footer";
import AboutSection from "@/components/home/AboutSection";
import CTASection from "@/components/home/CTASection";
import FAQSection from "@/components/home/FAQSection";
import FeatureSection from "@/components/home/FeatureSection";
import HeroSection from "@/components/home/HomeSection";
import TestimonialSection from "@/components/home/TestimonialSection";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeatureSection />
        <AboutSection />
        <TestimonialSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
