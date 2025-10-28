interface SubcategoryNavProps {
  subcategories: string[];
  activeSubcategory: string;
  onSubcategoryChange: (subcategory: string) => void;
}

const SubcategoryNav = ({ subcategories, activeSubcategory, onSubcategoryChange }: SubcategoryNavProps) => {
  return (
    <nav className="flex gap-6 overflow-x-auto px-6 pb-4 scrollbar-hide border-b border-border">
      {subcategories.map((subcategory) => (
        <button
          key={subcategory}
          onClick={() => onSubcategoryChange(subcategory)}
          className={`
            text-sm font-semibold uppercase tracking-wide whitespace-nowrap pb-2 transition-all
            ${activeSubcategory === subcategory 
              ? 'text-foreground border-b-2 border-foreground' 
              : 'text-muted-foreground hover:text-foreground'
            }
          `}
        >
          {subcategory}
        </button>
      ))}
    </nav>
  );
};

export default SubcategoryNav;
