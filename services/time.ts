import { after } from '@rxfx/after';
import { bus } from './bus';
import { setData } from './DOM';
import {
  connectDOMEventsToPointerService,
  disconnectDOMEventsFromPointerService,
} from './pointer';

export const TIME_REQUEST = 'time/request';

const fakeTimeResponse = after(2500, () => {
  console.log('Time listener is live, and singleton!');
  return new Date().toUTCString();
});

const handleRequestBegin = () => {
  console.log('loading...');
  disconnectDOMEventsFromPointerService();
  setData('loading...');
};

const handleRequestDone = (newDate) => {
  console.log(newDate);
  connectDOMEventsToPointerService();
  setData('Refreshed at: ' + newDate);
};

bus.listenBlocking(
  (e) => e === TIME_REQUEST,
  () => fakeTimeResponse,
  {
    subscribe: handleRequestBegin,
    next: handleRequestDone,
  }
);

bus.trigger(TIME_REQUEST);
bus.trigger(TIME_REQUEST);
// Now we see that the effect *will not* execute if already executing!
// No tracking variables required!
// time/request
// time/request
// Time listener is live! TODO put in DOM
