// Batch 2 (Nov 2026): expands every topic to ~30 prompts and adds General Movies.
// These appear in dailies from Daily #2 onwards, so Daily #1 stays exactly as it was played.
import { fromDaily } from "../../types";
import automobiles from "./automobiles";
import globalCuisine from "./global-cuisine";
import geography from "./geography";
import history from "./history";
import currentAffairs from "./current-affairs";
import generalTrivia from "./general-trivia";
import indianGeography from "./indian-geography";
import indianMovies from "./indian-movies";
import indianCuisine from "./indian-cuisine";
import indianHistoryPolitics from "./indian-history-politics";
import indianTrivia from "./indian-trivia";
import generalMovies from "./general-movies";

export default fromDaily(2, [
  ...automobiles, ...globalCuisine, ...geography, ...history, ...currentAffairs, ...generalTrivia,
  ...indianGeography, ...indianMovies, ...indianCuisine, ...indianHistoryPolitics, ...indianTrivia, ...generalMovies,
]);
