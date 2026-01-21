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
    isNew: true,
    isPopular: true,
    hasOptions: true,
    options: [
      { id: "lobster-small", name: "Side", price: "12.00", order_index: 0 },
      { id: "lobster-regular", name: "Regular", price: "18.00", order_index: 1 },
      { id: "lobster-large", name: "Entrée", price: "26.00", order_index: 2 },
    ],
    modifiers: [
      { id: "lobster-mod-1", name: "Extra Lobster", price: "8.00", order_index: 0 },
      { id: "lobster-mod-2", name: "Bacon Bits", price: "3.00", order_index: 1 },
    ],
  },
  {
    id: "2",
    name: "Truffle Parmesan Fries",
    description: "Hand-cut fries tossed in truffle oil and parmesan",
    price: "$10",
    image: truffleFries,
    category: "Dinner",
    subcategory: "SIDES",
    allergens: ["Dairy"],
    calories: 520,
    isVegetarian: true,
    hasOptions: true,
    options: [
      { id: "truffle-small", name: "Small", price: "8.00", order_index: 0 },
      { id: "truffle-medium", name: "Medium", price: "12.00", order_index: 1 },
      { id: "truffle-large", name: "Large", price: "16.00", order_index: 2 },
    ],
    modifiers: [
      { id: "truffle-mod-1", name: "Bacon Crumbles", price: "3.00", order_index: 0 },
      { id: "truffle-mod-2", name: "Extra Truffle Drizzle", price: "2.00", order_index: 1 },
      { id: "truffle-mod-3", name: "Garlic Aioli", price: "1.50", order_index: 2 },
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
    hasOptions: true,
    options: [
      { id: "caesar-side", name: "Side", price: "8.00", order_index: 0 },
      { id: "caesar-full", name: "Full", price: "14.00", order_index: 1 },
    ],
    modifiers: [
      { id: "caesar-mod-1", name: "Add Grilled Chicken", price: "6.00", order_index: 0 },
      { id: "caesar-mod-2", name: "Add Grilled Shrimp", price: "8.00", order_index: 1 },
      { id: "caesar-mod-3", name: "Add Salmon", price: "10.00", order_index: 2 },
      { id: "caesar-mod-4", name: "Extra Parmesan", price: "1.50", order_index: 3 },
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
    isChefRecommendation: true,
    hasOptions: true,
    modifiers: [
      { id: "chicken-salad-mod-1", name: "Add Avocado", price: "3.00", order_index: 0 },
      { id: "chicken-salad-mod-2", name: "Add Bacon", price: "3.00", order_index: 1 },
      { id: "chicken-salad-mod-3", name: "Substitute Shrimp", price: "4.00", order_index: 2 },
    ],
  },

  // HOT APPETIZERS (3 items)
  {
    id: "5",
    name: "Mambo Wings",
    description: "Crispy wings with our signature Mambo sauce",
    price: "$16",
    image: mamboWings,
    category: "Dinner",
    subcategory: "HOT APPETIZERS",
    allergens: ["Gluten", "Soy"],
    calories: 580,
    isPopular: true,
    isSpicy: true,
    hasOptions: true,
    options: [
      { id: "mambo-small", name: "6 Wings", price: "12.00", order_index: 0 },
      { id: "mambo-medium", name: "12 Wings", price: "20.00", order_index: 1 },
      { id: "mambo-large", name: "24 Wings", price: "36.00", order_index: 2 },
    ],
    modifiers: [
      { id: "mambo-mod-1", name: "Extra Mambo Sauce", price: "1.50", order_index: 0 },
      { id: "mambo-mod-2", name: "Blue Cheese Dip", price: "2.00", order_index: 1 },
      { id: "mambo-mod-3", name: "Ranch Dip", price: "1.50", order_index: 2 },
    ],
  },
  {
    id: "6",
    name: "Crab Fries",
    description: "Golden fries topped with lump crab meat and cheese sauce",
    price: "$20",
    image: crabFries,
    category: "Dinner",
    subcategory: "HOT APPETIZERS",
    allergens: ["Shellfish", "Dairy"],
    calories: 720,
    isNew: true,
    isPopular: true,
  },
  {
    id: "7",
    name: "Jerk Chicken Egg Rolls",
    description: "Caribbean-spiced chicken in crispy egg roll wrappers",
    price: "$14",
    image: jerkChickenEggrolls,
    category: "Dinner",
    subcategory: "HOT APPETIZERS",
    allergens: ["Gluten", "Soy", "Eggs"],
    calories: 420,
    isChefRecommendation: true,
    isSpicy: true,
    hasOptions: true,
    modifiers: [
      { id: "jerk-mod-1", name: "Mango Salsa", price: "2.00", order_index: 0 },
      { id: "jerk-mod-2", name: "Jerk Aioli", price: "1.50", order_index: 1 },
    ],
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
    isChefRecommendation: true,
    hasOptions: true,
    options: [
      { id: "lamb-double", name: "Double (4 Chops)", price: "42.00", order_index: 0 },
      { id: "lamb-triple", name: "Triple (6 Chops)", price: "58.00", order_index: 1 },
    ],
    modifiers: [
      { id: "lamb-mod-1", name: "Add Truffle Mashed Potatoes", price: "6.00", order_index: 0 },
      { id: "lamb-mod-2", name: "Extra Demi-Glace", price: "3.00", order_index: 1 },
    ],
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
    isChefRecommendation: true,
    hasOptions: true,
    modifiers: [
      { id: "salmon-mod-1", name: "Cajun Blackened", price: "0.00", order_index: 0 },
      { id: "salmon-mod-2", name: "Teriyaki Glaze", price: "2.00", order_index: 1 },
      { id: "salmon-mod-3", name: "Add Shrimp (3pc)", price: "8.00", order_index: 2 },
    ],
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
    isPopular: true,
    hasOptions: true,
    options: [
      { id: "ribeye-12", name: "12oz", price: "38.00", order_index: 0 },
      { id: "ribeye-16", name: "16oz", price: "48.00", order_index: 1 },
      { id: "ribeye-24", name: "24oz Tomahawk", price: "72.00", order_index: 2 },
    ],
    modifiers: [
      { id: "ribeye-mod-1", name: "Add Lobster Tail", price: "18.00", order_index: 0 },
      { id: "ribeye-mod-2", name: "Add Shrimp (5pc)", price: "12.00", order_index: 1 },
      { id: "ribeye-mod-3", name: "Blue Cheese Crust", price: "4.00", order_index: 2 },
      { id: "ribeye-mod-4", name: "Peppercorn Sauce", price: "3.00", order_index: 3 },
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
    isNew: true,
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
    hasOptions: true,
    options: [
      { id: "ribs-half", name: "Half Rack", price: "24.00", order_index: 0 },
      { id: "ribs-full", name: "Full Rack", price: "38.00", order_index: 1 },
    ],
    modifiers: [
      { id: "ribs-mod-1", name: "Extra BBQ Sauce", price: "1.50", order_index: 0 },
      { id: "ribs-mod-2", name: "Add Coleslaw", price: "3.00", order_index: 1 },
      { id: "ribs-mod-3", name: "Add Cornbread", price: "3.00", order_index: 2 },
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
    isPopular: true,
    hasOptions: true,
    modifiers: [
      { id: "lava-mod-1", name: "Extra Ice Cream Scoop", price: "3.00", order_index: 0 },
      { id: "lava-mod-2", name: "Raspberry Drizzle", price: "1.50", order_index: 1 },
      { id: "lava-mod-3", name: "Whipped Cream", price: "1.00", order_index: 2 },
    ],
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
    hasOptions: true,
    options: [
      { id: "red-sangria-glass", name: "Glass", price: "10.00", order_index: 0 },
      { id: "red-sangria-carafe", name: "Carafe", price: "28.00", order_index: 1 },
      { id: "red-sangria-pitcher", name: "Pitcher", price: "42.00", order_index: 2 },
    ],
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
    isNew: true,
    hasOptions: true,
    options: [
      { id: "tropical-sangria-glass", name: "Glass", price: "12.00", order_index: 0 },
      { id: "tropical-sangria-carafe", name: "Carafe", price: "32.00", order_index: 1 },
      { id: "tropical-sangria-pitcher", name: "Pitcher", price: "48.00", order_index: 2 },
    ],
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
    isChefRecommendation: true,
    hasOptions: true,
    modifiers: [
      { id: "topnotch-mod-1", name: "Make it a Double", price: "6.00", order_index: 0 },
      { id: "topnotch-mod-2", name: "Premium Champagne Upgrade", price: "8.00", order_index: 1 },
    ],
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
    isPopular: true,
    hasOptions: true,
    modifiers: [
      { id: "panty-mod-1", name: "Make it a Double", price: "5.00", order_index: 0 },
    ],
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
    hasOptions: true,
    modifiers: [
      { id: "sneaky-mod-1", name: "Make it a Double", price: "6.00", order_index: 0 },
      { id: "sneaky-mod-2", name: "Extra Spicy", price: "0.00", order_index: 1 },
    ],
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
    hasOptions: true,
    modifiers: [
      { id: "mojito-mod-1", name: "Add Strawberry", price: "1.50", order_index: 0 },
      { id: "mojito-mod-2", name: "Add Mango", price: "1.50", order_index: 1 },
    ],
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
  },
];

export const categories = ["Dinner", "Cocktails"];

export const subcategories = {
  Dinner: ["SIDES", "SALADS", "HOT APPETIZERS", "ENTRÉES", "DESSERTS"],
  Cocktails: ["SANGRIA", "SPECIALTY", "MOCKTAILS"],
};
