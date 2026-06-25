# Project Specification & Prompt: Build Kivora AI (Angular v20+)

You are tasked with building a modern, highly interactive, AI-powered multilingual recipe application called **Kivora AI** from scratch. 

Below are the comprehensive project specifications, design aesthetics, user flows, architecture, and coding standards. Build the entire application as a brand-new project following these details.

---

## 🧭 Functional Features & User Flows

### 1. Landing Page & Recipe Discovery
*   **Hero Search Banner:** A full-width background section displaying an interactive query box. The search field's placeholder text automatically cycles through twelve distinct cooking suggestions (across English, Hindi, Punjabi, and Hinglish) every three seconds to inspire inputs. The cycling pauses when the user focuses on the field.
*   **Cuisine Discovery Pills:** A horizontal scrolling list of category buttons ('Indian', 'Chinese', 'Italian', 'Mexican', 'American', 'Desserts'). Clicking a category filters a grid of pre-populated recipe cards below.
*   **Customization Modal Trigger:** When a user executes a search query or clicks a preset recipe card, the system opens a parameters form modal.
*   **Persistent Feedback Trigger:** A floating button in the bottom-right corner of the screen provides instant access to the feedback modal.

### 2. Recipe Parameter Customization Modal
*   An overlay form containing options to customize the recipe prior to AI generation:
    *   **Recipe Name & Cuisine:** Populated based on the search query or clicked card.
    *   **Servings Counter:** Features increment and decrement buttons (minimum value of 1 serving).
    *   **Dietary Preferences:** Grid selector for Vegetarian, Non-Vegetarian, or Vegan (modeled as options with icons).
    *   **Optional Parameter Fields:** Target health goals (e.g., "high protein", "low carb"), and listed ingredients to avoid.
    *   **Special Instructions:** Text field to input specific cooking requirements (e.g., "make it mild", "suitable for dinner").
*   Submitting the form closes the modal and triggers the loading overlay.

### 3. Generation Loader & Validation Error Intercepts
*   **Scroll-Locked Loader:** A full-screen, translucent overlay that disables background scrolling. It features a cooking animation and rotates status updates every 3 seconds to manage wait times.
*   **API Error Handlers:** The generation pipeline communicates with backend endpoints. The interface must intercept and display visual error feedback for two validation categories:
    1.  **Nonsensical Input Exception:** If the request contains gibberish or non-food keywords, notify the user to enter a valid culinary query.
    2.  **Dietary Mismatch Exception:** If the recipe name conflicts with the selected diet (e.g., chicken dish selected with a vegetarian diet, or cheese dish with a vegan diet), notify the user to adjust parameters.
*   On successful validation, the system caches the generated recipe and redirects the router to the ingredients checklist view.

### 4. Ingredients Checklist
*   **Details Header:** Displays active preparation time (formatted into minutes), total ingredients count, and steps count.
*   **Checklist Grid:** A grid of cards showing each ingredient's name (in the active language), quantity, and thumbnail.
*   **Thumbnail Image Fallbacks:** Ingredient images are generated dynamically. If a thumbnail image fails to load, intercept the error and render a fallback container displaying the first letter of the ingredient name.
*   **Prep Guides:** Visual blocks containing step-by-step advice categorized under "Before You Start" and "Pro Tips".
*   **Recipe Stats Dashboard:** Summarizes ingredient details to display counts for Spices & Seasonings, Fresh Ingredients, Cooking Phases, and Timed Steps.
*   **Recipe Customization Portal:** A "Customize" action opens a text modal where the user can submit modification requests (e.g., *"replace cream with coconut milk"*). This triggers an API update call, regenerates the recipe, and reloads the checklist.
*   "Start Cooking" navigates to the interactive cooking steps layout.

### 5. Interactive Cooking Mode
*   **Overall Progress Tracker:** A top-level progress bar representing the percentage of completed steps.
*   **Step Cards:** Displays the active step number and localized instruction.
*   **Step Timers:** If the active step has cooking durations, display a circular countdown timer with Start, Pause, Resume, and Reset controls. If the step is untimed (passive wait), display a message advising the user to proceed when ready.
*   **Step-Specific Ingredients:** Displays card previews for only the ingredients actively used in the current step.
*   **Responsive Pagination Dots:**
    *   Renders step progress pagination indicators that collapse on small screen widths.
    *   Uses ellipses (`...`) to manage long lists.
    *   Color dots green for completed steps, orange for the active step, and gray for pending steps.
