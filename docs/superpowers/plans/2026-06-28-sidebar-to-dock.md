# Sidebar → Bottom Dock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the left vertical sidebar with a fixed bottom-center horizontal dock that works on all screen sizes.

**Architecture:** Delete the `sidebar/` component folder and replace it with a new `dock/` component. The dock is a fixed-position `<nav>` pill at `bottom-4 left-1/2 -translate-x-1/2` with icons + labels for each route. The app shell (`app.ts` + `app.html`) is simplified — mobile drawer and top header are removed, all navigation lives in the dock.

**Tech Stack:** Angular v21, TypeScript strict mode, TailwindCSS v4, signal-based state, `ChangeDetectionStrategy.OnPush`.

## Global Constraints

- No `standalone: true` in `@Component` decorators (Angular v20+ default — adding it causes a warning)
- Signals only for local state — `signal()`, `computed()`, `input()`, `output()`; never `.mutate()`, use `.update()` or `.set()`
- `ChangeDetectionStrategy.OnPush` on every `@Component`
- No `@Input()`/`@Output()` — use `input()` / `output()` signal equivalents
- No `ngClass`/`ngStyle` — use `[class.foo]="expr"` and `[style.prop]="expr"`
- `NgOptimizedImage` for all local/static images (via `ngSrc`)
- Native control flow only: `@if`, `@for`, `@switch`
- `inject()` for DI — never constructor parameters
- TypeScript strict mode: no `any`, explicit access modifiers, `readonly` on never-mutated properties

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/app/components/dock/dock.ts` | `DockComponent` — nav logic, auth, new-recipe |
| Create | `src/app/components/dock/dock.html` | Horizontal pill dock template |
| Modify | `src/app/app.ts` | Swap `SidebarComponent` → `DockComponent`; remove mobile state |
| Modify | `src/app/app.html` | Remove sidebar, mobile header, mobile drawer; add `<app-dock>` |
| Delete | `src/app/components/sidebar/sidebar.ts` | Replaced by dock |
| Delete | `src/app/components/sidebar/sidebar.html` | Replaced by dock |

---

## Task 1: Create the DockComponent

**Files:**
- Create: `src/app/components/dock/dock.ts`
- Create: `src/app/components/dock/dock.html`

**Interfaces:**
- Produces: `DockComponent` exported class with selector `app-dock`, no inputs

- [ ] **Step 1: Create `src/app/components/dock/dock.ts`**

```typescript
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { RecipeStateService } from '../../core/services/recipe-state.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-dock',
  imports: [RouterLink, RouterLinkActive, ConfirmDialogComponent, NgOptimizedImage],
  templateUrl: './dock.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DockComponent {
  private readonly authService = inject(AuthService);
  private readonly recipeState = inject(RecipeStateService);
  private readonly router = inject(Router);

  protected readonly isAuthenticated = this.authService.isAuthenticated;
  protected readonly currentUser = this.authService.currentUser;
  protected readonly currentRecipe = this.recipeState.currentRecipe;
  protected readonly isLogoutConfirmOpen = signal<boolean>(false);

  protected triggerLogoutConfirm(): void {
    this.isLogoutConfirmOpen.set(true);
  }

  protected cancelLogout(): void {
    this.isLogoutConfirmOpen.set(false);
  }

  protected async confirmLogout(): Promise<void> {
    this.isLogoutConfirmOpen.set(false);
    await this.authService.logout();
    this.router.navigate(['/']);
  }

  protected redirectToLogin(): void {
    this.authService.isAuthModalOpen.set(true);
  }

  protected newRecipe(): void {
    this.router.navigate(['/']);
  }
}
```

- [ ] **Step 2: Create `src/app/components/dock/dock.html`**

```html
<nav class="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 px-3 py-2 bg-[#fafaf8] rounded-3xl shadow-xl border border-slate-200/25 select-none">

  <!-- Logo -->
  <a
    routerLink="/"
    class="flex items-center gap-1.5 px-2 py-1 focus:outline-none"
    aria-label="Home"
  >
    <div class="relative w-7 h-7 shrink-0">
      <div class="absolute inset-0 rounded-full bg-amber-400/25 blur-md scale-110 pointer-events-none"></div>
      <img ngSrc="logo.png" fill class="object-contain relative z-10" alt="Kivora AI" priority>
    </div>
    <span class="font-black text-slate-800 tracking-wider text-[10px]">KIVORA AI</span>
  </a>

  <div class="w-px h-6 bg-slate-900/8 mx-1"></div>

  <!-- Discover -->
  <a
    routerLink="/"
    [routerLinkActiveOptions]="{ exact: true }"
    routerLinkActive
    #navHome="routerLinkActive"
    class="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-2xl transition-all duration-200 hover:bg-slate-900/5 focus:outline-none"
    aria-label="Discover Recipes"
  >
    <div
      class="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
      [class.bg-amber-400]="navHome.isActive"
    >
      <svg class="w-4.5 h-4.5 transition-colors duration-200" [class.text-slate-900]="navHome.isActive" [class.text-slate-400]="!navHome.isActive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    </div>
    <span class="text-[9px] font-bold" [class.text-slate-900]="navHome.isActive" [class.text-slate-400]="!navHome.isActive">Discover</span>
  </a>

  @if (currentRecipe()) {

    <!-- Checklist -->
    <a
      routerLink="/ingredients"
      routerLinkActive
      #navIngredients="routerLinkActive"
      class="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-2xl transition-all duration-200 hover:bg-slate-900/5 focus:outline-none"
      aria-label="Ingredient Checklist"
    >
      <div
        class="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
        [class.bg-amber-400]="navIngredients.isActive"
      >
        <svg class="w-4.5 h-4.5" [class.text-slate-900]="navIngredients.isActive" [class.text-slate-400]="!navIngredients.isActive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      </div>
      <span class="text-[9px] font-bold" [class.text-slate-900]="navIngredients.isActive" [class.text-slate-400]="!navIngredients.isActive">Checklist</span>
    </a>

    <!-- Steps -->
    <a
      routerLink="/steps"
      routerLinkActive
      #navSteps="routerLinkActive"
      class="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-2xl transition-all duration-200 hover:bg-slate-900/5 focus:outline-none"
      aria-label="Cooking Steps"
    >
      <div
        class="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
        [class.bg-amber-400]="navSteps.isActive"
      >
        <svg class="w-4.5 h-4.5" [class.text-slate-900]="navSteps.isActive" [class.text-slate-400]="!navSteps.isActive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <span class="text-[9px] font-bold" [class.text-slate-900]="navSteps.isActive" [class.text-slate-400]="!navSteps.isActive">Steps</span>
    </a>

  }

  <!-- History -->
  <a
    routerLink="/recent"
    routerLinkActive
    #navRecent="routerLinkActive"
    class="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-2xl transition-all duration-200 hover:bg-slate-900/5 focus:outline-none"
    aria-label="Recent Recipes"
  >
    <div
      class="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
      [class.bg-amber-400]="navRecent.isActive"
    >
      <svg class="w-4.5 h-4.5" [class.text-slate-900]="navRecent.isActive" [class.text-slate-400]="!navRecent.isActive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <span class="text-[9px] font-bold" [class.text-slate-900]="navRecent.isActive" [class.text-slate-400]="!navRecent.isActive">History</span>
  </a>

  <div class="w-px h-6 bg-slate-900/8 mx-1"></div>

  <!-- New Recipe -->
  <button
    type="button"
    (click)="newRecipe()"
    class="group flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-2xl transition-all duration-200 hover:bg-amber-50 focus:outline-none cursor-pointer"
    aria-label="New Recipe"
  >
    <div class="w-8 h-8 rounded-xl bg-amber-400 group-hover:bg-amber-300 flex items-center justify-center transition-all duration-200">
      <svg class="w-4 h-4 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </div>
    <span class="text-[9px] font-black text-slate-700">New</span>
  </button>

  <!-- User Avatar -->
  <button
    type="button"
    (click)="isAuthenticated() ? triggerLogoutConfirm() : redirectToLogin()"
    class="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-2xl transition-all duration-200 hover:bg-slate-900/5 focus:outline-none cursor-pointer"
    [attr.aria-label]="isAuthenticated() ? 'Sign Out' : 'Sign In'"
  >
    <div class="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/25 flex items-center justify-center text-amber-700 font-black text-xs uppercase transition-all hover:ring-2 hover:ring-amber-400/30">
      {{ isAuthenticated() ? (currentUser()?.name?.charAt(0) || 'C') : 'G' }}
    </div>
    <span class="text-[9px] font-bold text-slate-400">{{ isAuthenticated() ? 'Account' : 'Sign In' }}</span>
  </button>

