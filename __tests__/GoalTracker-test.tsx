import { getDistance } from 'geolib';
/**
 * @format
 */

import GoalTracker, {Clue} from '../GoalTracker';

let stepSize = getDistance({lat: 49.000, lng: 128}, {lat: 49.002, lng: 128});

it('gets colder after moving away', () => {
  let tracker = new GoalTracker(
    {lat: 49.100, lng: 128},
    stepSize).setGoal({lat: 49.000, lng: 128});

  let clue = tracker.updatePosition({lat: 49.103, lng: 128});
  expect(clue).toBe(Clue.Colder);
});

it('gets warmer after moving closer', () => {
  let tracker = new GoalTracker(
    {lat: 49.100, lng: 128},
    stepSize).setGoal({lat: 49.000, lng: 128});

  let clue = tracker.updatePosition({lat: 49.097, lng: 128});
  expect(clue).toBe(Clue.Warmer);
});

it('no clue within step circle', () => {
  let tracker = new GoalTracker(
    {lat: 49.100, lng: 128},
    stepSize).setGoal({lat: 49.000, lng: 128});

  let clue = tracker.updatePosition({lat: 49.099, lng: 128});
  expect(clue).toBe(Clue.None);
});

it('gives found clue', () => {
  let tracker = new GoalTracker(
    {lat: 49.100, lng: 128},
    stepSize).setGoal({lat: 49.000, lng: 128});

  let clue = tracker.updatePosition({lat: 49.001, lng: 128});
  expect(clue).toBe(Clue.Found);
});

it('no clue within second step circle', () => {
  let tracker = new GoalTracker(
    {lat: 49.100, lng: 128},
    stepSize).setGoal({lat: 49.000, lng: 128});

  tracker.updatePosition({lat: 49.097, lng: 128});
  let clue = tracker.updatePosition({lat: 49.096, lng: 128});
  expect(clue).toBe(Clue.None);
});

it('gives found clue forever after', () => {
  let tracker = new GoalTracker(
    {lat: 49.100, lng: 128},
    stepSize).setGoal({lat: 49.000, lng: 128});

  tracker.updatePosition({lat: 49.001, lng: 128});
  let clue = tracker.updatePosition({lat: 49.003, lng: 128});
  expect(clue).toBe(Clue.Found);
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
