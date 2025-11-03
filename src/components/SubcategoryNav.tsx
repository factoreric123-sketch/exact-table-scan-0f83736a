import { memo } from "react";

interface SubcategoryNavProps {
  subcategories: string[];
  activeSubcategory: string;
  onSubcategoryChange: (subcategory: string) => void;
}

const SubcategoryNav = memo(({ subcategories, activeSubcategory, onSubcategoryChange }: SubcategoryNavProps) => {
  return (
    <nav className="flex gap-8 overflow-x-auto px-4 pb-3 scrollbar-hide">
      {subcategories.map((subcategory) => (
        <button
          key={subcategory}
          onClick={() => onSubcategoryChange(subcategory)}
          className={`
            text-xs font-bold uppercase tracking-wider whitespace-nowrap pb-3 transition-all relative
            ${activeSubcategory === subcategory 
              ? 'text-foreground' 
              : 'text-muted-foreground hover:text-foreground'
            }
            ${activeSubcategory === subcategory ? 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground' : ''}
          `}
        >
          {subcategory}
        </button>
      ))}
    </nav>
  );
});

SubcategoryNav.displayName = 'SubcategoryNav';

export default SubcategoryNav;
