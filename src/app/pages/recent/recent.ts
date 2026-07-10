import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-recent',
  template: `
    <div class="text-center p-8">
      <h1 class="text-2xl font-bold text-slate-800">Cooking History (Stub)</h1>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentComponent {}
