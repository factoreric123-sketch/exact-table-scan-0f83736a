import { useState, useEffect, useRef } from "react";
import CategoryNav from "@/components/CategoryNav";
import SubcategoryNav from "@/components/SubcategoryNav";
import MenuGrid from "@/components/MenuGrid";
import RestaurantHeader from "@/components/RestaurantHeader";
import { menuData, categories, subcategories } from "@/data/menuData";
import Footer from "@/components/home/Footer";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("Dinner");
  const [activeSubcategory, setActiveSubcategory] = useState("SIDES");
  const subcategoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const currentSubcategories = subcategories[activeCategory as keyof typeof subcategories] || [];

  // Scroll to subcategory when clicked with offset for sticky header
  const handleSubcategoryClick = (subcategory: string) => {
    setActiveSubcategory(subcategory);
    const element = subcategoryRefs.current[subcategory];
    if (element) {
      const headerOffset = 120; // Height of sticky navigation (adjust as needed)
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Update active subcategory based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // Offset for sticky header
      
      for (const subcategory of currentSubcategories) {
        const element = subcategoryRefs.current[subcategory];
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSubcategory(subcategory);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentSubcategories]);

  // Reset to first subcategory when category changes
  useEffect(() => {
    const newSubcategories = subcategories[activeCategory as keyof typeof subcategories] || [];
    if (newSubcategories.length > 0) {
      setActiveSubcategory(newSubcategories[0]);
    }
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-background">
      {/* Restaurant Hero */}
      <RestaurantHeader 
        name="Victory Restaurant and Lounge"
        tagline="Upscale Dining & Premium Cocktails"
        heroImageUrl={null}
      />

      {/* Category & Subcategory Navigation */}
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <CategoryNav 
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {currentSubcategories.length > 0 && (
          <SubcategoryNav
            subcategories={currentSubcategories}
            activeSubcategory={activeSubcategory}
            onSubcategoryChange={handleSubcategoryClick}
          />
        )}
      </div>

      {/* Main Content - All Subcategories in One Page */}
      <main>
        {currentSubcategories.map((subcategory) => {
          const subcategoryDishes = menuData.filter(
            (dish) => dish.category === activeCategory && dish.subcategory === subcategory
          );
          
          return (
            <div 
              key={subcategory}
              ref={(el) => subcategoryRefs.current[subcategory] = el}
            >
              <MenuGrid dishes={subcategoryDishes} sectionTitle={subcategory} />
            </div>
          );
        })}
      </main>

      {/* Footer */}
      <Footer/>
     
    </div>
  );
};

export default Index;
