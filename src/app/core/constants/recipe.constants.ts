import { DietaryPreference } from '../enums/recipe.enum';
import { PresetRecipe } from '../interfaces/recipe.interface';

export const DISCOVERY_CATEGORIES: readonly string[] = [
  'Indian', 'Chinese', 'Italian', 'Mexican', 'American', 'Desserts'
];

export const ROTATING_PLACEHOLDERS: readonly string[] = [
  'e.g., Butter Chicken', 'जैसे, छोले भटूरे', 'ਜਿਵੇਂ, ਸ਼ਾਹੀ ਪਨੀਰ',
  'e.g., Pasta Carbonara', 'जैसे, दाल मखनी', 'ਜਿਵੇਂ, ਮੱਕੀ ਦੀ ਰੋਟੀ ਤੇ ਸਰੋਂ ਦਾ ਸਾਗ',
  'e.g., Chocolate Cake', 'Hinglish: Paneer Tikka Masala', 'e.g., Aloo Gobi',
  'जैसे, मटर पनीर', 'ਜਿਵੇਂ, ਦਾਲ ਤੜਕਾ'
];

export const PRESET_RECIPES: readonly PresetRecipe[] = [
  // --- INDIAN (7 Recipes) ---
  { cuisine: 'Indian', name: 'Butter Chicken', description: 'Tender chicken slow-cooked in a velvety, rich tomato-cream sauce with aromatic spices', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.NON_VEGETARIAN },
  { cuisine: 'Indian', name: 'Paneer Tikka', description: 'Smoky marinated cottage cheese chunks grilled with peppers and charred to perfection', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },
  { cuisine: 'Indian', name: 'Chole Bhature', description: 'Spicy, tangy chickpea curry served alongside hot, fluffy, puffed fried sourdough breads', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },
  { cuisine: 'Indian', name: 'Chicken Biryani', description: 'Aromatic basmati rice layered with juicy spiced chicken, saffron, and fresh mint', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.NON_VEGETARIAN },
  { cuisine: 'Indian', name: 'Masala Dosa', description: 'Crispy fermented rice and lentil crepe rolled with a savory, spiced potato filling', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },
  { cuisine: 'Indian', name: 'Samosa Chaat', description: 'Crushed hot potato samosas topped with spicy chickpeas, sweet yogurt, and tangy chutneys', image: 'https://images.unsplash.com/photo-1645177625147-e486c07df300?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },
  { cuisine: 'Indian', name: 'Dal Makhani', description: 'Creamy black lentils and kidney beans slow-simmered overnight with butter and cream', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },

  // --- CHINESE (5 Recipes) ---
  { cuisine: 'Chinese', name: 'Spring Rolls', description: 'Golden, crispy wrapper rolls stuffed with fresh wok-tossed vegetables and glass noodles', image: 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },
  { cuisine: 'Chinese', name: 'Kung Pao Chicken', description: 'Spicy stir-fried chicken with crunchy peanuts, bell peppers, and dried red chilies', image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.NON_VEGETARIAN },
  { cuisine: 'Chinese', name: 'Mapo Tofu', description: 'Silken tofu cubes set in a fiery, numbing Szechuan chili-garlic bean sauce', image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },
  { cuisine: 'Chinese', name: 'Veg Dim Sum', description: 'Delicate translucent steamed dumplings packed with finely chopped vegetables and ginger', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },
  { cuisine: 'Chinese', name: 'Wonton Noodles', description: 'Handmade thin egg noodles served in clear broth with savory chicken and shrimp wontons', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.NON_VEGETARIAN },

  // --- ITALIAN (6 Recipes) ---
  { cuisine: 'Italian', name: 'Lasagna Bolognese', description: 'Layers of fresh pasta sheet, slow-cooked meat ragu, creamy béchamel, and rich cheese', image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.NON_VEGETARIAN },
  { cuisine: 'Italian', name: 'Margherita Pizza', description: 'Classic Neapolitan thin-crust pizza topped with San Marzano tomatoes, fresh mozzarella, and basil', image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },
  { cuisine: 'Italian', name: 'Pasta Carbonara', description: 'Spaghetti tossed with crispy guanciale, creamy whisked egg yolks, pecorino, and black pepper', image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.NON_VEGETARIAN },
  { cuisine: 'Italian', name: 'Risotto Mushroom', description: 'Creamy Arborio rice slow-cooked with wild mushrooms, dry white wine, garlic, and parmesan', image: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },
  { cuisine: 'Italian', name: 'Bruschetta Pomodoro', description: 'Toasted rustic bread slices rubbed with garlic, topped with vine-ripened tomatoes and basil', image: 'https://images.unsplash.com/photo-1572656631137-7935297eff55?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },
  { cuisine: 'Italian', name: 'Potato Gnocchi', description: 'Soft, pillowy potato dumplings tossed in a rich, fragrant butter and fresh sage sauce', image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },

  // --- MEXICAN (6 Recipes) ---
  { cuisine: 'Mexican', name: 'Tacos Al Pastor', description: 'Smoky spit-roasted pork marinated in red chilies, served on corn tortillas with pineapple', image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.NON_VEGETARIAN },
  { cuisine: 'Mexican', name: 'Guacamole & Chips', description: 'Creamy mashed Hass avocados with lime, cilantro, and onion, with crispy corn chips', image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },
  { cuisine: 'Mexican', name: 'Cheese Quesadilla', description: 'Griddled large flour tortilla folded with warm melted jack cheese, poblanos, and sweet corn', image: 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },
  { cuisine: 'Mexican', name: 'Chiles Rellenos', description: 'Roasted poblano peppers stuffed with melting cheese, fried in an airy egg-white batter coating', image: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },
  { cuisine: 'Mexican', name: 'Churros Dip', description: 'Golden pastry dough rods dusted with cinnamon sugar, served with thick chocolate syrup', image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },

  // --- AMERICAN (5 Recipes) ---
  { cuisine: 'American', name: 'Beef Burger', description: 'Flame-grilled prime beef patty stacked with cheese, crisp lettuce, tomato, and burger sauce', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.NON_VEGETARIAN },
  { cuisine: 'American', name: 'Baked Mac & Cheese', description: 'Creamy elbow pasta baked in an indulgent multi-cheese sauce with a toasted crumb topping', image: 'https://images.unsplash.com/photo-1624462966581-bc6d768cbce5?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },
  { cuisine: 'American', name: 'Buffalo Wings', description: 'Crispy deep-fried chicken wings tossed in a spicy, butter-rich cayenne pepper glaze', image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.NON_VEGETARIAN },
  { cuisine: 'American', name: 'Smoked BBQ Ribs', description: 'Slow-smoked baby back ribs brushed with a sweet, sticky hickory molasses barbecue sauce', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.NON_VEGETARIAN },
  { cuisine: 'American', name: 'Classic Pancakes', description: 'Thick buttermilk pancakes stacked high, topped with fresh mixed berries and maple syrup', image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },

  // --- DESSERTS (7 Recipes) ---
  { cuisine: 'Desserts', name: 'Lava Cake', description: 'Rich chocolate cake baked with a decadent, liquid molten dark chocolate core center', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },
  { cuisine: 'Desserts', name: 'NY Cheesecake', description: 'Dense, rich vanilla cream cheese baked on a graham cracker crust with sweet strawberry glaze', image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },
  { cuisine: 'Desserts', name: 'Creme Brulee', description: 'Velvety vanilla custard base topped with a layer of hard, glass-like caramelized sugar crust', image: 'https://images.unsplash.com/photo-1516685018646-549198525c1b?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },
  { cuisine: 'Desserts', name: 'Brownie Sundae', description: 'Fudgy warm double-chocolate brownie loaded with vanilla ice cream and hot chocolate fudge', image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },
  { cuisine: 'Desserts', name: 'Macarons Box', description: 'Dainty French almond meringue sandwich cookies filled with smooth white chocolate ganache', image: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },
  { cuisine: 'Desserts', name: 'Apple Crumble', description: 'Warm spiced brown sugar apples baked under a golden-crisp rolled oat and flour topping', image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },
  { cuisine: 'Desserts', name: 'Berry Panna Cotta', description: 'Silky, delicate sweet cream gelatin dessert drizzled with a sweet wild raspberry reduction', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN }
];

