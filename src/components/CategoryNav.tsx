import { Button } from "@/components/ui/button";

interface CategoryNavProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryNav = ({ categories, activeCategory, onCategoryChange }: CategoryNavProps) => {
  return (
    <nav className="flex gap-3 overflow-x-auto pb-4 pt-6 px-6 scrollbar-hide">
      {categories.map((category) => (
        <Button
          key={category}
          onClick={() => onCategoryChange(category)}
          variant={activeCategory === category ? "default" : "ghost"}
          className={`
            px-6 py-2.5 rounded-full whitespace-nowrap font-medium transition-all
            ${activeCategory === category 
              ? 'bg-primary text-primary-foreground' 
              : 'text-foreground hover:bg-muted'
            }
          `}
        >
          {category}
        </Button>
      ))}
    </nav>
  );
};

export default CategoryNav;
