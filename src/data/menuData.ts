import { Dish } from "@/components/DishCard";

// Import Victory Restaurant images - SIDES
import lobsterMacCheese from "@/assets/victory/lobster-mac-cheese.jpg";
import truffleFries from "@/assets/victory/truffle-fries.jpg";

// SALADS
import caesarSalad from "@/assets/victory/caesar-salad.jpg";
import grilledChickenSalad from "@/assets/victory/grilled-chicken-salad.jpg";

// HOT APPETIZERS
import mamboWings from "@/assets/victory/mambo-wings-new.jpg";
import crabFries from "@/assets/victory/crab-fries-new.jpg";
import jerkChickenEggrolls from "@/assets/victory/jerk-eggrolls-new.jpg";

// ENTRÉES
import lambChops from "@/assets/victory/lamb-chops-new.jpg";
import grilledSalmon from "@/assets/victory/grilled-salmon-new.jpg";
import ribeyeSteak from "@/assets/victory/ribeye-steak-new.jpg";
import shrimpGrits from "@/assets/victory/shrimp-grits-new.jpg";
import bbqRibs from "@/assets/victory/bbq-ribs.jpg";

// DESSERTS
import chocolateLavaCake from "@/assets/victory/chocolate-lava-cake.jpg";
import nyCheesecake from "@/assets/victory/ny-cheesecake.jpg";

// SANGRIA
import redSangria from "@/assets/victory/red-sangria.jpg";
import tropicalSangria from "@/assets/victory/tropical-sangria.jpg";

// SPECIALTY COCKTAILS
import topNotch from "@/assets/victory/top-notch.jpg";
import pantyDropper from "@/assets/victory/panty-dropper.jpg";
import sneakyLink from "@/assets/victory/sneaky-link.jpg";

// MOCKTAILS
import virginMojito from "@/assets/victory/virgin-mojito.jpg";
import strawberryLemonade from "@/assets/victory/strawberry-lemonade.jpg";