*   **Mid-Cook Customization:** Allows calling the customization portal mid-cook. Modifying the recipe resets progress to step 0 and clears the completed steps history.
*   **Completion View:** Once the final step is completed, display a success screen. Features actions to review the ingredients checklist, start cooking again (resets step indices and completion sets), or return home.

### 6. Cooking History & Statistics
*   **Recent Recipes List:** Displays a history of generated recipes. Features a search box to filter recipes by title or ingredient name (matching both English and localized translations).
*   **Cooking Statistics Panel:** Renders stats tracking total unique recipes, total cumulative minutes cooked, and count of distinct cuisines prepared.
*   **History Management:** Provides options to delete individual recipe cards or clear the entire cooking history.

---

## 🎨 Visual System & Design Aesthetics

*   **Color Palette:** Warm, light cream/beige aesthetics with cool slate-blue backdrops.
    - Base Page Background: `#a2abb8` (a soft, clean cool gray-blue).
    - Primary Cards & Modals: `#edece8` (soft warm cream / off-white) or linear gradients from `#fbfbfa` to `#f4eedb` (soft vanilla / warm sand).
    - Input Elements: `#f1f3f6` (very light grey-beige) with active border ring highlights.
    - Brand Accents & Primary Action Buttons: Warm gold/yellow `#fcd34d` to `#fbbf24` with dark slate-900 text.
    - Text styling: Slate-900 (primary body text), slate-500/600 (subtexts).
*   **Typography:** Import clean sans-serif typography (e.g., 'Inter' from Google Fonts).
*   **Glassmorphism:** Use translucent white/cream overlays with backdrop blur filters, soft drop shadows, and fine borders (e.g., `rgba(255, 255, 255, 0.4)`) for headers, footer panels, modals, and cards.
*   **Transitions & Animations:**
    *   Spatial 3D depth animations (e.g., `transform: translateY(-8px)`) on recipe cards.
    *   Subtle float animations for active cards.
    *   Pulse timers.
    *   Shimmer loading overlays on image templates.

---

## 📐 Architecture & Coding Standards

Implement the application using **Angular v20+** and **TypeScript** adhering to the following strict best practices:

### 1. TypeScript Rules
*   **Strict Checks:** Enable strict compilation (`strict: true`, `noImplicitAny: true`, `strictNullChecks: true`).
*   **Type Inference:** Prefer type inference when types are obvious; otherwise, explicitly declare types.
*   **No 'any':** Avoid the `any` type. Use `unknown` when a type is uncertain. Declare interfaces for all data objects.
*   **Access Specifiers & Immutability:** Use explicit access specifiers (`public`, `private`, `protected`) and mark class properties as `readonly` where appropriate.

### 2. Angular Component Rules
*   **Standalone Components:** Use standalone components (do NOT set `standalone: true` in component decorators since it is the default in Angular v20+).
*   **Signals State Management:** Use signals for all local component state. Do NOT use RxJS observables or state mutations. Use `computed()` for derived values. Update signals using `update` or `set`.
*   **Inputs & Outputs:** Use modern signal inputs `input()` and outputs `output()` instead of legacy `@Input()` and `@Output()` decorators.
*   **Change Detection:** Enforce `changeDetection: ChangeDetectionStrategy.OnPush` on every `@Component`.
*   **Host Bindings:** Host bindings must be declared inside the component decorator `host` object. Do NOT use `@HostBinding` or `@HostListener` decorators.
*   **Native Control Flow:** Use native control flows (`@if`, `@for`, `@switch`) in templates. Do not import or use legacy structural directives like `*ngIf` or `*ngFor`.
*   **Styles and Classes:** Do NOT use `ngClass` or `ngStyle`. Instead, use standard class bindings (e.g. `[class.active]="isActive()"`) and style bindings (e.g. `[style.width.%]="progress()"`).
*   **Relative Paths:** Refer to templates and styles using paths relative to the component `.ts` file.
*   **Static Asset Optimization:** Use `NgOptimizedImage` for all static local images.
*   **Accessibility (WCAG AA):** Ensure components are keyboard-navigable and pass Axe accessibility checks. Manage focus dynamically when opening and closing modals.

