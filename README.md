# 𝗥𝘅𝑓𝑥 Example: Swipe To Refresh

*Obective:* Build a "Swipe To Refresh" UX widget with an 𝗥𝘅𝑓𝑥 event bus from [`@rxfx/bus`](https://github.com/deanrad/rxfx/tree/main/bus), and a service on that bus from [`@rxfx/service`](https://github.com/deanrad/rxfx/tree/main/service). 

_(A complete version is here [on StackBlitz](https://stackblitz.com/edit/rxjs-refresh-jg6uy6?devtoolsheight=40&file=README.md,index.ts), and built incrementally [on GitHub](https://github.com/deanrad/rxfx-example-swipe-to-refresh-blitz/pull/15/files))_

# What We'll Build

A drag-and-drop UI widget that can trigger a refresh.

![](https://s3.amazonaws.com/www.deanius.com/rxfx-swipe-to-refresh-demo.gif)

The requirements are:
 - The dot is draggable
 - The dot triggers a refresh when it overlaps the darker dot.
 - The dot's position resets upon refresh or release.
 - The time displays 1 second after a refresh
 - During time refresh, no other refreshes can begin, and the dot is not draggable.

# Overview

This widget will be made from two async 'containers' which we'll develop separately:

- The time 'endpoint' (simulated)
- The draggable refresh dot

Then to cap it all off, we'll trigger the Time Listener when the Pointer Service is ready, no problem!

> One decision criteria for whether to use a listener on an `@rxfx/bus` or an `@rxfx/service` is whether we need to know when the service is 'active'. Changing the dot's appearance while dragging is such a use case. To start with, we'll make the mouse-dragger a full service, and the time 'endpoint' a simple listener, and go from there!

## Setup / Organization

We're starting with a styled HTML document, and a module of DOM mutating functions. We'll place these in `services/DOM`. Our time lookup will go in `services/time`, and our pointer service in `services/pointer`. A bus will connect all of these, allowing for centralized logging, error handling, etc.

## Install The Bus
The bus is like a `Subject`, on which `next` is renamed to `trigger`, and `listenBlocking(cond, handler)` is a shortcut for `subject.asObservable().pipe(filter(cond), exhaustMap(handler))`. It comes pre-wired in a single import.

Understanding that, let's declare a bus that accepts strings, and listen for those to implement the refresh side

```
const bus = new Bus<string>();
```

# The Time Listener

[PR containing Just Time Listener Code](https://github.com/deanrad/rxfx-example-swipe-to-refresh-blitz/pull/16)

## A delayed value with `@rxfx/after`

The original Swipe-To-Refresh demo on [LearnRxjs.io](https://www.learnrxjs.io/learn-rxjs/recipes/swipe-to-refresh) demo uses no fewer than 4 functions to create a delayed time endpoint: `of`, `delay`, `pipe` and `tap`. 

We can declare a fake value using `after` from `@rxfx/after` with only one. Depending on whether we want the time computed at the beginning or the end, we can call `after` with either a value or a function.

```js
const fakeDateNow = after(2000, Date.now()) // 
const fakeDateAtEnd = after(2000, () => Date.now()) // 

const fakeEndpoint = () => fakeDateAtEnd;
```

## On request, call the time 'endpoint'
Now, we'll create a bus listener to respond with the fake data. Suppose the initiation of the time lookup is to begin when an item equal to `time/request` goes on the bus.

```js
bus.listen(event => event === `time/request`, () => fakeEndpoint())
```

We intentionally return the deferred value of the date from the handler. This would work whether the return value was a Promise or an RxJS Observable. Since `after` is an Observable, thus lazy, we return it to the bus so that it can call `.subscribe()` on it. But we don't want to subscribe to a new delayed date if one is pending already, so let's solve that.

## Don't refresh while already refreshing

Using the console, we see that calling `bus.trigger(TIME_REQUEST)` twice results in double loading messages. 

To adjust this In raw RxJS we would `pipe` something through an `exhaustMap`, but we can skip those imports.

In contrast to `bus#listen`, `bus#listenBlocking` takes the same arguments, but runs the effect with `exhaustMap` semantics. We just do:

```diff
- bus.listen(
+ bus.listenBlocking(
  event => event === `time/request`, 
  () => fakeEndpoint()
)
```
Even if our UI will disable things, this makes the intention clear to those reading it. Now lets see these results in the DOM!

## On reponse, update the DOM

We have a couple of wrapper functions around our DOM mutation functions, called `handleRequestBegin` and `handleRequestDone`, which will update the DOM with the text `...loading...`, or the new date, respectively. 

To recap, the arguments to `listen*` are:
  - **cause** - the condition that will cause the effect
  - **effect** - the side-effecting function to call

and to this we'll now add:  
  - **consequences** - the Observer that will react to the effect events. 

This `observer` will be `tap`-ped in without us needing to import `tap`, `finalize`, or others.

```js
const handleRequestBegin = () => {
  console.log('loading...');
  setData('loading...');
};

bus.listen(
  (e) => e === TIME_REQUEST,
  () => fakeResponse,
  {
    subscribe: handleRequestBegin,
    next: handleRequestDone,
  }
);
```

## Time Listener Complete!
This completes our time listener! Whenever anyone calls `trigger(TIME_REQUEST)`, the time will go in the DOM with **Blocking** behavior. We've cut out a lot of operators at this point, but we can do more.

Let's build the Swipe-To-Refresh pointer functionality out of the higher-level 𝗥𝘅𝑓𝑥 building block - the `@rxfx/service`, akin to `createAsyncThunk` or NgRx, and continue to drop operators.

# Pointer Service

[PR containing Just Pointer Service Code](https://github.com/deanrad/rxfx-example-swipe-to-refresh-blitz/pull/18)

We expect our Pointer Service to implement dragging our UI element under the pointer, then trigger the time listener. To create the service we need to know what kinds of "requests" it can get - in this case the string "up" or "down". We want its responses to be a stream of `number`s - the `clientY` field of each `pointer/move` it sees. And its errors are the normal type `Error`.

```js
export const pointerService = createService
  <'up' | 'down', number, Error>
 ('pointer', bus, () => mouseMoveYs)

const mouseMoveYs: Observable<number> = () => null
```

The arguments are the namespace, for logging purposes, the bus on which it will put responses, and the effect. The effect will return an Observable of responses, and these will go onto our bus as they occur.

## DOM listeners talk to the Pointer service
Now we can add DOM listeners that will pass the service the string 'up' or 'down'.

```js
const sendDown = (e: Event) => {
  e.preventDefault();
  pointerService.request('down');
};
const sendUp = (e: Event) => {
  e.preventDefault();
  pointerService.request('up');
};

export const connectDOMEventsToPointerService = () => {
  document.addEventListener(POINTER_EVENTS.DOWN, sendDown);
  document.addEventListener(POINTER_EVENTS.UP, sendUp);
};
```

We'll write a `disconnectDOMEventsFromPointerService` function as well, not shown here. First - let's specify this service's effect and its responses.

## On down, moves become responses (until up)
First, let's ensure we're `spy`ing on all bus events so we can see what's going on even before we hook it up to the UI.
 
Now, import `fromEvent` and `map` from RxJS..

```js
const mouseMoveYs: Observable<number> = () => {
  return fromEvent(document, 'pointer/move').pipe(
    map(ev: MouseEvent => ev.clientY)
  )
}
```

Try pressing the mouse down, and notice how as you move the pointer, the console will stream with:

```js
{type: 'pointer/next', payload: 10}
{type: 'pointer/next', payload: 11}
```
Now, we add in cancelation with `takeUntil`.

```js
const mouseMoveYs: Observable<number> = () => {
  return fromEvent(document, 'pointer/move').pipe(
    map(ev: MouseEvent => ev.clientY),
    takeUntil(fromEvent(document, 'pointer/up'))
  )
}
```

We're using operators, but only for their intended purposes. Now, when it comes to updating the DOM, our `service` gives us choices and modularity that raw RxJS doesn't.

## Dot follows pointer / is dragged
We established that `pointerService` has responses that are of type `number`, right? And we have a `setRefreshPos` function that changes the DOM position of the refresh dot. So all we need is:

```js
pointerService.responses.subscribe((r) => setRefreshPos(r.payload));
```

While the pointerService effect returned raw numbers, the `@rxfx/service` bundled them into the Flux Standard Actions. We retrieve the raw `number` from their `payload` - and yes, TypeScript would have helped you see that :)

What's nice about adding dragging this way is that it doesn't `tap` into one giant chain. The Dot position is a subscriber - a _follower_ of those pointer/moves. This helps us keep things separated, like ...

## On cancel (or complete), reset the dot's DOM position

We'd like, once we've stopped dragging, for the refresh dot to return to its initial position. As you saw in the console, once the `pointer/up` event occurred, a `pointer/complete` event was also seen.

We can hook off of this `pointer/complete` event to call `resetRefresh`:

```js
bus
  .query(pointerService.actions.complete.match)
  .subscribe(() => resetRefresh());
```

We are filtering the bus down to all `pointer/complete` events, and each one causes a `resetRefresh`. We query the bus since these events are not part of the stream of `pointerService.responses`.

Now let's hook up our final part, the refresh!

## On move, if far enough, cancel drag and trigger the time refresh

We can listen to our service's responses as a stream, and if we exceed the Y threshold to trigger the refresh, we can reset the refresh button by canceling it. 

```js
pointerService.responses.subscribe(({ payload: y }) => {
  if (isPastThreshold(y)) {
    pointerService.cancelCurrent();
    bus.trigger(TIME_REQUEST);
  }
});
```

Our pointer will return to the starting point, because the `pointer/complete` event will fire upon `cancelCurrent()`. And we'll no longer be draggging the dot until the next `pointer/down`. Lastly, we've triggered our time listener with that event of `TIME_REQUEST`, so everything is working!

## Bonus: during drag, change appearances.

I wouldn't want to miss describing one of the great features of `@rxfx/service` - the `isActive` Observable that lets you react to one of its effects being active. Just watch how we can make it easier on the eye!

```js
pointerService.isActive.subscribe((isActive) => {
  const method = isActive ? 'add' : 'remove';
  document.getElementById('refresh').classList[method]('isDragging');
});

```

## While refreshing, the dot is not draggable

We built our Pointer Service and Time Listener to not know about each other—initially. Now that we want to do something while the Time Listener is active, we could re-write it as a service and subscribe to its `isActive` property as we could for the Pointer Service.

But since we already have functions in the Time Listener's Observer we can use those to stop sending events to the Pointer Service.

```js
const handleRequestBegin = () => {
  console.log('loading...');
+ disconnectDOMEventsFromPointerService();
  setData('loading...');
};
```

Now, as our _coup-de-grâce_, we have implemented a form of blocking mode by hand to complete our widget! 

[PR of Pointer Service](https://github.com/deanrad/rxfx-example-swipe-to-refresh-blitz/pull/18/files)

[PR of entire demo](https://github.com/deanrad/rxfx-example-swipe-to-refresh-blitz/pull/15/files)

# Summary

We used fewer individual RxJS operators to build the 𝗥𝘅𝑓𝑥 way than with raw RxJS. The service and listener concepts let us apply operators without creating a giant chain. Features are added separately, with little interference to each other.

With 𝗥𝘅𝑓𝑥 your app is mostly a list of tuples of:

```
[cause1, effect1, reactions1[]]
[cause2, effect2, reactions2[]]
```

Your app grows in a maintainable and performant fashion — at least, it has for me. You can also use it to create Observables of state from triggered events, and a lot of other fun things. Pub-Sub is a great paradigm for rapid and modular app building.

Enjoy building and listening!

𝗥𝘅𝑓𝑥 Creator, Dean Radcliffe
