import { useState } from "react";
import { Bookmark, Share2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import CategoryNav from "@/components/CategoryNav";
import SubcategoryNav from "@/components/SubcategoryNav";
import MenuGrid from "@/components/MenuGrid";
import { menuData, categories, subcategories } from "@/data/menuData";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("Dinner");
  const [activeSubcategory, setActiveSubcategory] = useState("MEZZES");

  const filteredDishes = menuData.filter(
    (dish) => dish.category === activeCategory && dish.subcategory === activeSubcategory
  );

  const currentSubcategories = subcategories[activeCategory as keyof typeof subcategories] || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-6 py-4">
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-foreground">
              CONNECT
            </Button>
            <Button variant="ghost" size="icon">
              <Bookmark className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="sm" className="text-foreground border-border">
              SIGN UP
            </Button>
          </div>
        </div>

        {/* Category Navigation */}
        <CategoryNav 
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* Subcategory Navigation */}
        {currentSubcategories.length > 0 && (
          <SubcategoryNav
            subcategories={currentSubcategories}
            activeSubcategory={activeSubcategory}
            onSubcategoryChange={setActiveSubcategory}
          />
        )}
      </header>

      {/* Main Content */}
      <main>
        <div className="pt-4">
          <h2 className="text-2xl font-bold px-6 mb-4">{activeSubcategory}</h2>
          <MenuGrid dishes={filteredDishes} />
        </div>
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
