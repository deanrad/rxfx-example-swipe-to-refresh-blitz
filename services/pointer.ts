import { createService } from '@rxfx/service';
import { fromEvent } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { bus } from './bus';
import { setRefreshPos } from './DOM';

const MOBILE = { DOWN: 'touchstart', UP: 'touchend', MOVE: 'touchmove' };
const DESKTOP = { DOWN: 'mousedown', UP: 'mouseup', MOVE: 'mousemove' };

export const POINTER_EVENTS =
  'ontouchstart' in document.documentElement ? MOBILE : DESKTOP;

const mouseYsUntilUp = fromEvent(document, POINTER_EVENTS.MOVE).pipe(
  map((ev: MouseEvent) => ev.clientY),
  takeUntil(fromEvent(document, POINTER_EVENTS.UP))
);

export const pointerService = createService<'up' | 'down', number, Error>(
  'pointer',
  bus,
  (event) => {
    if (event === 'down') {
      return mouseYsUntilUp;
    }
  }
);

/////////////////// UI updates /////////////////
pointerService.responses.subscribe((r) => setRefreshPos(r.payload));

/////////////////// DOM Event Harvesting /////////////////

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

// Example:
// pointerService.request('test');
// puts these events on the bus
// {type: "pointer/request", payload: "test", meta: {…}}
// {type: "pointer/started", payload: undefined}
// {type: "pointer/complete", payload: undefined}
