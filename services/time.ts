import { after } from '@rxfx/after';
import { bus } from './bus';

export const TIME_REQUEST = 'time/request';

const fakeTimeResponse = after(2500, () => {
  console.log('Time listener is live! TODO put in DOM');
  return new Date().toUTCString();
});

bus.listen(
  (e) => e === TIME_REQUEST,
  () => fakeTimeResponse
);

bus.trigger(TIME_REQUEST);
bus.trigger(TIME_REQUEST);
// TODO dont call the endpoint again if we are "fetch"ing already
// time/request
// time/request
// Time listener is live! TODO put in DOM
// Time listener is live! TODO put in DOM
