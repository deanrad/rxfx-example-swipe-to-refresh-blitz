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
