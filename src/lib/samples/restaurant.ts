import { generateRestaurantPlan } from "../engine/restaurant-engine";

/**
 * A fictional restaurant — always labelled “sample”, never presented as client work. The FSSAI number is not
 * shown because none was provided; no offer or special is invented.
 */
export const sampleRestaurantPlan = generateRestaurantPlan({
  name: "Sample Rasoi",
  city: "Kanpur",
  type: "restaurant",
  goals: ["footfall", "orders"],
  stage: "revive",
  consent: "no",
  shoot: "2",
  pkg: "growth",
  platforms: ["instagram", "facebook", "whatsapp", "gbp", "youtube"],
  optimize: ["instagram", "gbp"],
  startDate: "2026-10-26",
  events: [{ kind: "menu", date: "2026-11-06", label: "Winter menu launch" }],
  cuisine: "North Indian",
  food: "both",
  dishes: [
    { name: "Dal makhani", mark: "veg", allergens: "" },
    { name: "Paneer tikka", mark: "veg", allergens: "" },
    { name: "Chicken biryani", mark: "nonveg", allergens: "" },
  ],
  timings: "Daily, 11 am – 11 pm",
  service: ["dinein", "delivery"],
  deliveryApps: "delivery apps",
  whatsappOrder: "",
  party: "yes",
  catering: "no",
  fssai: "",
  showFssai: "no",
  price: "",
  special: "",
  allergenNotes: "no",
  kitchen: "yes",
  onCamera: "some",
});
