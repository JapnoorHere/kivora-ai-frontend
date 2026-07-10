import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-steps',
  template: `
    <div class="text-center p-8">
      <h1 class="text-2xl font-bold text-slate-800">Cooking Steps (Stub)</h1>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepsComponent {}
