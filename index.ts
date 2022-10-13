import { TIME_REQUEST } from './services/time';
import { pointerService } from './services/pointer';
import { bus } from './services/bus';

export const isPastThreshold = (y: number) => y >= 102;

// Business rules enabled by the pointerService
pointerService.responses.subscribe(({ payload: y }) => {
  if (isPastThreshold(y)) {
    pointerService.cancelCurrent();
    bus.trigger(TIME_REQUEST);
  }
});

// Adapted from https://www.learnrxjs.io/learn-rxjs/recipes/swipe-to-refresh
// Original code: https://stackblitz.com/edit/rxjs-refresh
