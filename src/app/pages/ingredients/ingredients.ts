import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-ingredients',
  template: `
    <div class="text-center p-8">
      <h1 class="text-2xl font-bold text-slate-805">Ingredients Checklist (Stub)</h1>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientsComponent {}
