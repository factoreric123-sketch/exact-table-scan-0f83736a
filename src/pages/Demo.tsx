import { useState, useEffect } from "react";
import CategoryNav from "@/components/CategoryNav";
import SubcategoryNav from "@/components/SubcategoryNav";
import MenuGrid from "@/components/MenuGrid";
import RestaurantHeader from "@/components/RestaurantHeader";
import { menuData, categories, subcategories } from "@/data/menuData";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("Cocktails");
  const [activeSubcategory, setActiveSubcategory] = useState("MARTINIS");

  const filteredDishes = menuData.filter(
    (dish) => dish.category === activeCategory && dish.subcategory === activeSubcategory
  );

  const currentSubcategories = subcategories[activeCategory as keyof typeof subcategories] || [];

  // Update subcategory when category changes
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
        name="4 Charles"
        tagline="Prime Steakhouse"
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
            onSubcategoryChange={setActiveSubcategory}
          />
        )}
      </div>

      {/* Main Content */}
      <main>
        <MenuGrid dishes={filteredDishes} sectionTitle={activeSubcategory} />
      </main>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
          Powered By 
          <span className="font-semibold text-foreground">MenuTap</span>
        </p>
      </footer>
    </div>
  );
};

export default Index;