### 3. Service Design
*   **Dependency Injection:** Use the functional `inject()` method for all service dependency resolutions. Do NOT use constructor parameters for injection.
*   **Single Responsibility:** Design services around a single responsibility (e.g., separating state storage from HTTP services).
*   **No RxJS:** Convert async HTTP responses directly to Promises or Signals using native async/await patterns to eliminate RxJS subscriptions.

---

## 📁 Project Directory Structure

Configure the workspace directories as follows:

```
src/
├── app/
│   ├── components/                # Reusable visual components and modals
│   │   ├── all-steps-modal/
│   │   ├── bug-report-modal/
│   │   ├── footer/
│   │   ├── header/
│   │   ├── language-selector/
│   │   ├── loader/
│   │   ├── recipe-card/
│   │   ├── recipe-change-modal/
│   │   └── recipe-modal/
│   ├── core/                      # Core configuration and contracts
│   │   ├── constants/             # Central read-only constants files
│   │   ├── enums/                 # Application type definitions (Languages, Diets)
│   │   ├── models/                # Interfaces representing data schemas
│   │   └── services/              # Common API wrappers, storage & state controllers
│   ├── pages/                     # Routed view page containers
│   │   ├── home/
│   │   ├── ingredients/
│   │   ├── recent/
│   │   └── steps/
│   ├── app.component.ts           # Central root component wrapper
│   ├── app.config.ts              # Routing and state providers setup
│   └── app.routes.ts              # Route declarations with lazy loading
├── assets/                        # Local design files
├── index.html                     # Base HTML document
└── main.ts                        # Application mount entry point
```

---

## 📦 Data Contracts & Typing

Create these core files in `src/app/core/` to ensure strict typing across the codebase:

### 1. Enums (`src/app/core/enums/recipe.enum.ts`)
```typescript
export enum LanguageCode {
  ENGLISH = 'en',
  HINDI = 'hi',
  PUNJABI = 'pa'
}

export enum DietaryPreference {
  VEGETARIAN = 'veg',
  NON_VEGETARIAN = 'nonveg',
  VEGAN = 'vegan'
}

export enum ApiErrorReason {
  NONSENSICAL_INPUT = 'NONSENSICAL_INPUT',
  DIET_MISMATCH = 'DIET_MISMATCH',
  DIET_MISMATCH_MODIFICATION = 'DIET_MISMATCH_MODIFICATION'
}
```

### 2. Models (`src/app/core/models/recipe.model.ts`)
```typescript
import { LanguageCode, DietaryPreference } from '../enums/recipe.enum';

export interface LocalizedText {
  readonly [LanguageCode.ENGLISH]: string;
  readonly [LanguageCode.HINDI]: string;
  readonly [LanguageCode.PUNJABI]: string;
}

export interface Ingredient {
  readonly name: LocalizedText;
  readonly quantity: string;
  readonly image: string | null;
}

export interface RecipeStep {
  readonly stepNumber: number;
  readonly instruction: LocalizedText;
  readonly timeRequired: string | null; // Seconds as numeric string, or null
  readonly ingredientsUsed: string | null; // Comma-separated English names
}

export interface Recipe {
  readonly id: number; // Timestamp based ID
  readonly uniqueId: string; // URL safe generated identifier
  readonly recipeName: LocalizedText;
  readonly ingredients: readonly Ingredient[];
  readonly steps: readonly RecipeStep[];
  readonly totalTime: string; // Total active seconds as numeric string
  readonly createdAt: string; // ISO Date String
  readonly lastAccessedAt: string; // ISO Date String
  readonly diet?: DietaryPreference;
  readonly cuisine?: string;
  readonly description?: string;
  readonly servings?: number;
}

export interface RecipeGenerationRequest {
  readonly recipeName: string;
  readonly servingsCount: number;
  readonly diet: DietaryPreference;
  readonly cuisine: string;
  readonly healthGoals: string;
  readonly restrictions: string;
  readonly description: string;
}

export interface RecipeModificationRequest {
  readonly originalRecipe: Recipe;
  readonly modificationText: string;
}

export interface FeedbackRequest {
  readonly email: string;
  readonly message: string;
}

export interface ApiErrorResponse {
  readonly message: string;
  readonly reason: string;
}
```

