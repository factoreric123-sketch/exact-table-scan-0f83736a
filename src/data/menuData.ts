import { Dish } from "@/components/DishCard";

// Import Victory Restaurant images - SIDES
import lobsterMacCheese from "@/assets/victory/lobster-mac-cheese.jpg";
import collardGreens from "@/assets/victory/collard-greens.jpg";
import truffleFries from "@/assets/victory/truffle-fries.jpg";
import garlicMashedPotatoes from "@/assets/victory/garlic-mashed-potatoes.jpg";

// SALADS
import caesarSalad from "@/assets/victory/caesar-salad.jpg";
import grilledChickenSalad from "@/assets/victory/grilled-chicken-salad.jpg";
import strawberrySpinachSalad from "@/assets/victory/strawberry-spinach-salad.jpg";

// HOT APPETIZERS
import victoryShrimp from "@/assets/victory/victory-shrimp-new.jpg";
import mamboWings from "@/assets/victory/mambo-wings-new.jpg";
import crabFries from "@/assets/victory/crab-fries-new.jpg";
import jerkChickenEggrolls from "@/assets/victory/jerk-eggrolls-new.jpg";
import loadedNachos from "@/assets/victory/loaded-nachos.jpg";
import friedCalamari from "@/assets/victory/fried-calamari.jpg";

// ENTRÉES
import lambChops from "@/assets/victory/lamb-chops-new.jpg";
import grilledSalmon from "@/assets/victory/grilled-salmon-new.jpg";
import chickenShrimpPasta from "@/assets/victory/chicken-shrimp-pasta-new.jpg";
import shrimpGrits from "@/assets/victory/shrimp-grits-new.jpg";
import ribeyeSteak from "@/assets/victory/ribeye-steak-new.jpg";
import surfNTurf from "@/assets/victory/surf-n-turf.jpg";
import jerkChicken from "@/assets/victory/jerk-chicken-new.jpg";
import blackenedCatfish from "@/assets/victory/blackened-catfish.jpg";
import bbqRibs from "@/assets/victory/bbq-ribs.jpg";
import vegetableStirFry from "@/assets/victory/vegetable-stir-fry.jpg";

// DESSERTS
import chocolateLavaCake from "@/assets/victory/chocolate-lava-cake.jpg";
import peachCobbler from "@/assets/victory/peach-cobbler.jpg";
import nyCheesecake from "@/assets/victory/ny-cheesecake.jpg";
import bananaPudding from "@/assets/victory/banana-pudding.jpg";

// SANGRIA
import redSangria from "@/assets/victory/red-sangria.jpg";
import whiteSangria from "@/assets/victory/white-sangria.jpg";
import tropicalSangria from "@/assets/victory/tropical-sangria.jpg";

// SPECIALTY COCKTAILS
import topNotch from "@/assets/victory/top-notch.jpg";
import pantyDropper from "@/assets/victory/panty-dropper.jpg";
import sneakyLink from "@/assets/victory/sneaky-link.jpg";
import soakCity from "@/assets/victory/soak-city.jpg";
import sweetEscape from "@/assets/victory/sweet-escape.jpg";
import victoryMule from "@/assets/victory/victory-mule.jpg";
import bourbonSmash from "@/assets/victory/bourbon-smash.jpg";

// MOCKTAILS
import virginMojito from "@/assets/victory/virgin-mojito.jpg";
import strawberryLemonade from "@/assets/victory/strawberry-lemonade.jpg";
import tropicalPunch from "@/assets/victory/tropical-punch.jpg";

