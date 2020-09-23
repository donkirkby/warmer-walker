import { computeDestinationPoint, getDistance } from 'geolib';
import type { GeolibInputCoordinates } from 'geolib/es/types'

enum Clue {
  None,
  Warmer,
  Colder,
  Found
}


class GoalTracker {
  currentPosition: GeolibInputCoordinates;
  goalRadius: number;
  goalPosition: GeolibInputCoordinates;
  previousPosition: GeolibInputCoordinates;
  previousDistance: number;
  isFound: boolean;

  constructor(
    currentPosition: GeolibInputCoordinates,
    goalRadius: number) {

    this.goalPosition = this.previousPosition = this.currentPosition = currentPosition;
    this.goalRadius = goalRadius;
    this.isFound = true;
    this.previousDistance = 0;
  }

  setGoal(goalPosition: GeolibInputCoordinates): GoalTracker {
    this.goalPosition = goalPosition;
    this.previousDistance = getDistance(
      this.previousPosition,
      this.goalPosition);
    this.isFound = false;
    return this;
  }

  chooseGoal(maxDistance: number): GoalTracker {
    let bearing = Math.random() * 360,
      goalDistance = (0.5 + Math.random()/2) * maxDistance,
      goalPosition = computeDestinationPoint(this.currentPosition, goalDistance, bearing);
    return this.setGoal(goalPosition);
  }

  updatePosition(position: GeolibInputCoordinates): Clue {
    let distanceToGoal = getDistance(position, this.goalPosition),
        distanceChange = distanceToGoal - this.previousDistance;
    if (this.isFound || distanceToGoal < this.goalRadius) {
      this.isFound = true;
      return Clue.Found;
    }
    if (Math.abs(distanceChange) < this.goalRadius) {
      // Change is too small, so no clue given.
      return Clue.None;
    }
    this.previousPosition = position;
    this.previousDistance = distanceToGoal;
    return (distanceChange < 0) ? Clue.Warmer : Clue.Colder;
  }
}

export default GoalTracker;
export { Clue };
export type { GeolibInputCoordinates };