### 3. Constants (`src/app/core/constants/recipe.constant.ts`)
```typescript
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
  { cuisine: 'Indian', name: 'Butter Chicken', description: 'Rich and creamy chicken curry', image: 'assets/butter-chicken.jpg', diet: DietaryPreference.NON_VEGETARIAN },
  { cuisine: 'Indian', name: 'Paneer Tikka', description: 'Spiced and grilled paneer cubes', image: 'assets/paneer-tikka.jpg', diet: DietaryPreference.VEGETARIAN },
  { cuisine: 'Chinese', name: 'Spring Rolls', description: 'Crispy rolls filled with vegetables', image: 'assets/spring-rolls.jpg', diet: DietaryPreference.VEGETARIAN },
  { cuisine: 'Italian', name: 'Lasagna', description: 'Layered pasta with meat and cheese', image: 'assets/lasagna.jpg', diet: DietaryPreference.NON_VEGETARIAN }
];
```

---

## 🛠️ Global Services Core

### 1. State Controller Service (`src/app/core/services/recipe-state.service.ts`)
This service manages active recipe details, selection histories, and active languages using Angular Signals.

*   **Signals Setup:**
    ```typescript
    private readonly currentRecipeSignal = signal<Recipe | null>(null);
    private readonly recentRecipesSignal = signal<readonly Recipe[]>([]);
    private readonly currentLanguageSignal = signal<LanguageCode>(LanguageCode.ENGLISH);

    public readonly currentRecipe = this.currentRecipeSignal.asReadonly();
    public readonly recentRecipes = this.recentRecipesSignal.asReadonly();
    public readonly currentLanguage = this.currentLanguageSignal.asReadonly();
    ```
*   **Methods to Implement:**
    *   `restoreState()`: Loads cached properties from `localStorage` (`currentRecipe`, `recentRecipes`, `currentLanguage`) and populates signals.
    *   `setRecipe(recipe: Recipe)`:
        *   Updates the `currentRecipe` state and caches it.
        *   Generates a unique string ID: `${EnglishName}-${diet}-${cuisine}` formatted to lowercase with spaces replaced by hyphens.
        *   Checks the recent recipe list: if the ID exists, updates the entry; otherwise, appends the new recipe.
        *   Caps the history at 20 recipes and saves it to local storage.
    *   `clearRecipe()`: Resets the active recipe state and clears local cache.
    *   `removeRecentRecipe(id: number)`: Removes a recipe from the history array and updates storage.
    *   `clearAllRecent()`: Resets the recent recipe list to `[]` and clears storage.
    *   `setLanguage(lang: LanguageCode)`: Updates the current language selection and caches it.
    *   `selectLocalizedText(text: LocalizedText | string | null | undefined): string`:
        *   If the text is a string, returns it.
        *   If it is a `LocalizedText` object, returns the key matching `currentLanguage()`, falling back to English.

---

### 2. HTTP Interaction Service (`src/app/core/services/recipe-api.service.ts`)
Handles API communication with the backend endpoints using Promises instead of RxJS.

*   **API Configuration:** Load the API base URL dynamically via environment files.
*   **Endpoints:**
    *   `generateRecipe(payload: RecipeGenerationRequest): Promise<Recipe>`
        *   Endpoint: `/api/recipes/generate`
        *   Method: `POST`
    *   `modifyRecipe(payload: RecipeModificationRequest): Promise<Recipe>`
        *   Endpoint: `/api/recipes/modify`
        *   Method: `POST`
    *   `submitBugReport(payload: FeedbackRequest): Promise<void>`
        *   Endpoint: `/api/feedback/submit`
        *   Method: `POST`
*   **Response Validation:**
    *   If the backend API returns a validation error (e.g. `DIET_MISMATCH`), parse the error code and throw a structured error to the caller component.

---

## 🛣️ Routing Configurations

Configure lazy loading for routes inside `src/app/app.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'ingredients',
    loadComponent: () => import('./pages/ingredients/ingredients.component').then(m => m.IngredientsComponent)
  },
  {
    path: 'steps',
    loadComponent: () => import('./pages/steps/steps.component').then(m => m.StepsComponent)
  },
  {
    path: 'recent',
    loadComponent: () => import('./pages/recent/recent.component').then(m => m.RecentComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
```
