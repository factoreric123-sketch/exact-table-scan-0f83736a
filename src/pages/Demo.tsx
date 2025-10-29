import { useState, useEffect } from "react";
import { Bookmark, Share2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import CategoryNav from "@/components/CategoryNav";
import SubcategoryNav from "@/components/SubcategoryNav";
import MenuGrid from "@/components/MenuGrid";
import RestaurantHeader from "@/components/RestaurantHeader";
import { menuData, categories, subcategories } from "@/data/menuData";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("Dinner");
  const [activeSubcategory, setActiveSubcategory] = useState("MEZZES");

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
      {/* Top Action Bar */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-foreground text-xs h-8 px-3">
              CONNECT
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bookmark className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="sm" className="text-foreground border-border text-xs h-8 px-3">
              SIGN UP
            </Button>
          </div>
        </div>
      </header>

      {/* Restaurant Hero */}
      <RestaurantHeader 
        name="balzem"
        tagline="Mediterranean Cuisine"
        heroImageUrl={null}
      />

      {/* Category & Subcategory Navigation */}
      <div className="sticky top-[57px] z-40 bg-background border-b border-border">
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
          <span className="font-semibold text-foreground">TAPTAB</span>
        </p>
      </footer>
    </div>
  );
};

export default Index;
