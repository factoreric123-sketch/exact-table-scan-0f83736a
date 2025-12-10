import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, X } from "lucide-react";
import { Wheat, Milk, Egg, Fish, Shell, Nut, Beef, Flame, Salad, Sprout, Sparkles, Star, TrendingUp, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

type EditableCellProps =
  | { type: "text"; value: string; onSave: (value: string) => void; placeholder?: string }
  | { type: "textarea"; value: string; onSave: (value: string) => void; placeholder?: string }
  | { type: "number"; value: string | number; onSave: (value: string | number) => void; placeholder?: string }
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

    const placeholderText = props.type === "number" && props.placeholder !== undefined 
      ? props.placeholder 
      : "Click to edit";
      
    return (
      <div
        onClick={() => setIsEditing(true)}
        className="cursor-text hover:bg-muted/50 rounded px-2 py-1 min-h-[32px] flex items-center transition-colors text-sm"
      >
        {String(localValue) || (placeholderText && <span className="text-muted-foreground">{placeholderText}</span>)}
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

  // Multi-select (Allergens) - Toggle-style like dietary info
  if (props.type === "multi-select") {
    return (
      <div className="flex flex-wrap items-center gap-1 min-h-[32px]">
        {props.options?.map((option) => {
          const isSelected = (localValue as string[]).includes(option);
          const Icon = allergenIcons[option];
          return (
            <Badge
              key={option}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "gap-1 px-2 py-0.5 text-xs h-6 cursor-pointer transition-all active:scale-95",
                isSelected ? "hover:opacity-90" : "hover:bg-muted"
              )}
              onClick={() => {
                const newValue = isSelected
                  ? (localValue as string[]).filter((v) => v !== option)
                  : [...(localValue as string[]), option];
                props.onSave(newValue);
              }}
            >
              {Icon && <Icon className="h-3 w-3" />}
              {capitalize(option)}
            </Badge>
          );
        })}
      </div>
    );
  }

  // Boolean group (Dietary or Badges) - Using switches for table view
  if (props.type === "boolean-group") {
    const iconMap = { ...dietaryIcons, ...badgeIcons };
    const values = props.value;

    const handleToggle = (key: string, checked: boolean) => {
      const newValues = {
        ...values,
        [key]: checked,
      };
      // Update local state immediately for instant feedback
      setLocalValue(newValues);
      props.onSave(newValues);
    };

    return (
      <div className="flex flex-col gap-2">
        {Object.entries(values).map(([key, active]) => {
          const Icon = iconMap[key];
          const label = key === "chef" ? "Chef's Pick" : capitalize(key);
          
          return (
            <div key={key} className="flex items-center justify-between gap-2">
              <Label htmlFor={`switch-${key}`} className="flex items-center gap-1.5 text-xs cursor-pointer m-0">
                {Icon && <Icon className="h-3 w-3" />}
                <span>{label}</span>
              </Label>
              <Switch
                id={`switch-${key}`}
                checked={active}
                onCheckedChange={(checked) => handleToggle(key, checked)}
                className="scale-75"
              />
            </div>
          );
        })}
      </div>
    );
  }

  return null;
};
