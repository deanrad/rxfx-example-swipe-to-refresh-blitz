console.clear();
import { fromEvent, iif, of, pipe } from 'rxjs';
import { finalize, mergeMap, takeUntil, takeWhile, repeat, map, tap, exhaustMap, delay } from 'rxjs/operators';

const setRefreshPos = y =>
  document.getElementById('refresh').style.top = `${y}px`;
const resetRefresh = () => setRefreshPos(10);
const setData = data => document.getElementById('data').innerText = data;

const fakeRequest = () => of(new Date().toUTCString()).pipe(
  tap(_ => console.log('request')), delay(1000)
);

const takeUntilMouseUpOrRefresh$ = pipe(
  takeUntil(fromEvent(document, 'mouseup')),
  takeWhile(y => y < 110),
);
const moveDot = y => of(y).pipe(tap(setRefreshPos));
const refresh$ = of({}).pipe(
  tap(resetRefresh),
  tap(e => setData('...refreshing...')),
  exhaustMap(_ => fakeRequest()),
  tap(setData)
)

fromEvent(document, 'mousedown').pipe(
  mergeMap(_ => fromEvent(document, 'mousemove')),
  map((e: MouseEvent) => e.clientY),
  takeUntilMouseUpOrRefresh$,
  finalize(resetRefresh),
  exhaustMap(y => iif(
    () => y < 100,
    moveDot(y),
    refresh$
  )),
  finalize(() => console.log('end')),
  repeat()
).subscribe();

