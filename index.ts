import { after } from '@rxfx/after';
import './services/bus';

const fakeTimeResponse = after(2500, () => {
  return new Date().toUTCString();
}); // .then(console.log);

// Adapted from https://www.learnrxjs.io/learn-rxjs/recipes/swipe-to-refresh
// Original code: https://stackblitz.com/edit/rxjs-refresh
