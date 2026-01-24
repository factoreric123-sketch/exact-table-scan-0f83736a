-- First, delete existing data for this restaurant to start fresh
DELETE FROM dishes WHERE restaurant_id = 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f';
DELETE FROM subcategories WHERE category_id IN (SELECT id FROM categories WHERE restaurant_id = 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f');
DELETE FROM categories WHERE restaurant_id = 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f';

-- Insert Categories
INSERT INTO categories (id, name, restaurant_id, order_index) VALUES
('11111111-1111-1111-1111-111111111101', 'Dinner', 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f', 0),
('11111111-1111-1111-1111-111111111102', 'Cocktails', 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f', 1);

-- Insert Subcategories for Dinner
INSERT INTO subcategories (id, name, category_id, order_index) VALUES
('22222222-2222-2222-2222-222222222201', 'SIDES', '11111111-1111-1111-1111-111111111101', 0),
('22222222-2222-2222-2222-222222222202', 'SALADS', '11111111-1111-1111-1111-111111111101', 1),
('22222222-2222-2222-2222-222222222203', 'Appetizer', '11111111-1111-1111-1111-111111111101', 2),
('22222222-2222-2222-2222-222222222204', 'ENTRÉES', '11111111-1111-1111-1111-111111111101', 3),
('22222222-2222-2222-2222-222222222205', 'DESSERTS', '11111111-1111-1111-1111-111111111101', 4);

-- Insert Subcategories for Cocktails
INSERT INTO subcategories (id, name, category_id, order_index) VALUES
('22222222-2222-2222-2222-222222222206', 'SANGRIA', '11111111-1111-1111-1111-111111111102', 0),
('22222222-2222-2222-2222-222222222207', 'SPECIALTY', '11111111-1111-1111-1111-111111111102', 1),
('22222222-2222-2222-2222-222222222208', 'MOCKTAILS', '11111111-1111-1111-1111-111111111102', 2);

-- Insert SIDES dishes
INSERT INTO dishes (id, name, description, price, subcategory_id, restaurant_id, order_index, allergens, calories, is_new, has_options) VALUES
('33333333-3333-3333-3333-333333333301', 'Lobster Mac N Cheese', 'Creamy mac and cheese with succulent lobster pieces', '18', '22222222-2222-2222-2222-222222222201', 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f', 0, ARRAY['Shellfish', 'Dairy', 'Gluten'], 650, true, false),
('33333333-3333-3333-3333-333333333302', 'Truffle Parmesan Fries', 'Hand-cut fries tossed in truffle oil and parmesan', '8', '22222222-2222-2222-2222-222222222201', 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f', 1, ARRAY['Dairy'], 520, false, true);

-- Insert dish options for Truffle Fries
INSERT INTO dish_options (id, dish_id, name, price, order_index) VALUES
('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333302', 'Small', '8.00', 0),
('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333302', 'Medium', '12.00', 1),
('44444444-4444-4444-4444-444444444403', '33333333-3333-3333-3333-333333333302', 'Large', '16.00', 2);

-- Insert SALADS dishes
INSERT INTO dishes (id, name, description, price, subcategory_id, restaurant_id, order_index, allergens, calories, is_vegetarian, is_popular, has_options) VALUES
('33333333-3333-3333-3333-333333333303', 'Caesar Salad', 'Crisp romaine, parmesan, croutons, classic Caesar dressing', '14', '22222222-2222-2222-2222-222222222202', 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f', 0, ARRAY['Dairy', 'Gluten', 'Eggs'], 320, true, true, true),
('33333333-3333-3333-3333-333333333304', 'Grilled Chicken Salad', 'Mixed greens, grilled chicken, cherry tomatoes, balsamic vinaigrette', '18', '22222222-2222-2222-2222-222222222202', 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f', 1, ARRAY['Dairy'], 420, false, false, false);

-- Insert modifiers for Caesar Salad
INSERT INTO dish_modifiers (id, dish_id, name, price, order_index) VALUES
('55555555-5555-5555-5555-555555555501', '33333333-3333-3333-3333-333333333303', 'Add Grilled Chicken', '6.00', 0),
('55555555-5555-5555-5555-555555555502', '33333333-3333-3333-3333-333333333303', 'Add Grilled Shrimp', '8.00', 1),
('55555555-5555-5555-5555-555555555503', '33333333-3333-3333-3333-333333333303', 'Add Salmon', '10.00', 2);

-- Insert Appetizer dishes
INSERT INTO dishes (id, name, description, price, subcategory_id, restaurant_id, order_index, allergens, calories, is_spicy, is_chef_recommendation, is_special, has_options) VALUES
('33333333-3333-3333-3333-333333333305', 'Mambo Wings', 'Crispy wings with our signature Mambo sauce', '12', '22222222-2222-2222-2222-222222222203', 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f', 0, ARRAY['Gluten', 'Soy'], 580, true, true, false, true),
('33333333-3333-3333-3333-333333333306', 'Crab Fries', 'Golden fries topped with lump crab meat and cheese sauce', '20', '22222222-2222-2222-2222-222222222203', 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f', 1, ARRAY['Shellfish', 'Dairy'], 720, false, false, true, false),
('33333333-3333-3333-3333-333333333307', 'Jerk Chicken Egg Rolls', 'Caribbean-spiced chicken in crispy egg roll wrappers', '14', '22222222-2222-2222-2222-222222222203', 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f', 2, ARRAY['Gluten', 'Soy', 'Eggs'], 420, true, false, false, false);

-- Insert options for Mambo Wings
INSERT INTO dish_options (id, dish_id, name, price, order_index) VALUES
('44444444-4444-4444-4444-444444444404', '33333333-3333-3333-3333-333333333305', '6 Wings', '12.00', 0),
('44444444-4444-4444-4444-444444444405', '33333333-3333-3333-3333-333333333305', '12 Wings', '20.00', 1),
('44444444-4444-4444-4444-444444444406', '33333333-3333-3333-3333-333333333305', '24 Wings', '36.00', 2);

-- Insert ENTRÉES dishes
INSERT INTO dishes (id, name, description, price, subcategory_id, restaurant_id, order_index, allergens, calories, is_chef_recommendation, is_popular, is_new, has_options) VALUES
('33333333-3333-3333-3333-333333333308', 'Lamb Chops', 'Herb-crusted lamb chops with rosemary demi-glace', '42', '22222222-2222-2222-2222-222222222204', 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f', 0, ARRAY['Allium'], 680, true, false, false, false),
('33333333-3333-3333-3333-333333333309', 'Grilled Salmon', 'Atlantic salmon with lemon butter sauce and seasonal vegetables', '32', '22222222-2222-2222-2222-222222222204', 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f', 1, ARRAY['Dairy', 'Allium'], 520, false, false, false, false),
('33333333-3333-3333-3333-333333333310', 'Ribeye Steak', 'Prime ribeye with garlic butter and mashed potatoes', '38', '22222222-2222-2222-2222-222222222204', 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f', 2, ARRAY['Dairy', 'Allium'], 920, false, true, false, true),
('33333333-3333-3333-3333-333333333311', 'Shrimp & Grits', 'Jumbo shrimp over creamy stone-ground grits with Cajun cream sauce', '26', '22222222-2222-2222-2222-222222222204', 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f', 3, ARRAY['Shellfish', 'Dairy', 'Allium'], 740, false, false, true, false),
('33333333-3333-3333-3333-333333333312', 'BBQ Ribs', 'Fall-off-the-bone baby back ribs with house BBQ sauce', '24', '22222222-2222-2222-2222-222222222204', 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f', 4, ARRAY['Soy', 'Allium'], 840, false, false, false, true);

-- Insert options for Ribeye Steak
INSERT INTO dish_options (id, dish_id, name, price, order_index) VALUES
('44444444-4444-4444-4444-444444444407', '33333333-3333-3333-3333-333333333310', '12oz', '38.00', 0),
('44444444-4444-4444-4444-444444444408', '33333333-3333-3333-3333-333333333310', '16oz', '48.00', 1),
('44444444-4444-4444-4444-444444444409', '33333333-3333-3333-3333-333333333310', '24oz Tomahawk', '72.00', 2);

-- Insert options for BBQ Ribs
INSERT INTO dish_options (id, dish_id, name, price, order_index) VALUES
('44444444-4444-4444-4444-444444444410', '33333333-3333-3333-3333-333333333312', 'Half Rack', '24.00', 0),
('44444444-4444-4444-4444-444444444411', '33333333-3333-3333-3333-333333333312', 'Full Rack', '38.00', 1);

-- Insert DESSERTS dishes
INSERT INTO dishes (id, name, description, price, subcategory_id, restaurant_id, order_index, allergens, calories, is_popular) VALUES
('33333333-3333-3333-3333-333333333313', 'Chocolate Lava Cake', 'Warm chocolate cake with molten center, vanilla ice cream', '12', '22222222-2222-2222-2222-222222222205', 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f', 0, ARRAY['Dairy', 'Gluten', 'Eggs'], 620, true),
('33333333-3333-3333-3333-333333333314', 'New York Cheesecake', 'Classic creamy cheesecake with berry compote', '11', '22222222-2222-2222-2222-222222222205', 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f', 1, ARRAY['Dairy', 'Gluten', 'Eggs'], 540, false);

-- Insert SANGRIA dishes
INSERT INTO dishes (id, name, description, price, subcategory_id, restaurant_id, order_index, calories, is_new) VALUES
('33333333-3333-3333-3333-333333333315', 'Red Sangria', 'Red wine with fresh fruit and brandy', '10', '22222222-2222-2222-2222-222222222206', 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f', 0, 180, false),
('33333333-3333-3333-3333-333333333316', 'Tropical Sangria', 'White wine with mango, pineapple, and coconut rum', '12', '22222222-2222-2222-2222-222222222206', 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f', 1, 200, true);

-- Insert SPECIALTY COCKTAILS dishes
INSERT INTO dishes (id, name, description, price, subcategory_id, restaurant_id, order_index, calories, is_chef_recommendation, is_special, is_spicy) VALUES
('33333333-3333-3333-3333-333333333317', 'Top Notch', 'Premium vodka, elderflower, champagne, fresh berries', '16', '22222222-2222-2222-2222-222222222207', 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f', 0, 220, true, false, false),
('33333333-3333-3333-3333-333333333318', 'Panty Dropper', 'Vodka, peach schnapps, cranberry, pineapple juice', '14', '22222222-2222-2222-2222-222222222207', 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f', 1, 240, false, false, false),
('33333333-3333-3333-3333-333333333319', 'Sneaky Link', 'Tequila, triple sec, lime, agave, jalapeño', '15', '22222222-2222-2222-2222-222222222207', 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f', 2, 190, false, true, true);

-- Insert MOCKTAILS dishes
INSERT INTO dishes (id, name, description, price, subcategory_id, restaurant_id, order_index, calories, is_vegan, is_popular) VALUES
('33333333-3333-3333-3333-333333333320', 'Virgin Mojito', 'Fresh mint, lime, soda water, sugar', '8', '22222222-2222-2222-2222-222222222208', 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f', 0, 120, true, false),
('33333333-3333-3333-3333-333333333321', 'Strawberry Lemonade', 'Fresh strawberries, lemon juice, sparkling water', '7', '22222222-2222-2222-2222-222222222208', 'd0ab7fd8-f27f-41ee-a1dc-a84c1570190f', 1, 110, true, true);