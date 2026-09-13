import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * The "prominent link to Pexels" their API terms require on any page that
 * displays photos fetched through it. Dropped per-page (ingredients, recent)
 * rather than sitewide in the dock/footer, since plenty of pages — settings,
 * login, steps — show no Pexels-sourced photo at all.
 */
@Component({
  selector: 'app-pexels-credit',
  template: `
    <a
      href="https://www.pexels.com"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400 hover:text-amber-700 transition-colors duration-200"
    >Photos provided by Pexels</a>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PexelsCreditComponent {}
