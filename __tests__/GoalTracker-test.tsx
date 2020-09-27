import { getDistance } from 'geolib';
/**
 * @format
 */

import GoalTracker from '../GoalTracker';

let stepSize = getDistance({lat: 49.000, lng: 128}, {lat: 49.002, lng: 128});

it('gets colder after moving away', () => {
  let tracker = new GoalTracker(
    {lat: 49.100, lng: 128},
    stepSize).setGoal({lat: 49.000, lng: 128});

  tracker.updatePosition({lat: 49.103, lng: 128});
  expect(tracker.clue).toBe("Colder");
});

it('gets warmer after moving closer', () => {
  let tracker = new GoalTracker(
    {lat: 49.100, lng: 128},
    stepSize).setGoal({lat: 49.000, lng: 128});

  tracker.updatePosition({lat: 49.097, lng: 128});
  expect(tracker.clue).toBe("Warmer");
  expect(tracker.clueProgress).toBe(0);
});

it('gives no clue within step circle', () => {
  let tracker = new GoalTracker(
    {lat: 49.100, lng: 128},
    stepSize).setGoal({lat: 49.000, lng: 128});

  tracker.updatePosition({lat: 49.099, lng: 128});
  let clueProgress = tracker.clueProgress;
  expect(tracker.clue).toBe("");
  expect(clueProgress).toBeGreaterThan(0.49)
  expect(clueProgress).toBeLessThan(0.51)
});

it('resets clue progress after clue', () => {
  let tracker = new GoalTracker(
    {lat: 49.100, lng: 128},
    stepSize).setGoal({lat: 49.000, lng: 128});

  tracker.updatePosition({lat: 49.099, lng: 128});
  let clue1 = tracker.clue;
  tracker.updatePosition({lat: 49.098, lng: 128});
  let clue2 = tracker.clue,
    clueProgress = tracker.clueProgress;
  expect(clue1).toBe("");
  expect(clue2).toBe("Warmer");
  expect(clueProgress).toBe(0)
});

it('gives clue when moving on a tangent', () => {
  let tracker = new GoalTracker(
    {lat: 49.100, lng: 129},
    stepSize).setGoal({lat: 49.000, lng: 128});

  tracker.updatePosition({lat: 49.090, lng: 129});
  expect(tracker.clue).toBe("Warmer");
});

it('gives found clue', () => {
  let tracker = new GoalTracker(
    {lat: 49.100, lng: 128},
    stepSize).setGoal({lat: 49.000, lng: 128});

  tracker.updatePosition({lat: 49.099, lng: 128});
  tracker.updatePosition({lat: 49.001, lng: 128});
  expect(tracker.clue).toBe("Found 111m away");
  expect(tracker.clueProgress).toBe(0);
});

it('gives no clue within second step circle', () => {
  let tracker = new GoalTracker(
    {lat: 49.100, lng: 128},
    stepSize).setGoal({lat: 49.000, lng: 128});

  tracker.updatePosition({lat: 49.097, lng: 128});
  tracker.updatePosition({lat: 49.096, lng: 128});
  expect(tracker.clue).toBe("Warmer");
  expect(tracker.clueProgress).toBeGreaterThan(0.49);
  expect(tracker.clueProgress).toBeLessThan(0.51);
});

it('stays found forever after', () => {
  let tracker = new GoalTracker(
    {lat: 49.100, lng: 128},
    stepSize).setGoal({lat: 49.000, lng: 128});

  tracker.updatePosition({lat: 49.001, lng: 128});
  tracker.updatePosition({lat: 49.003, lng: 128});
  expect(tracker.clue).toBe("Found 334m away");
});

it('stops giving found clue after new goal', () => {
  let tracker = new GoalTracker(
    {lat: 49.100, lng: 128},
    stepSize).setGoal({lat: 49.000, lng: 128});

  tracker.updatePosition({lat: 49.001, lng: 128});
  tracker.setGoal({lat:49.100, lng:128});
  tracker.updatePosition({lat: 49.004, lng: 128});
  expect(tracker.clue).toBe("Warmer");
});

it('chooses a goal within a ring around you', () => {
  for (let i = 0; i < 100; i++) {
    let tracker = new GoalTracker(
      {lat: 49.100, lng: 128},
      stepSize).chooseGoal(stepSize*100);

    expect(tracker.previousDistance).toBeGreaterThan(stepSize*49);
    expect(tracker.previousDistance).toBeLessThan(stepSize*101);
  }
});

it('warns when very far away', () => {
  let tracker = new GoalTracker(
    {lat: 49.100, lng: 128},
    stepSize).setGoal({lat: 49.000, lng: 128});

  tracker.updatePosition({lat: 49.105, lng: 128});
  expect(tracker.clue).toBe("11689m away");
  expect(tracker.clueProgress).toBe(0);
});
