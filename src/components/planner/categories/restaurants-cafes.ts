/** Planner questions for restaurants & cafés (also cloud kitchens, sweet shops, bakeries, dhabas). */
import { restaurantOptions } from "@/data/playbooks/restaurant";
import { generateRestaurantPlan, type RestaurantAnswers } from "@/lib/engine/restaurant-engine";
import { cameraQ, consent3, corePlatforms, optimizeQ, packageStep, platformsQ, shootOptions, stageQ, withDates, yesNo } from "../questions";
import type { PlannerConfig } from "../questions";

const emptyDish = { name: "", mark: "veg", allergens: "" };

export const config: PlannerConfig = {
  slug: "restaurants-cafes",
  label: "Restaurants & cafés",
  nameKey: "name",
  initial: {
    name: "", city: "Kanpur", type: "restaurant", goals: ["footfall"], cuisine: "", food: "both", dishes: [{ ...emptyDish }],
    timings: "", service: ["dinein", "delivery"], deliveryApps: "", whatsappOrder: "", party: "no", catering: "no",
    fssai: "", showFssai: "yes", price: "", special: "", allergenNotes: "no", kitchen: "yes", onCamera: "some", events: [],
    stage: "revive", consent: "no", shoot: "2", pkg: "growth", platforms: corePlatforms("restaurants-cafes"), optimize: [],
  },
  steps: [
    {
      id: "basics",
      title: "About your place",
      questions: [
        { kind: "text", key: "name", label: "Name of the restaurant, café or shop", required: true, half: true },
        { kind: "text", key: "city", label: "City", half: true },
        { kind: "choice", key: "type", label: "Type", name: "Type", options: restaurantOptions.types },
        { kind: "text", key: "cuisine", label: "Cuisine", placeholder: "e.g. North Indian, Chinese, café menu" },
        { kind: "choice", key: "food", label: "Veg or non-veg?", name: "Food", options: restaurantOptions.food },
        { kind: "multi", key: "goals", label: "What do you want in the next 3 months?", hint: "Pick one or more. The first one you pick is your main goal.", options: restaurantOptions.goals, star: true },
      ],
    },
    {
      id: "menu",
      title: "Signature dishes and menu",
      questions: [
        {
          kind: "group", key: "dishes", label: "Signature dishes", itemLabel: "Dish", max: 6, empty: emptyDish,
          hint: "Names and veg / non-veg / egg marks exactly as on your menu. Each dish is featured at most twice a month.",
          fields: [
            { key: "name", label: "Dish name", type: "text", wide: true },
            { key: "mark", label: "Mark on your menu", type: "choice", options: restaurantOptions.marks },
            { key: "allergens", label: "Allergens (optional)", type: "text", placeholder: "e.g. dairy, nuts" },
          ],
        },
        { kind: "choice", key: "allergenNotes", label: "Show allergen notes on dish posts?", name: "Allergen notes", options: yesNo("Yes", "No") },
        { kind: "text", key: "price", label: "Price range (optional)", hint: "Exactly as you want it shown.", placeholder: "e.g. ₹300–₹600 for two" },
        { kind: "text", key: "fssai", label: "FSSAI licence number (optional)", hint: "Shown exactly as you type it." },
        { kind: "choice", key: "showFssai", label: "Show the FSSAI number on posts?", name: "Show FSSAI", options: yesNo("Yes", "No"), when: (a) => String(a.fssai ?? "").trim().length > 0 },
      ],
    },
    {
      id: "service",
      title: "Timings, ordering and bookings",
      questions: [
        { kind: "text", key: "timings", label: "Days and timings", placeholder: "e.g. Daily, 11 am – 11 pm" },
        { kind: "multi", key: "service", label: "How do customers get your food?", options: restaurantOptions.service },
        { kind: "text", key: "deliveryApps", label: "Delivery apps you are on", placeholder: "e.g. Zomato and Swiggy", when: (a) => ((a.service as string[]) ?? []).includes("delivery") },
        { kind: "text", key: "whatsappOrder", label: "WhatsApp number or link for orders", when: (a) => ((a.service as string[]) ?? []).includes("whatsapp") },
        { kind: "choice", key: "party", label: "Seating or space for parties?", name: "Party space", options: yesNo("Yes", "No") },
        { kind: "choice", key: "catering", label: "Do you do catering?", name: "Catering", options: yesNo("Yes", "No") },
      ],
    },
    {
      id: "events",
      title: "Launches, events and festive specials",
      questions: [
        { kind: "events", key: "events", label: "Launches and events in the next 60 days", hint: "Festivals whose date changes each year (Diwali, Holi, Eid) — add them only with a date you have verified.", options: restaurantOptions.events, defaultKind: "menu", withLabel: "Name (optional)" },
        { kind: "text", key: "special", label: "Festive special (optional)", hint: "Exactly as you want it shown, with any price. Leave empty and we only post greetings." },
      ],
    },
    {
      id: "presence",
      title: "Your profiles and access",
      questions: [
        stageQ,
        { kind: "choice", key: "kitchen", label: "Can we film the kitchen and staff?", name: "Kitchen filming", options: yesNo("Yes", "No") },
        cameraQ("Is the cook or owner comfortable on camera?"),
        consent3("Written consent from customers to appear?", "Without it, no customer faces or testimonials appear in the plan."),
        { kind: "choice", key: "shoot", label: "How much time can you give for shoots?", name: "Shoot", options: shootOptions("We'll send our own photos") },
        platformsQ("restaurants and cafés"),
        optimizeQ,
      ],
    },
    packageStep,
  ],
  generate: (raw, startDate) => {
    const a = raw as unknown as RestaurantAnswers;
    return generateRestaurantPlan({ ...withDates(a), dishes: a.dishes.filter((d) => d.name.trim()), startDate });
  },
};
