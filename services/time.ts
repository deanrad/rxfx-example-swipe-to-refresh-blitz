import { after } from '@rxfx/after';
import { bus } from './bus';

export const TIME_REQUEST = 'time/request';

const fakeTimeResponse = after(2500, () => {
  console.log('Time listener is live, and singleton! TODO put in DOM');
  return new Date().toUTCString();
});

bus.listenBlocking(
  (e) => e === TIME_REQUEST,
  () => fakeTimeResponse
);

bus.trigger(TIME_REQUEST);
bus.trigger(TIME_REQUEST);
// Now we see that the effect *will not* execute if already executing!
// No tracking variables required!
// time/request
// time/request
// Time listener is live! TODO put in DOM
