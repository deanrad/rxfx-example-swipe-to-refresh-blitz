// Adapted from https://www.learnrxjs.io/learn-rxjs/recipes/swipe-to-refresh
// Original code: https://stackblitz.com/edit/rxjs-refresh
console.clear();
import { after } from '@rxfx/after';
import { bus } from './services/bus';

import {
  pointerService,
  disconnectDOMEventsFromPointerService,
  connectDOMEventsToPointerService,
  isPastThreshold,
} from './services/pointer';
import { TIME_REQUEST } from './services/time';
import { setData } from './services/DOM';

////////////////////// Time Service Actor ////////////////////////
const fakeResponse = after(2500, () => {
  return new Date().toUTCString();
});

const handleRequestBegin = () => {
  console.log('loading...');
  disconnectDOMEventsFromPointerService();
  setData('loading...');
};

const handleRequestDone = (newDate) => {
  console.log(newDate);
  setData('Refreshed at: ' + newDate);
  connectDOMEventsToPointerService();
};

bus.listenBlocking(
  (e) => e === TIME_REQUEST,
  () => fakeResponse,
  {
    subscribe: handleRequestBegin,
    next: handleRequestDone,
  }
);

////////////////// Connect the 2 services  ///////////////
pointerService.responses.subscribe(({ payload: y }) => {
  if (isPastThreshold(y)) {
    bus.trigger(TIME_REQUEST);
  }
});

////////////////// Bonus: Imperative Cancelation ///////////////

// // A timeout for each invocation (reset by each new start)
// bus.listenSwitching(pointerService.actions.started.match, () =>
//   after(2500, () => pointerService.cancelCurrent())
// );

////////////////// Bonus: Visualize while dragging //////////////////
pointerService.isActive.subscribe((isActive) => {
  const method = isActive ? 'add' : 'remove';
  document.getElementById('refresh').classList[method]('isDragging');
});
