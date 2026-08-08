export interface TicketDish {
  readonly dish: string;
  readonly cuisine: string;
  /** Three short prep notes, the way a real ticket is written. */
  readonly lines: readonly [string, string, string];
}

/** Tickets hanging on the rail at once. */
export const TICKETS_PER_SERVICE = 5;

/**
 * Every dish gets a shot at the rail, so it takes a large pool — a visitor
 * who comes back next week should find a different service running.
 */
export const TICKET_POOL: readonly TicketDish[] = [
  { dish: 'Butter Chicken', cuisine: 'Indian', lines: ['Marinate · 20m', 'Gravy · slow', 'Serves 4'] },
  { dish: 'Chole Bhature', cuisine: 'Indian', lines: ['Soak overnight', 'Fry to order', 'Serves 3'] },
  { dish: 'Rajma Chawal', cuisine: 'Indian', lines: ['Pressure · 25m', 'Rice · steamed', 'Serves 4'] },
  { dish: 'Palak Paneer', cuisine: 'Indian', lines: ['Blanch greens', 'Do not boil', 'Serves 3'] },
  { dish: 'Hyderabadi Biryani', cuisine: 'Indian', lines: ['Layer · dum', 'Rest · 10m', 'Serves 6'] },
  { dish: 'Masala Dosa', cuisine: 'Indian', lines: ['Batter · 8h', 'Tawa · hot', 'Serves 2'] },
  { dish: 'Rogan Josh', cuisine: 'Indian', lines: ['Brown lamb', 'Low · 90m', 'Serves 4'] },
  { dish: 'Pav Bhaji', cuisine: 'Indian', lines: ['Mash fine', 'Butter · lots', 'Serves 4'] },
  { dish: 'Dal Makhani', cuisine: 'Indian', lines: ['Overnight soak', 'Simmer · 3h', 'Serves 5'] },
  { dish: 'Baingan Bharta', cuisine: 'Indian', lines: ['Char whole', 'Peel warm', 'Serves 3'] },

  { dish: 'Cacio e Pepe', cuisine: 'Italian', lines: ['Pasta water', 'No cream', 'Serves 2'] },
  { dish: 'Carbonara', cuisine: 'Italian', lines: ['Off the heat', 'Egg · tempered', 'Serves 2'] },
  { dish: 'Margherita', cuisine: 'Italian', lines: ['Dough · 24h', 'Oven · max', 'Makes 2'] },
  { dish: 'Risotto Milanese', cuisine: 'Italian', lines: ['Stock · warm', 'Stir · 18m', 'Serves 3'] },
  { dish: 'Lasagne', cuisine: 'Italian', lines: ['Ragu · 3h', 'Rest · 20m', 'Serves 8'] },
  { dish: 'Puttanesca', cuisine: 'Italian', lines: ['No cheese', 'Salt · light', 'Serves 2'] },
  { dish: 'Osso Buco', cuisine: 'Italian', lines: ['Sear hard', 'Braise · 2h', 'Serves 4'] },
  { dish: 'Focaccia', cuisine: 'Italian', lines: ['Prove · 2h', 'Dimple · oil', 'Makes 1'] },
  { dish: 'Tiramisu', cuisine: 'Dessert', lines: ['Chill · 4h', 'No raw egg', 'Serves 6'] },
  { dish: 'Panna Cotta', cuisine: 'Dessert', lines: ['Bloom gelatin', 'Set · 6h', 'Serves 4'] },

  { dish: 'Dim Sum', cuisine: 'Chinese', lines: ['Steam · 8m', 'Fold ×12', 'Serves 3'] },
  { dish: 'Kung Pao Chicken', cuisine: 'Chinese', lines: ['Velvet first', 'Wok · high', 'Serves 3'] },
  { dish: 'Mapo Tofu', cuisine: 'Chinese', lines: ['Silken tofu', 'Numbing · med', 'Serves 3'] },
  { dish: 'Hakka Noodles', cuisine: 'Chinese', lines: ['Boil · 4m', 'Toss · fast', 'Serves 2'] },
  { dish: 'Sweet & Sour Pork', cuisine: 'Chinese', lines: ['Double fry', 'Glaze last', 'Serves 4'] },
  { dish: 'Wonton Soup', cuisine: 'Chinese', lines: ['Broth · clear', 'Fold ×20', 'Serves 4'] },
  { dish: 'Char Siu', cuisine: 'Chinese', lines: ['Marinate · 8h', 'Glaze ×3', 'Serves 4'] },
  { dish: 'Egg Fried Rice', cuisine: 'Chinese', lines: ['Day-old rice', 'Wok · smoking', 'Serves 2'] },

  { dish: 'Street Tacos', cuisine: 'Mexican', lines: ['Char salsa', 'Warm tortillas', 'Serves 4'] },
  { dish: 'Enchiladas Verdes', cuisine: 'Mexican', lines: ['Roast tomatillo', 'Bake · 20m', 'Serves 4'] },
  { dish: 'Chiles Rellenos', cuisine: 'Mexican', lines: ['Blister · peel', 'Batter light', 'Serves 3'] },
  { dish: 'Birria', cuisine: 'Mexican', lines: ['Chiles · toast', 'Braise · 3h', 'Serves 6'] },
  { dish: 'Quesadillas', cuisine: 'Mexican', lines: ['Comal · dry', 'Cheese · 2', 'Serves 2'] },
  { dish: 'Elote', cuisine: 'Mexican', lines: ['Grill · char', 'Lime · heavy', 'Serves 4'] },
  { dish: 'Guacamole', cuisine: 'Mexican', lines: ['Mash coarse', 'Salt last', 'Serves 4'] },

  { dish: 'Smash Burger', cuisine: 'American', lines: ['Press once', 'Cheese · melt', 'Makes 2'] },
  { dish: 'Buttermilk Pancakes', cuisine: 'American', lines: ['Rest batter', 'Griddle · med', 'Makes 8'] },
  { dish: 'Mac & Cheese', cuisine: 'American', lines: ['Roux first', 'Bake · 25m', 'Serves 5'] },
  { dish: 'BBQ Ribs', cuisine: 'American', lines: ['Rub · night', 'Low · 4h', 'Serves 4'] },
  { dish: 'Clam Chowder', cuisine: 'American', lines: ['Render bacon', 'No boil', 'Serves 4'] },
  { dish: 'Fried Chicken', cuisine: 'American', lines: ['Brine · 6h', 'Rest on rack', 'Serves 4'] },
  { dish: 'Cornbread', cuisine: 'American', lines: ['Skillet · hot', 'Bake · 22m', 'Serves 8'] },

  { dish: 'Tonkotsu Ramen', cuisine: 'Japanese', lines: ['Broth · 12h', 'Egg · 6m30', 'Serves 2'] },
  { dish: 'Salmon Nigiri', cuisine: 'Japanese', lines: ['Rice · body temp', 'Slice · against', 'Makes 10'] },
  { dish: 'Katsu Curry', cuisine: 'Japanese', lines: ['Panko · double', 'Roux · dark', 'Serves 3'] },
  { dish: 'Gyoza', cuisine: 'Japanese', lines: ['Fry then steam', 'Crisp base', 'Makes 16'] },
  { dish: 'Miso Soup', cuisine: 'Japanese', lines: ['Dashi first', 'Never boil', 'Serves 4'] },

  { dish: 'Basque Cheesecake', cuisine: 'Dessert', lines: ['Burn the top', 'Cool · 3h', 'Serves 8'] },
  { dish: 'Gulab Jamun', cuisine: 'Dessert', lines: ['Fry · low', 'Soak warm', 'Makes 12'] },
  { dish: 'Crème Brûlée', cuisine: 'Dessert', lines: ['Bain-marie', 'Torch to order', 'Serves 4'] },
];

/**
 * The service for a given day.
 *
 * Walking the pool with a stride coprime to its length means the five tickets
 * are always distinct and the combination changes shape daily, rather than
 * showing the same five neighbours in a block. The start advances one place a
 * day, so the whole pool comes round over fifty days.
 *
 * The day number is taken in local time, so the rail turns over at the
 * visitor's midnight rather than UTC's.
 */
export function ticketsForDay(date: Date): readonly TicketDish[] {
  const localMs = date.getTime() - date.getTimezoneOffset() * 60_000;
  const day = Math.floor(localMs / 86_400_000);

  const size = TICKET_POOL.length;
  const stride = 7;
  const start = ((day % size) + size) % size;

  return Array.from(
    { length: TICKETS_PER_SERVICE },
    (_, index) => TICKET_POOL[(start + index * stride) % size],
  );
}
