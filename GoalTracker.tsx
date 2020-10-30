import { computeDestinationPoint, getDistance } from 'geolib';
import type { GeolibInputCoordinates } from 'geolib/es/types'


enum GoalEmojis {
  NONE = "",
  START = "🔎",
  FAR = "🔭",
  WARMER = "🔥",
  COLDER = "🧊",
  FOUND = "🎉"
}


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
  isTooFar: boolean;
  imageUrl?: string;
  emoji: string;
  sound: string;

  constructor(
    currentPosition: GeolibInputCoordinates,
    goalRadius: number) {

    this.goalPosition = this.previousPosition = this.currentPosition = currentPosition;
    this.goalRadius = goalRadius;
    this.isFound = true;
    this.isTooFar = false;
    this.clue = "";
    this.emoji = this.sound = GoalEmojis.NONE;
    this.previousDistance = this.maxDistance = this.clueProgress = 0;
  }

  setGoal(goalPosition: GeolibInputCoordinates): GoalTracker {
    this.goalPosition = goalPosition;
    this.previousDistance = getDistance(
      this.previousPosition,
      this.goalPosition);
    this.maxDistance = this.previousDistance + 2*this.goalRadius;
    this.isFound = false;
    this.isTooFar = false;
    this.clue = "";
    this.emoji = GoalEmojis.START;
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
    this.sound = GoalEmojis.NONE;
    if (this.isFound || distanceToGoal < this.goalRadius) {
      this.isFound = true;
      this.clueProgress = 0;
      this.previousPosition = position;
      this.previousDistance = distanceToGoal;
      this.clue = `Found ${Math.round(distanceToGoal)}m away`;
      this.sound = this.emoji = GoalEmojis.FOUND;
      return;
    }
    if (this.maxDistance < distanceToGoal) {
      this.isTooFar = true;
      this.clue = `${Math.round(distanceToGoal)}m away`;
      this.emoji = GoalEmojis.FAR;
      this.restartClue(position, distanceToGoal);
      return;
    }
    if (this.isTooFar) {
      this.isTooFar = false;
      this.clue = "";
      this.emoji = GoalEmojis.START;
      this.restartClue(position, distanceToGoal);
      return;
    }
    if (distanceFromPrevious < this.goalRadius) {
      // Change is too small, so no clue given.
      this.clueProgress = distanceFromPrevious / this.goalRadius;
      return;
    }
    if (distanceChange < 0) {
      this.clue = "Warmer";
      this.sound = this.emoji = GoalEmojis.WARMER;
    }
    else {
      this.clue = "Colder";
      this.sound = this.emoji = GoalEmojis.COLDER;
    }
    this.restartClue(position, distanceToGoal);
  }

  restartClue(position: GeolibInputCoordinates, distanceToGoal: number) {
    this.previousPosition = position;
    this.previousDistance = distanceToGoal;
    this.clueProgress = 0;
  }
}

export default GoalTracker;
export { GoalEmojis };
export type { GeolibInputCoordinates };
