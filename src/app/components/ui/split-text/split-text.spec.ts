import { TestBed } from '@angular/core/testing';
import { SplitTextComponent } from './split-text';

describe('SplitTextComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SplitTextComponent],
    }).compileComponents();
  });

  async function render(text: string, unit: 'word' | 'char' = 'word') {
    const fixture = TestBed.createComponent(SplitTextComponent);
    fixture.componentRef.setInput('text', text);
    fixture.componentRef.setInput('unit', unit);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('splits into words and exposes the whole line to assistive tech', async () => {
    const element = await render('Cook Exactly What');

    expect(element.querySelectorAll('.split-word').length).toBe(3);
    expect(element.getAttribute('aria-label')).toBe('Cook Exactly What');
    expect(element.textContent?.replace(/\s+/g, ' ').trim()).toBe('Cook Exactly What');
  });

  /**
   * The entire motion system leans on `[style.--i]` reaching the DOM as a real
   * custom property — every stagger is a calc() against it. If Angular ever
   * stopped writing these through, the animations would silently flatten.
   */
  it('writes the running index as a --i custom property', async () => {
    const element = await render('One dish. Yours.', 'char');

    const words = element.querySelectorAll<HTMLElement>('.split-word');
    expect(words[0].style.getPropertyValue('--i')).toBe('0');
    expect(words[1].style.getPropertyValue('--i')).toBe('1');

    const chars = element.querySelectorAll<HTMLElement>('.split-char');
    expect(chars.length).toBe('Onedish.Yours.'.length);
    expect(chars[0].style.getPropertyValue('--i')).toBe('0');
    // "One" is 3 chars plus the gap that follows it, so "dish." starts at 4.
    expect(chars[3].style.getPropertyValue('--i')).toBe('4');
  });

  it('renders nothing for empty text', async () => {
    const element = await render('   ');
    expect(element.querySelectorAll('.split-word').length).toBe(0);
  });
});