</nav>

@if (isLogoutConfirmOpen()) {
  <app-confirm-dialog
    title="Sign Out Confirmation"
    message="Are you sure you want to end your active culinary session? You can return at any time."
    confirmText="Sign Out"
    cancelText="Stay"
    type="danger"
    (confirm)="confirmLogout()"
    (cancel)="cancelLogout()"
  />
}
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

Run: `npx tsc --noEmit`
Expected: no errors (the dock files exist but aren't wired into the app yet — that's fine, tsc checks syntax/types only)

- [ ] **Step 4: Commit**

```bash
git add src/app/components/dock/dock.ts src/app/components/dock/dock.html
git commit -m "feat: add DockComponent — horizontal bottom-center nav dock"
```

---

## Task 2: Wire Dock into App Shell

**Files:**
- Modify: `src/app/app.ts`
- Modify: `src/app/app.html`

**Interfaces:**
- Consumes: `DockComponent` from `./components/dock/dock`

- [ ] **Step 1: Replace `src/app/app.ts` entirely**

```typescript
import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { LoaderComponent } from './components/loader/loader';
import { DockComponent } from './components/dock/dock';
import { FooterComponent } from './components/footer/footer';
import { AuthModalComponent } from './components/auth-modal/auth-modal';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent, DockComponent, FooterComponent, AuthModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  public readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private readonly routerUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects || event.url)
    ),
    { initialValue: '/' }
  );

  protected readonly isLoginRoute = computed(() => {
    return this.routerUrl().includes('/login');
  });

  protected readonly title = signal('kivora-ai-frontend');

  public async ngOnInit(): Promise<void> {
    await this.authService.checkSession();
  }
}
```

