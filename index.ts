import { after } from '@rxfx/after';
// Adapted from https://www.learnrxjs.io/learn-rxjs/recipes/swipe-to-refresh
// Original code: https://stackblitz.com/edit/rxjs-refresh
console.clear();

const fakeTimeResponse = after(2500, () => {
  return new Date().toUTCString();
}); // .then(console.log);
