import Navbar from "@/components/home/Navbar";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import StatsSection from "@/components/home/StatsSection";
import DemoPreviewSection from "@/components/home/DemoPreviewSection";
import CTASection from "@/components/home/CTASection";
import Footer from "@/components/home/Footer";

const Home = () => {
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
