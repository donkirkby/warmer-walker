import { computeDestinationPoint, getDistance } from 'geolib';
import type { GeolibInputCoordinates } from 'geolib/es/types'


class GoalTracker {
  currentPosition: GeolibInputCoordinates;
  goalRadius: number;
  goalPosition: GeolibInputCoordinates;
  previousPosition: GeolibInputCoordinates;
  previousDistance: number;  // from previous position to goal
  maxDistance: number; // to goal, before displaying distance
  clue: string;
  clueProgress: number; // fraction of distance to next clue
  isFound: boolean;

  constructor(
    currentPosition: GeolibInputCoordinates,
    goalRadius: number) {

    this.goalPosition = this.previousPosition = this.currentPosition = currentPosition;
    this.goalRadius = goalRadius;
    this.isFound = true;
    this.clue = "";
    this.previousDistance = this.maxDistance = this.clueProgress = 0;
  }

  setGoal(goalPosition: GeolibInputCoordinates): GoalTracker {
    this.goalPosition = goalPosition;
    this.previousDistance = getDistance(
      this.previousPosition,
      this.goalPosition);
    this.maxDistance = this.previousDistance + 2*this.goalRadius;
    this.isFound = false;
    return this;
  }

  chooseGoal(maxDistance: number): GoalTracker {
    let bearing = Math.random() * 360,
      goalDistance = (0.5 + Math.random()/2) * maxDistance,
      goalPosition = computeDestinationPoint(this.currentPosition, goalDistance, bearing);
    return this.setGoal(goalPosition);
  }

  updatePosition(position: GeolibInputCoordinates) {
    let distanceToGoal = getDistance(position, this.goalPosition),
        distanceChange = distanceToGoal - this.previousDistance,
        distanceFromPrevious = getDistance(this.previousPosition, position);
    if (this.isFound || distanceToGoal < this.goalRadius) {
      this.isFound = true;
      this.clueProgress = 0;
      this.previousPosition = position;
      this.previousDistance = distanceToGoal;
      this.clue = `Found ${Math.round(distanceToGoal)}m away`;
      return;
    }
    if (this.maxDistance < distanceToGoal) {
      this.clueProgress = 0;
      this.previousPosition = position;
      this.previousDistance = distanceToGoal;
      this.clue = `${Math.round(distanceToGoal)}m away`;
      return;
    }
    if (distanceFromPrevious < this.goalRadius) {
      // Change is too small, so no clue given.
      this.clueProgress = distanceFromPrevious / this.goalRadius;
      return;
    }
    this.previousPosition = position;
    this.previousDistance = distanceToGoal;
    this.clueProgress = 0;
    this.clue = (distanceChange < 0) ? "Warmer" : "Colder";
  }
}

export default GoalTracker;
export type { GeolibInputCoordinates };
