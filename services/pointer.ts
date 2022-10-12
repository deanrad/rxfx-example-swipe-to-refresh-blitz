import { fromEvent } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { createService } from '@rxfx/service';
import { bus } from './bus';
import { setRefreshPos, resetRefresh } from './DOM';

////////////////////// Pointer Actor ////////////////////////
export const pointerService = createService<'up' | 'down', number, Error>(
  'pointer',
  bus,
  (direction) => {
    if (direction === 'down') {
      return fromEvent(document, POINTER_EVENTS.MOVE).pipe(
        takeUntil(fromEvent(document, POINTER_EVENTS.UP)),
        map((ev: MouseEvent) => ev.clientY)
      );
    }
  }
);

export const isPastThreshold = (y: number) => y >= 102;

// Business rules enabled by the pointerService
// Rule: dot follows pointer
pointerService.responses.subscribe((r) => setRefreshPos(r.payload));
// Rule: threshold reverts the drag, begins a time request
pointerService.responses.subscribe(({ payload: y }) => {
  if (isPastThreshold(y)) {
    pointerService.cancelCurrent();
  }
});
// Rule: restore position at the end
bus
  .query(pointerService.actions.complete.match)
  .subscribe(() => resetRefresh());

/////////////////// DOM Event Harvesting /////////////////
const MOBILE = { DOWN: 'touchstart', UP: 'touchend', MOVE: 'touchmove' };
const DESKTOP = { DOWN: 'mousedown', UP: 'mouseup', MOVE: 'mousemove' };

export const POINTER_EVENTS =
  'ontouchstart' in document.documentElement ? MOBILE : DESKTOP;

// DOM listener setup + teardown
const sendDown = (e: Event) => {
  e.preventDefault();
  pointerService.request('down');
};
const sendUp = (e: Event) => {
  e.preventDefault();
  pointerService.request('up');
};

export const connectDOMEventsToPointerService = () => {
  document.addEventListener(POINTER_EVENTS.DOWN, sendDown);
  document.addEventListener(POINTER_EVENTS.UP, sendUp);
};
export const disconnectDOMEventsFromPointerService = () => {
  document.removeEventListener(POINTER_EVENTS.DOWN, sendDown);
  document.removeEventListener(POINTER_EVENTS.UP, sendUp);
};
connectDOMEventsToPointerService();
