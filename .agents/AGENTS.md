# Kivora AI - Coding Standards & Best Practices

This document outlines the coding standards, patterns, and architectural rules that must be adhered to in the `kivora-ai-frontend` repository.

## 🛠️ TypeScript Rules
1. **Strict Type Checking:** Always enable strict compilation (`strict: true`, `noImplicitAny: true`, `strictNullChecks: true` in `tsconfig.json`).
2. **Type Inference:** Prefer type inference when types are obvious (e.g., initialization of primitive variables); otherwise, explicitly declare types.
3. **No `any`:** Avoid the `any` type at all costs. Use `unknown` when a type is uncertain.
4. **Access Specifiers:** Use explicit access specifiers (`public`, `private`, `protected`) for all class properties and methods.
5. **Immutability:** Mark properties as `readonly` wherever they are not intended to be mutated.
6. **Strict Interfaces:** Declare clean interfaces in a separate file (e.g., models, enums) for every data object and component contract. Do not define models/types ad-hoc.

## 📐 Angular Best Practices & Component Design
1. **Standalone Components:** Use standalone components. Since Angular v20+ defaults to standalone components, do **NOT** set `standalone: true` inside component decorators.
2. **Signals-First State Management:** 
   - Use Angular Signals (`signal()`) for all local component state. Do **NOT** use RxJS Observables or state mutations.
   - Use `computed()` for all derived values.
   - Do **NOT** use `.mutate()` on signals; use `.update()` or `.set()` instead.
   - Keep state transformations pure, predictable, and clean.
3. **Inputs & Outputs:** Use modern signal inputs `input()` and outputs `output()` functions instead of the legacy `@Input()` and `@Output()` decorators.
4. **Change Detection:** Enforce `changeDetection: ChangeDetectionStrategy.OnPush` on every `@Component` decorator.
5. **No Host Decorators:** Host bindings must be declared inside the component/directive decorator's `host` object. Do **NOT** use `@HostBinding` or `@HostListener` decorators.
6. **Template and Style Organization:**
   - Prefer inline templates for very small components.
   - When using external templates/styles, refer to them using paths relative to the component `.ts` file.
7. **No ngClass/ngStyle:** Do **NOT** use `ngClass` or `ngStyle` directives. Instead, use standard Angular class bindings (e.g., `[class.active]="isActive()"`) and style bindings (e.g., `[style.width.%]="progress()"`).
8. **Static Asset Optimization:** Use `NgOptimizedImage` for all static local images (note: does not work for inline base64 images).
9. **Forms:** Prefer Angular Reactive Forms (using `FormGroup`, `FormControl`, etc.) over Template-driven forms. Use typed FormGroups and clear getter methods for form control access.
10. **Clean Imports:** Always remove unused imports immediately. Keep import statements organized.

## 🧭 Services Design
1. **Dependency Injection:** Use the functional `inject()` method for all service dependency resolutions. Do **NOT** use constructor parameters for injection.
2. **Single Responsibility:** Design services around a single responsibility (e.g., separating state storage from HTTP API calls).
3. **Singleton Configuration:** Use the `providedIn: 'root'` option for singleton services.
4. **No RxJS Subscription Pipelines:** 
   - Convert async HTTP responses directly to Promises or Signals using native `async/await` patterns to eliminate RxJS subscriptions.
   - No `.subscribe()` calls in components.

## 🎨 Templates & Control Flow
1. **Modern Control Flow:** Use native Angular control flows (`@if`, `@for`, `@switch`) in HTML templates. Do **NOT** import or use legacy structural directives like `*ngIf`, `*ngFor`, or `*ngSwitch`.
2. **Async Handling:** Use the `async` pipe to handle observables when they are absolutely unavoidable (e.g., router events).
3. **Template Simplicity:** Keep templates simple and avoid complex logic expressions.
4. **No Global Assumptions:** Do not assume global objects (e.g., `new Date()`) are available directly in templates. Define them in the component class or use a computed signal.

## ♿ Accessibility (WCAG AA)
1. **Axe Compliance:** Ensure components pass all Axe accessibility checks.
2. **WCAG AA Minimums:** Strictly follow WCAG AA standards:
   - Ensure proper color contrast.
   - Use correct semantic HTML elements (`<button>`, `<main>`, `<nav>`, etc.).
   - Apply appropriate ARIA attributes (`aria-expanded`, `aria-label`, etc.) where necessary.
   - Manage keyboard focus dynamically (e.g., when opening/closing modals).

## 💬 Commenting Standards
1. **Single-line Comments:** Use single-line comments in clear, concise English.
2. **Selective Commenting:** Only write comments for important, non-obvious, or complex logic. Do not write comments for self-explanatory code.
