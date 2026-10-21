/** Oryza Plan Engine — Restaurants & cafés (also cloud kitchens, sweet shops, bakeries, dhabas), on the shared core. */
import { generatePlan } from "./core";
import { restaurantConfig, type Dish, type RestaurantAnswers } from "./categories/restaurant";
import type { Plan } from "./types";

export type { Dish, RestaurantAnswers };

export const generateRestaurantPlan = (a: RestaurantAnswers): Plan => generatePlan(restaurantConfig, a);
