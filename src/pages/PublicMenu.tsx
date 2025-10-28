import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Bookmark, Share2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import CategoryNav from "@/components/CategoryNav";
import SubcategoryNav from "@/components/SubcategoryNav";
import MenuGrid from "@/components/MenuGrid";
import RestaurantHeader from "@/components/RestaurantHeader";
import { useRestaurant } from "@/hooks/useRestaurants";
import { useCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { useDishes } from "@/hooks/useDishes";

const PublicMenu = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: restaurant, isLoading: restaurantLoading } = useRestaurant(slug || "");
  const { data: categories } = useCategories(restaurant?.id || "");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [activeSubcategory, setActiveSubcategory] = useState<string>("");

  const activeCategoryObj = categories?.find((c) => c.id === activeCategory);
  const { data: subcategories } = useSubcategories(activeCategoryObj?.id || "");
  
  const activeSubcategoryObj = subcategories?.find((s) => s.id === activeSubcategory);
  const { data: dishes } = useDishes(activeSubcategoryObj?.id || "");

  // Set initial active category and subcategory
  useEffect(() => {
    if (categories && categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    if (subcategories && subcategories.length > 0) {
      setActiveSubcategory(subcategories[0].id);
    }
  }, [subcategories]);

  if (restaurantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!restaurant || !restaurant.published) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Restaurant Not Found</h1>
          <p className="text-muted-foreground">This menu is not available.</p>
        </div>
      </div>
    );
  }

  const categoryNames = categories?.map((c) => c.name) || [];
  const activeCategoryName = categories?.find((c) => c.id === activeCategory)?.name || "";

  return (
    <div className="min-h-screen bg-background">
      {/* Top Action Bar */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bookmark className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Restaurant Hero */}
      <RestaurantHeader 
        name={restaurant.name}
        tagline={restaurant.tagline || ""}
        heroImageUrl={restaurant.hero_image_url}
      />

      {/* Category & Subcategory Navigation */}
      <div className="sticky top-[57px] z-40 bg-background border-b border-border">
        <CategoryNav 
          categories={categoryNames}
          activeCategory={activeCategoryName}
          onCategoryChange={(name) => {
            const cat = categories?.find((c) => c.name === name);
            if (cat) setActiveCategory(cat.id);
          }}
        />

        {subcategories && subcategories.length > 0 && (
          <SubcategoryNav
            subcategories={subcategories.map((s) => s.name)}
            activeSubcategory={activeSubcategoryObj?.name || ""}
            onSubcategoryChange={(name) => {
              const sub = subcategories.find((s) => s.name === name);
              if (sub) setActiveSubcategory(sub.id);
            }}
          />
        )}
      </div>

      {/* Main Content */}
      <main>
        <MenuGrid 
          dishes={dishes?.map((d) => ({
            id: d.id,
            name: d.name,
            description: d.description || "",
            price: d.price,
            image: d.image_url || "",
            isNew: d.is_new,
            category: activeCategoryName,
            subcategory: activeSubcategoryObj?.name || "",
          })) || []}
          sectionTitle={activeSubcategoryObj?.name || ""}
        />
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

export default PublicMenu;
