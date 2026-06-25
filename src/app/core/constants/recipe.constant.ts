import { DietaryPreference } from '../enums/recipe.enum';

export interface PresetRecipe {
  readonly cuisine: string;
  readonly name: string;
  readonly description: string;
  readonly image: string;
  readonly diet: DietaryPreference;
}

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
  { cuisine: 'Indian', name: 'Butter Chicken', description: 'Rich and creamy chicken curry', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.NON_VEGETARIAN },
  { cuisine: 'Indian', name: 'Paneer Tikka', description: 'Spiced and grilled paneer cubes', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },
  { cuisine: 'Chinese', name: 'Spring Rolls', description: 'Crispy rolls filled with vegetables', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.VEGETARIAN },
  { cuisine: 'Italian', name: 'Lasagna', description: 'Layered pasta with meat and cheese', image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=600&q=80', diet: DietaryPreference.NON_VEGETARIAN }
];
