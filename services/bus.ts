import { Bus } from '@rxfx/bus';

// Our place to set up listeners and services - our effect containers, and for viewing execution logs
export const bus = new Bus<number | string>();
bus.spy(console.log); // bus.spy((e) => e.type || console.log(e));

// Example usage
bus.listen(
  (e) => e === '.help',
  () => console.log('Drag down ⟲ to refresh')
);
bus.trigger('.help');
