import { Button } from "@/components/ui/button";
import { memo } from "react";

interface CategoryNavProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryNav = memo(({ categories, activeCategory, onCategoryChange }: CategoryNavProps) => {
  return (
    <nav className="flex gap-3 overflow-x-auto pb-3 pt-4 px-4 scrollbar-hide">
      {categories.map((category) => (
        <Button
          key={category}
          onClick={() => onCategoryChange(category)}
          variant={activeCategory === category ? "default" : "ghost"}
          className={`
            px-5 py-2 rounded-full whitespace-nowrap font-semibold text-sm transition-all
            ${activeCategory === category 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'text-foreground hover:bg-muted'
            }
          `}
        >
          {category}
        </Button>
      ))}
    </nav>
  );
});

CategoryNav.displayName = 'CategoryNav';

export default CategoryNav;
