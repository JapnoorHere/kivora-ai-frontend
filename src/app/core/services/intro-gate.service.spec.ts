import { TestBed } from '@angular/core/testing';
import { IntroGateService } from './intro-gate.service';

describe('IntroGateService', () => {
  let gate: IntroGateService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    gate = TestBed.inject(IntroGateService);
  });

  it('runs work straight away when no intro is playing', () => {
    let ran = false;
    gate.whenClear(() => (ran = true));

    expect(ran).toBe(true);
  });

  it('holds work until the intro finishes', () => {
    gate.start();

    let ran = false;
    gate.whenClear(() => (ran = true));
    expect(ran).toBe(false);

    gate.finish();
    expect(ran).toBe(true);
  });

  /**
   * The intro can end before anything asks to be let through — it is skippable,
   * and it does not play at all on a repeat visit. Work queued afterwards must
   * not sit waiting for a release that has already happened.
   */
  it('lets work through once the intro is already over', () => {
    gate.start();
    gate.finish();

    let ran = false;
    gate.whenClear(() => (ran = true));

    expect(ran).toBe(true);
  });

  it('releases every waiter exactly once', () => {
    gate.start();
    let runs = 0;
    gate.whenClear(() => runs++);
    gate.whenClear(() => runs++);

    gate.finish();
    gate.finish();

    expect(runs).toBe(2);
  });
});