- [ ] **Step 2: Replace `src/app/app.html` entirely**

```html
@if (!isLoginRoute()) {
  <div class="flex min-h-screen relative bg-[#fbfbfa]">

    <app-dock />

    <div class="flex-grow flex flex-col min-h-screen min-w-0">
      <main class="relative flex-grow bg-linear-to-b from-[#fbfbfa] via-[#f7f5f0] to-[#f4eedb] text-slate-900 flex flex-col justify-between">
        <div class="flex-grow pb-24">
          <router-outlet />
        </div>
        <app-footer />
      </main>
    </div>

  </div>
} @else {
  <main class="relative min-h-screen bg-slate-950 text-slate-900">
    <router-outlet />
  </main>
}

<app-loader />

@if (authService.isAuthModalOpen()) {
  <app-auth-modal (close)="authService.isAuthModalOpen.set(false)" />
}
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/app.ts src/app/app.html
git commit -m "feat: wire DockComponent into app shell, remove sidebar and mobile drawer"
```

---

## Task 3: Delete Old Sidebar Files

**Files:**
- Delete: `src/app/components/sidebar/sidebar.ts`
- Delete: `src/app/components/sidebar/sidebar.html`

- [ ] **Step 1: Delete the sidebar files**

```bash
rm src/app/components/sidebar/sidebar.ts
rm src/app/components/sidebar/sidebar.html
rmdir src/app/components/sidebar
```

- [ ] **Step 2: Verify TypeScript still compiles cleanly**

Run: `npx tsc --noEmit`
Expected: no errors (nothing should import the old sidebar anymore)

- [ ] **Step 3: Verify app serves without errors**

Run: `ng serve`
Expected: browser shows the bottom dock pill with Kivora AI logo, Discover, History, New, and user avatar. Checklist/Steps appear only when a recipe is loaded. No console errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove old sidebar component — replaced by DockComponent"
```
