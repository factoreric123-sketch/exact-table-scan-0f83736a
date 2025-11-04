import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/home/Navbar";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import StatsSection from "@/components/home/StatsSection";
import DemoPreviewSection from "@/components/home/DemoPreviewSection";
import CTASection from "@/components/home/CTASection";
import Footer from "@/components/home/Footer";

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const scrollTo = searchParams.get("scrollTo");
    if (scrollTo) {
      // Wait for the page to render
      setTimeout(() => {
        const element = document.getElementById(scrollTo);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
        // Clean up the URL
        searchParams.delete("scrollTo");
        setSearchParams(searchParams, { replace: true });
      }, 100);
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <DemoPreviewSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Home;
