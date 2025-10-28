import { Dish } from "@/components/DishCard";
import hummusBalzem from "@/assets/hummus-balzem.jpg";
import cretanSpread from "@/assets/cretan-spread.jpg";
import whippedPistachio from "@/assets/whipped-pistachio.jpg";
import babaganoush from "@/assets/babaganoush.jpg";
import zucchiniPancakes from "@/assets/zucchini-pancakes.jpg";
import searedTuna from "@/assets/seared-tuna.jpg";
import grilledPortobello from "@/assets/grilled-portobello.jpg";
import manti from "@/assets/manti.jpg";

export const menuData: Dish[] = [
  {
    id: "1",
    name: "Hummus Balzem",
    description: "with toasted pita",
    price: 14,
    image: hummusBalzem,
    category: "Dinner",
    subcategory: "MEZZES",
  },
  {
    id: "2",
    name: "Cretan Spread",
    description: "Cheese, walnut, pistachio",
    price: 14,
    image: cretanSpread,
    isNew: true,
    category: "Dinner",
    subcategory: "MEZZES",
  },
  {
    id: "3",
    name: "Whipped Pistachio",
    description: "Cheese, pistachio, greens",
    price: 14,
    image: whippedPistachio,
    isNew: true,
    category: "Dinner",
    subcategory: "MEZZES",
  },
  {
    id: "4",
    name: "Babaganoush",
    description: "with toasted pita",
    price: 15,
    image: babaganoush,
    category: "Dinner",
    subcategory: "MEZZES",
  },
  {
    id: "5",
    name: "Zucchini Pancakes",
    description: "dill, parsley, scallion, feta, egg, flour",
    price: 18,
    image: zucchiniPancakes,
    category: "Dinner",
    subcategory: "MEZZES",
  },
  {
    id: "6",
    name: "Seared Tuna",
    description: "with caper and olive dressing",
    price: 18,
    image: searedTuna,
    category: "Dinner",
    subcategory: "ENTREES",
  },
  {
    id: "7",
    name: "Grilled Portobello",
    description: "cheese, tomato, arugula (vegan option available)",
    price: 18,
    image: grilledPortobello,
    category: "Dinner",
    subcategory: "ENTREES",
  },
  {
    id: "8",
    name: "Manti",
    description: "authentic Turkish beef dumplings with yogurt, butter, dry herbs, only for the yogurt lover!",
    price: 18,
    image: manti,
    category: "Dinner",
    subcategory: "ENTREES",
  },
];

export const categories = ["Cocktails/Wines", "Dinner", "Desserts", "Doggie Specials", "Drinks", "Brunch/Lunch", "Late Night"];

export const subcategories = {
  Dinner: ["MEZZES", "ENTREES", "SALADS", "ANTIPASTI", "BALZEM FLATBREAD PIZZA", "SOUPS", "TO SHARE", "SIDES"],
};
