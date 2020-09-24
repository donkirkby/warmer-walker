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
  previousDistance: number;  // from previous position to goal
  clueProgress: number; // fraction of distance to next clue
  isFound: boolean;

  constructor(
    currentPosition: GeolibInputCoordinates,
    goalRadius: number) {

    this.goalPosition = this.previousPosition = this.currentPosition = currentPosition;
    this.goalRadius = goalRadius;
    this.isFound = true;
    this.previousDistance = this.clueProgress = 0.0;
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
    if (this.isFound) {
      return Clue.None;
    }
    let distanceToGoal = getDistance(position, this.goalPosition),
        distanceChange = distanceToGoal - this.previousDistance,
        distanceFromPrevious = getDistance(this.previousPosition, position);
    if (distanceToGoal < this.goalRadius) {
      this.isFound = true;
      this.clueProgress = 0;
      this.previousPosition = position;
      this.previousDistance = distanceToGoal;
      return Clue.Found;
    }
    if (distanceFromPrevious < this.goalRadius) {
      // Change is too small, so no clue given.
      this.clueProgress = distanceFromPrevious / this.goalRadius;
      return Clue.None;
    }
    this.previousPosition = position;
    this.previousDistance = distanceToGoal;
    this.clueProgress = 0;
    return (distanceChange < 0) ? Clue.Warmer : Clue.Colder;
  }
}

export default GoalTracker;
export { Clue };
export type { GeolibInputCoordinates };