export const menuData: Dish[] = [
  // SIDES
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
  },
  {
    id: "2",
    name: "Collard Greens",
    description: "Slow-cooked Southern-style collard greens",
    price: "$12",
    image: collardGreens,
    category: "Dinner",
    subcategory: "SIDES",
    allergens: ["Allium"],
    calories: 180,
    isVegetarian: true,
  },
  {
    id: "3",
    name: "Truffle Parmesan Fries",
    description: "Hand-cut fries tossed in truffle oil and parmesan",
    price: "$14",
    image: truffleFries,
    category: "Dinner",
    subcategory: "SIDES",
    allergens: ["Dairy"],
    calories: 520,
    isVegetarian: true,
    isNew: true,
  },
  {
    id: "4",
    name: "Garlic Mashed Potatoes",
    description: "Creamy mashed potatoes infused with roasted garlic",
    price: "$12",
    image: garlicMashedPotatoes,
    category: "Dinner",
    subcategory: "SIDES",
    allergens: ["Dairy", "Allium"],
    calories: 380,
    isVegetarian: true,
  },

  // SALADS
  {
    id: "5",
    name: "Caesar Salad",
    description: "Crisp romaine, parmesan, croutons, classic Caesar dressing",
    price: "$14",
    image: caesarSalad,
    category: "Dinner",
    subcategory: "SALADS",
    allergens: ["Dairy", "Gluten", "Eggs"],
    calories: 320,
    isVegetarian: true,
  },
  {
    id: "6",
    name: "Grilled Chicken Salad",
    description: "Mixed greens, grilled chicken, cherry tomatoes, balsamic vinaigrette",
    price: "$18",
    image: grilledChickenSalad,
    category: "Dinner",
    subcategory: "SALADS",
    allergens: ["Dairy"],
    calories: 420,
    isChefRecommendation: true,
  },
  {
    id: "7",
    name: "Strawberry Spinach Salad",
    description: "Fresh spinach, strawberries, candied pecans, goat cheese, poppy seed dressing",
    price: "$16",
    image: strawberrySpinachSalad,
    category: "Dinner",
    subcategory: "SALADS",
    allergens: ["Dairy"],
    calories: 360,
    isVegetarian: true,
    isNew: true,
  },

  // HOT APPETIZERS
  {
    id: "8",
    name: "Victory Shrimp",
    description: "Crispy fried shrimp tossed in signature Victory sauce",
    price: "$18",
    image: victoryShrimp,
    category: "Dinner",
    subcategory: "HOT APPETIZERS",
    allergens: ["Shellfish", "Gluten"],
    calories: 480,
    isPopular: true,
    isChefRecommendation: true,
    isSpicy: true,
  },
  {
    id: "9",
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
  },
  {
    id: "10",
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
    id: "11",
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
  },
  {
    id: "12",
    name: "Loaded Nachos",
    description: "Tortilla chips loaded with cheese, jalapeños, sour cream, and pico de gallo",
    price: "$15",
    image: loadedNachos,
    category: "Dinner",
    subcategory: "HOT APPETIZERS",
    allergens: ["Dairy", "Gluten"],
    calories: 890,
    isVegetarian: true,
    isNew: true,
  },
  {
    id: "13",
    name: "Fried Calamari",
    description: "Tender calamari rings, lightly fried with marinara sauce",
    price: "$17",
    image: friedCalamari,
    category: "Dinner",
    subcategory: "HOT APPETIZERS",
    allergens: ["Shellfish", "Gluten"],
    calories: 520,
  },

  // ENTRÉES
  {
    id: "14",
    name: "Lamb Chops",
    description: "Herb-crusted lamb chops with rosemary demi-glace",
    price: "$42",
    image: lambChops,
    category: "Dinner",
    subcategory: "ENTRÉES",
    allergens: ["Allium"],
    calories: 680,
    isChefRecommendation: true,
  },
  {
    id: "15",
    name: "Grilled Salmon",
    description: "Atlantic salmon with lemon butter sauce and seasonal vegetables",
    price: "$32",
    image: grilledSalmon,
    category: "Dinner",
    subcategory: "ENTRÉES",
    allergens: ["Dairy", "Allium"],
    calories: 520,
    isChefRecommendation: true,
  },
  {
    id: "16",
    name: "Chicken & Shrimp Pasta",
    description: "Sautéed chicken and shrimp in creamy Alfredo sauce over fettuccine",
    price: "$28",
    image: chickenShrimpPasta,
    category: "Dinner",
    subcategory: "ENTRÉES",
    allergens: ["Shellfish", "Dairy", "Gluten"],
    calories: 890,
    isPopular: true,
  },
  {
    id: "17",
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
    id: "18",
    name: "Ribeye Steak",
    description: "16oz prime ribeye with garlic butter and mashed potatoes",
    price: "$48",
    image: ribeyeSteak,
    category: "Dinner",
    subcategory: "ENTRÉES",
    allergens: ["Dairy", "Allium"],
    calories: 920,
    isChefRecommendation: true,
  },
  {
    id: "19",
    name: "Surf 'N' Turf",
    description: "8oz filet mignon and lobster tail with drawn butter",
    price: "$65",
    image: surfNTurf,
    category: "Dinner",
    subcategory: "ENTRÉES",
    allergens: ["Shellfish", "Dairy", "Allium"],
    calories: 1050,
    isSpecial: true,
  },
  {
    id: "20",
    name: "Jerk Chicken",
    description: "Caribbean jerk-spiced chicken with rice and peas",
    price: "$24",
    image: jerkChicken,
    category: "Dinner",
    subcategory: "ENTRÉES",
    allergens: ["Soy", "Allium"],
    calories: 680,
    isSpicy: true,
    isNew: true,
  },
  {
    id: "21",
    name: "Blackened Catfish",
    description: "Cajun-spiced catfish with dirty rice and coleslaw",
    price: "$26",
    image: blackenedCatfish,
    category: "Dinner",
    subcategory: "ENTRÉES",
    allergens: ["Dairy", "Allium"],
    calories: 580,
    isSpicy: true,
  },
  {
    id: "22",
    name: "BBQ Ribs",
    description: "Fall-off-the-bone baby back ribs with house BBQ sauce",
    price: "$32",
    image: bbqRibs,
    category: "Dinner",
    subcategory: "ENTRÉES",
    allergens: ["Soy", "Allium"],
    calories: 840,
  },
  {
    id: "23",
    name: "Vegetable Stir Fry",
    description: "Fresh seasonal vegetables in teriyaki sauce over jasmine rice",
    price: "$22",
    image: vegetableStirFry,
    category: "Dinner",
    subcategory: "ENTRÉES",
    allergens: ["Soy", "Gluten", "Allium"],
    calories: 420,
    isVegetarian: true,
    isNew: true,
  },

  // DESSERTS
  {
    id: "24",
    name: "Chocolate Lava Cake",
    description: "Warm chocolate cake with molten center, vanilla ice cream",
    price: "$12",
    image: chocolateLavaCake,
    category: "Dinner",
    subcategory: "DESSERTS",
    allergens: ["Dairy", "Gluten", "Eggs"],
    calories: 620,
    isPopular: true,
  },
  {
    id: "25",
    name: "Peach Cobbler",
    description: "Warm peach cobbler with cinnamon and vanilla ice cream",
    price: "$10",
    image: peachCobbler,
    category: "Dinner",
    subcategory: "DESSERTS",
    allergens: ["Dairy", "Gluten", "Eggs"],
    calories: 480,
  },
  {
    id: "26",
    name: "New York Cheesecake",
    description: "Classic creamy cheesecake with berry compote",
    price: "$11",
    image: nyCheesecake,
    category: "Dinner",
    subcategory: "DESSERTS",
    allergens: ["Dairy", "Gluten", "Eggs"],
    calories: 540,
  },
  {
    id: "27",
    name: "Banana Pudding",
    description: "Southern-style banana pudding with vanilla wafers",
    price: "$9",
    image: bananaPudding,
    category: "Dinner",
    subcategory: "DESSERTS",
    allergens: ["Dairy", "Gluten", "Eggs"],
    calories: 380,
  },

  // SANGRIA
  {
    id: "28",
    name: "Red Sangria",
    description: "Red wine with fresh fruit and brandy",
    price: "$12",
    image: redSangria,
    category: "Cocktails",
    subcategory: "SANGRIA",
    calories: 180,
  },
  {
    id: "29",
    name: "White Sangria",
    description: "White wine with peaches, citrus, and elderflower",
    price: "$12",
    image: whiteSangria,
    category: "Cocktails",
    subcategory: "SANGRIA",
    calories: 160,
  },
  {
    id: "30",
    name: "Tropical Sangria",
    description: "White wine with mango, pineapple, and coconut rum",
    price: "$14",
    image: tropicalSangria,
    category: "Cocktails",
    subcategory: "SANGRIA",
    calories: 200,
    isNew: true,
  },

  // SPECIALTY COCKTAILS
  {
    id: "31",
    name: "Top Notch",
    description: "Premium vodka, elderflower, champagne, fresh berries",
    price: "$16",
    image: topNotch,
    category: "Cocktails",
    subcategory: "SPECIALTY",
    calories: 220,
    isChefRecommendation: true,
  },
  {
    id: "32",
    name: "Panty Dropper",
    description: "Vodka, peach schnapps, cranberry, pineapple juice",
    price: "$14",
    image: pantyDropper,
    category: "Cocktails",
    subcategory: "SPECIALTY",
    calories: 240,
    isPopular: true,
  },
  {
    id: "33",
    name: "Sneaky Link",
    description: "Tequila, triple sec, lime, agave, jalapeño",
    price: "$15",
    image: sneakyLink,
    category: "Cocktails",
    subcategory: "SPECIALTY",
    calories: 190,
    isSpicy: true,
  },
  {
    id: "34",
    name: "Soak City",
    description: "Rum, coconut cream, pineapple, blue curaçao",
    price: "$14",
    image: soakCity,
    category: "Cocktails",
    subcategory: "SPECIALTY",
    calories: 280,
  },
  {
    id: "35",
    name: "Sweet Escape",
    description: "Gin, lavender, lemon, prosecco, honey",
    price: "$15",
    image: sweetEscape,
    category: "Cocktails",
    subcategory: "SPECIALTY",
    calories: 200,
    isNew: true,
  },
  {
    id: "36",
    name: "Victory Mule",
    description: "Vodka, ginger beer, lime, fresh mint",
    price: "$13",
    image: victoryMule,
    category: "Cocktails",
    subcategory: "SPECIALTY",
    calories: 180,
  },
  {
    id: "37",
    name: "Bourbon Smash",
    description: "Bourbon, mint, lemon, simple syrup",
    price: "$14",
    image: bourbonSmash,
    category: "Cocktails",
    subcategory: "SPECIALTY",
    calories: 210,
  },

  // MOCKTAILS
  {
    id: "38",
    name: "Virgin Mojito",
    description: "Fresh mint, lime, soda water, sugar",
    price: "$8",
    image: virginMojito,
    category: "Cocktails",
    subcategory: "MOCKTAILS",
    calories: 120,
  },
  {
    id: "39",
    name: "Strawberry Lemonade",
    description: "Fresh strawberries, lemon juice, sparkling water",
    price: "$7",
    image: strawberryLemonade,
    category: "Cocktails",
    subcategory: "MOCKTAILS",
    calories: 110,
  },
  {
    id: "40",
    name: "Tropical Punch",
    description: "Pineapple, mango, passion fruit, coconut water",
    price: "$8",
    image: tropicalPunch,
    category: "Cocktails",
    subcategory: "MOCKTAILS",
    calories: 140,
  },
];

export const categories = ["Dinner", "Cocktails"];

export const subcategories = {
  Dinner: ["SIDES", "SALADS", "HOT APPETIZERS", "ENTRÉES", "DESSERTS"],
  Cocktails: ["SANGRIA", "SPECIALTY", "MOCKTAILS"],
};
