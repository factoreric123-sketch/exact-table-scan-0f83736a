import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, X } from "lucide-react";
import { Wheat, Milk, Egg, Fish, Shell, Nut, Beef, Flame, Salad, Sprout, Sparkles, Star, TrendingUp, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

type EditableCellProps =
  | { type: "text"; value: string; onSave: (value: string) => void }
  | { type: "textarea"; value: string; onSave: (value: string) => void }
  | { type: "number"; value: string | number; onSave: (value: string | number) => void }
  | { type: "multi-select"; value: string[]; onSave: (value: string[]) => void; options: string[] }
  | { type: "boolean-group"; value: Record<string, boolean>; onSave: (value: Record<string, boolean>) => void };

const allergenIcons: Record<string, any> = {
  gluten: Wheat,
  dairy: Milk,
  eggs: Egg,
  fish: Fish,
  shellfish: Shell,
  nuts: Nut,
  soy: Salad,
  pork: Beef,
  beef: Beef,
  poultry: Beef,
};

const dietaryIcons: Record<string, any> = {
  vegetarian: Salad,
  vegan: Sprout,
  spicy: Flame,
};

const badgeIcons: Record<string, any> = {
  new: Sparkles,
  special: Star,
  popular: TrendingUp,
  chef: ChefHat,
};

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export const EditableCell = (props: EditableCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(props.value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(props.value);
  }, [props.value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (props.type === "text" || props.type === "textarea" || props.type === "number") {
      if (localValue !== props.value) {
        props.onSave(localValue as any);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && props.type !== "textarea") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setLocalValue(props.value);
      setIsEditing(false);
    }
  };

  // Text input
  if (props.type === "text" || props.type === "number") {
    if (isEditing) {
      return (
        <Input
          ref={inputRef as any}
          type={props.type === "number" ? "number" : "text"}
          value={localValue as string}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-8 text-sm border-border"
        />
      );
    }

    return (
      <div
        onClick={() => setIsEditing(true)}
        className="cursor-text hover:bg-muted/50 rounded px-2 py-1 min-h-[32px] flex items-center transition-colors text-sm"
      >
        {String(localValue) || <span className="text-muted-foreground">Click to edit</span>}
      </div>
    );
  }

  // Textarea
  if (props.type === "textarea") {
    if (isEditing) {
      return (
        <Textarea
          ref={inputRef as any}
          value={localValue as string}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="min-h-[60px] text-sm resize-none border-border"
        />
      );
    }

    return (
      <div
        onClick={() => setIsEditing(true)}
        className="cursor-text hover:bg-muted/50 rounded px-2 py-1 min-h-[32px] transition-colors line-clamp-2 text-sm"
      >
        {String(localValue) || <span className="text-muted-foreground">Click to edit</span>}
      </div>
    );
  }

  // Multi-select (Allergens)
  if (props.type === "multi-select") {
    const selected = props.value;
    const available = props.options.filter((opt) => !selected.includes(opt));

    const handleToggle = (allergen: string) => {
      const newValue = selected.includes(allergen)
        ? selected.filter((a) => a !== allergen)
        : [...selected, allergen];
      props.onSave(newValue);
    };

    return (
      <div className="flex flex-wrap items-center gap-1 min-h-[32px]">
        {selected.map((allergen) => {
          const Icon = allergenIcons[allergen];
          return (
            <Badge
              key={allergen}
              variant="secondary"
              className="gap-1 px-2 py-0.5 text-xs h-6 cursor-pointer hover:bg-secondary/80 transition-colors"
              onClick={() => handleToggle(allergen)}
            >
              {Icon && <Icon className="h-3 w-3" />}
              {capitalize(allergen)}
              <X className="h-2.5 w-2.5 opacity-70 hover:opacity-100" />
            </Badge>
          );
        })}
        <Popover>
          <PopoverTrigger asChild>
            <Badge
              variant="outline"
              className="gap-1 px-2 py-0.5 text-xs h-6 cursor-pointer hover:bg-muted transition-colors"
            >
              <Plus className="h-3 w-3" />
            </Badge>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="grid grid-cols-2 gap-1">
              {available.map((allergen) => {
                const Icon = allergenIcons[allergen];
                return (
                  <button
                    key={allergen}
                    onClick={() => handleToggle(allergen)}
                    className="flex items-center gap-2 px-3 py-2 text-xs rounded hover:bg-muted transition-colors text-left"
                  >
                    {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
                    {capitalize(allergen)}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Boolean group (Dietary or Badges)
  if (props.type === "boolean-group") {
    const iconMap = { ...dietaryIcons, ...badgeIcons };
    const values = props.value;

    const handleToggle = (key: string) => {
      props.onSave({
        ...values,
        [key]: !values[key],
      });
    };

    return (
      <div className="flex flex-wrap items-center gap-1 min-h-[32px]">
        {Object.entries(values).map(([key, active]) => {
          const Icon = iconMap[key];
          return (
            <Badge
              key={key}
              variant={active ? "default" : "outline"}
              className={cn(
                "gap-1 px-2 py-0.5 text-xs h-6 cursor-pointer transition-all active:scale-95",
                active ? "hover:opacity-90" : "hover:bg-muted"
              )}
              onClick={() => handleToggle(key)}
            >
              {active && Icon && <Icon className="h-3 w-3" />}
              {capitalize(key)}
            </Badge>
          );
        })}
      </div>
    );
  }

  return null;
};