export const menuData: Dish[] = [
  // SIDES (2 items)
  {
    id: "1",
    name: "Lobster Mac N Cheese",
    description: "Creamy mac and cheese with succulent lobster pieces",
    price: "$18",
    image: lobsterMacCheese,
    category: "Dinner",
    subcategory: "SIDES",
    allergens: ["Shellfish", "Dairy", "Gluten"],
    calories: 650,
    isNew: true, // Badge: New
  },
  {
    id: "2",
    name: "Truffle Parmesan Fries",
    description: "Hand-cut fries tossed in truffle oil and parmesan",
    price: "$8",
    image: truffleFries,
    category: "Dinner",
    subcategory: "SIDES",
    allergens: ["Dairy"],
    calories: 520,
    isVegetarian: true,
    // No badge
    hasOptions: true,
    options: [
      { id: "truffle-small", name: "Small", price: "8.00", order_index: 0 },
      { id: "truffle-medium", name: "Medium", price: "12.00", order_index: 1 },
      { id: "truffle-large", name: "Large", price: "16.00", order_index: 2 },
    ],
  },

  // SALADS (2 items)
  {
    id: "3",
    name: "Caesar Salad",
    description: "Crisp romaine, parmesan, croutons, classic Caesar dressing",
    price: "$14",
    image: caesarSalad,
    category: "Dinner",
    subcategory: "SALADS",
    allergens: ["Dairy", "Gluten", "Eggs"],
    calories: 320,
    isVegetarian: true,
    isPopular: true, // Badge: Popular
    hasOptions: true,
    modifiers: [
      { id: "caesar-mod-1", name: "Add Grilled Chicken", price: "6.00", order_index: 0 },
      { id: "caesar-mod-2", name: "Add Grilled Shrimp", price: "8.00", order_index: 1 },
      { id: "caesar-mod-3", name: "Add Salmon", price: "10.00", order_index: 2 },
    ],
  },
  {
    id: "4",
    name: "Grilled Chicken Salad",
    description: "Mixed greens, grilled chicken, cherry tomatoes, balsamic vinaigrette",
    price: "$18",
    image: grilledChickenSalad,
    category: "Dinner",
    subcategory: "SALADS",
    allergens: ["Dairy"],
    calories: 420,
    // No badge
  },

  // Appetizer (3 items)
  {
    id: "5",
    name: "Mambo Wings",
    description: "Crispy wings with our signature Mambo sauce",
    price: "$12",
    image: mamboWings,
    category: "Dinner",
    subcategory: "Appetizer",
    allergens: ["Gluten", "Soy"],
    calories: 580,
    isSpicy: true,
    isChefRecommendation: true, // Badge: Chef's Pick
    hasOptions: true,
    options: [
      { id: "mambo-small", name: "6 Wings", price: "12.00", order_index: 0 },
      { id: "mambo-medium", name: "12 Wings", price: "20.00", order_index: 1 },
      { id: "mambo-large", name: "24 Wings", price: "36.00", order_index: 2 },
    ],
  },
  {
    id: "6",
    name: "Crab Fries",
    description: "Golden fries topped with lump crab meat and cheese sauce",
    price: "$20",
    image: crabFries,
    category: "Dinner",
    subcategory: "Appetizer",
    allergens: ["Shellfish", "Dairy"],
    calories: 720,
    isSpecial: true, // Badge: Special
  },
  {
    id: "7",
    name: "Jerk Chicken Egg Rolls",
    description: "Caribbean-spiced chicken in crispy egg roll wrappers",
    price: "$14",
    image: jerkChickenEggrolls,
    category: "Dinner",
    subcategory: "Appetizer",
    allergens: ["Gluten", "Soy", "Eggs"],
    calories: 420,
    isSpicy: true,
    // No badge
  },

  // ENTRÉES (5 items)
  {
    id: "8",
    name: "Lamb Chops",
    description: "Herb-crusted lamb chops with rosemary demi-glace",
    price: "$42",
    image: lambChops,
    category: "Dinner",
    subcategory: "ENTRÉES",
    allergens: ["Allium"],
    calories: 680,
    isChefRecommendation: true, // Badge: Chef's Pick
  },
  {
    id: "9",
    name: "Grilled Salmon",
    description: "Atlantic salmon with lemon butter sauce and seasonal vegetables",
    price: "$32",
    image: grilledSalmon,
    category: "Dinner",
    subcategory: "ENTRÉES",
    allergens: ["Dairy", "Allium"],
    calories: 520,
    // No badge
  },
  {
    id: "10",
    name: "Ribeye Steak",
    description: "Prime ribeye with garlic butter and mashed potatoes",
    price: "$38",
    image: ribeyeSteak,
    category: "Dinner",
    subcategory: "ENTRÉES",
    allergens: ["Dairy", "Allium"],
    calories: 920,
    isPopular: true, // Badge: Popular
    hasOptions: true,
    options: [
      { id: "ribeye-12", name: "12oz", price: "38.00", order_index: 0 },
      { id: "ribeye-16", name: "16oz", price: "48.00", order_index: 1 },
      { id: "ribeye-24", name: "24oz Tomahawk", price: "72.00", order_index: 2 },
    ],
  },
  {
    id: "11",
    name: "Shrimp & Grits",
    description: "Jumbo shrimp over creamy stone-ground grits with Cajun cream sauce",
    price: "$26",
    image: shrimpGrits,
    category: "Dinner",
    subcategory: "ENTRÉES",
    allergens: ["Shellfish", "Dairy", "Allium"],
    calories: 740,
    isNew: true, // Badge: New
  },
  {
    id: "12",
    name: "BBQ Ribs",
    description: "Fall-off-the-bone baby back ribs with house BBQ sauce",
    price: "$24",
    image: bbqRibs,
    category: "Dinner",
    subcategory: "ENTRÉES",
    allergens: ["Soy", "Allium"],
    calories: 840,
    // No badge
    hasOptions: true,
    options: [
      { id: "ribs-half", name: "Half Rack", price: "24.00", order_index: 0 },
      { id: "ribs-full", name: "Full Rack", price: "38.00", order_index: 1 },
    ],
  },

  // DESSERTS (2 items)
  {
    id: "13",
    name: "Chocolate Lava Cake",
    description: "Warm chocolate cake with molten center, vanilla ice cream",
    price: "$12",
    image: chocolateLavaCake,
    category: "Dinner",
    subcategory: "DESSERTS",
    allergens: ["Dairy", "Gluten", "Eggs"],
    calories: 620,
    isPopular: true, // Badge: Popular
  },
  {
    id: "14",
    name: "New York Cheesecake",
    description: "Classic creamy cheesecake with berry compote",
    price: "$11",
    image: nyCheesecake,
    category: "Dinner",
    subcategory: "DESSERTS",
    allergens: ["Dairy", "Gluten", "Eggs"],
    calories: 540,
    // No badge
  },

  // SANGRIA (2 items)
  {
    id: "15",
    name: "Red Sangria",
    description: "Red wine with fresh fruit and brandy",
    price: "$10",
    image: redSangria,
    category: "Cocktails",
    subcategory: "SANGRIA",
    calories: 180,
    // No badge
  },
  {
    id: "16",
    name: "Tropical Sangria",
    description: "White wine with mango, pineapple, and coconut rum",
    price: "$12",
    image: tropicalSangria,
    category: "Cocktails",
    subcategory: "SANGRIA",
    calories: 200,
    isNew: true, // Badge: New
  },

  // SPECIALTY COCKTAILS (3 items)
  {
    id: "17",
    name: "Top Notch",
    description: "Premium vodka, elderflower, champagne, fresh berries",
    price: "$16",
    image: topNotch,
    category: "Cocktails",
    subcategory: "SPECIALTY",
    calories: 220,
    isChefRecommendation: true, // Badge: Chef's Pick
  },
  {
    id: "18",
    name: "Panty Dropper",
    description: "Vodka, peach schnapps, cranberry, pineapple juice",
    price: "$14",
    image: pantyDropper,
    category: "Cocktails",
    subcategory: "SPECIALTY",
    calories: 240,
    // No badge
  },
  {
    id: "19",
    name: "Sneaky Link",
    description: "Tequila, triple sec, lime, agave, jalapeño",
    price: "$15",
    image: sneakyLink,
    category: "Cocktails",
    subcategory: "SPECIALTY",
    calories: 190,
    isSpicy: true,
    isSpecial: true, // Badge: Special
  },

  // MOCKTAILS (2 items)
  {
    id: "20",
    name: "Virgin Mojito",
    description: "Fresh mint, lime, soda water, sugar",
    price: "$8",
    image: virginMojito,
    category: "Cocktails",
    subcategory: "MOCKTAILS",
    calories: 120,
    isVegan: true,
    // No badge
  },
  {
    id: "21",
    name: "Strawberry Lemonade",
    description: "Fresh strawberries, lemon juice, sparkling water",
    price: "$7",
    image: strawberryLemonade,
    category: "Cocktails",
    subcategory: "MOCKTAILS",
    calories: 110,
    isVegan: true,
    isPopular: true, // Badge: Popular
  },
];

export const categories = ["Dinner", "Cocktails"];

export const subcategories = {
  Dinner: ["SIDES", "SALADS", "Appetizer", "ENTRÉES", "DESSERTS"],
  Cocktails: ["SANGRIA", "SPECIALTY", "MOCKTAILS"],
};
