import { createService } from '@rxfx/service';
import { Observable } from 'rxjs';
import { bus } from './bus';

const mouseYs: Observable<number> = null;
export const pointerService = createService<'up' | 'down', number, Error>(
  'pointer',
  bus,
  () => mouseYs
);

// Example:
// pointerService.request('test');
// puts these events on the bus
// {type: "pointer/request", payload: "test", meta: {…}}
// {type: "pointer/started", payload: undefined}
// {type: "pointer/complete", payload: undefined}
