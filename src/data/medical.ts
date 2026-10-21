/**
 * Shared data for the medical categories (Hospitals & clinics, Doctors): specialities, compliance rules,
 * the wording the engine refuses to publish, and health awareness days.
 */

export const specialities = [
  { id: "general", label: "General medicine" },
  { id: "paediatrics", label: "Paediatrics" },
  { id: "gynaecology", label: "Gynaecology & obstetrics" },
  { id: "orthopaedics", label: "Orthopaedics" },
  { id: "cardiology", label: "Cardiology" },
  { id: "diabetes", label: "Diabetes & endocrinology" },
  { id: "dermatology", label: "Dermatology" },
  { id: "ent", label: "ENT" },
  { id: "eye", label: "Eye care" },
  { id: "dental", label: "Dentistry" },
  { id: "gastro", label: "Gastroenterology" },
  { id: "neuro", label: "Neurology" },
  { id: "psychiatry", label: "Psychiatry & mental health" },
  { id: "pulmonology", label: "Chest & pulmonology" },
  { id: "kidney", label: "Nephrology & urology" },
  { id: "oncology", label: "Oncology" },
  { id: "physio", label: "Physiotherapy & rehabilitation" },
  { id: "surgery", label: "General surgery" },
] as const;

export type SpecialityId = (typeof specialities)[number]["id"];

export const specialityLabel = (id: string) => specialities.find((s) => s.id === id)?.label ?? "General medicine";

/** Shown in every emergency-related item. */
export const EMERGENCY_LINE = "In an emergency, call 112 (or 108 for an ambulance) or go to the nearest emergency department — do not wait for a reply here.";

/**
 * Wording the engine never publishes for medical categories: cure or guaranteed-result claims, superlatives
 * and comparisons, offer-led promotion, before/after framing and fear-based language.
 */
export const MEDICAL_BANNED_WORDING =
  /\b(cures?|cured|curing|guarantee[sd]?|best|no\.?\s?1|number one|top doctor|painless|permanent(ly)?|miracle|risk[- ]free|cheapest|lowest price|discounts?|offers?|free|deadly|killer|fatal|scary|before[- ]and[- ]after)\b|100\s?%|% off|before\/after/i;

/** Compliance rules every medical plan carries (shown in the plan and on the industry pages). */
export const medicalRules = [
  "No claims of a cure, guaranteed results, “best” or comparisons with other doctors or hospitals.",
  "No patient identity, case photos, testimonials or before-and-after images without the patient's written consent (and a guardian's for minors).",
  "No fake, paid or scripted reviews — we only ask genuine patients to share honest feedback.",
  "No discount-, offer- or package-led medical promotion.",
  "Qualifications, registrations and accreditations appear exactly as the client provides them — we never write them ourselves.",
  "Medical facts come only from the doctor: Oryza drafts, the doctor approves before anything is published.",
  "Anything about emergencies tells people to call 112 (or 108 for an ambulance) or go to the nearest emergency department.",
  "No fear-based messaging — calm, practical information only.",
];

/** Note attached to every item that carries medical information. */
export const DOCTOR_APPROVES = "Medical facts from the doctor; the doctor approves before publishing.";

export interface HealthDay {
  id: string;
  /** MM-DD (fixed date every year). */
  md: string;
  name: string;
  /** Specialities it is relevant to ("all" = every practice). */
  specialities: (SpecialityId | "all")[];
}

/** Fixed-date health awareness days (same date every year). */
export const healthDays: HealthDay[] = [
  { id: "cancer", md: "02-04", name: "World Cancer Day", specialities: ["oncology", "general"] },
  { id: "hearing", md: "03-03", name: "World Hearing Day", specialities: ["ent"] },
  { id: "women", md: "03-08", name: "International Women's Day", specialities: ["gynaecology"] },
  { id: "oral", md: "03-20", name: "World Oral Health Day", specialities: ["dental"] },
  { id: "tb", md: "03-24", name: "World Tuberculosis Day", specialities: ["pulmonology", "general"] },
  { id: "autism", md: "04-02", name: "World Autism Awareness Day", specialities: ["paediatrics", "psychiatry", "neuro"] },
  { id: "health", md: "04-07", name: "World Health Day", specialities: ["all"] },
  { id: "haemophilia", md: "04-17", name: "World Haemophilia Day", specialities: ["general", "paediatrics"] },
  { id: "malaria", md: "04-25", name: "World Malaria Day", specialities: ["general", "paediatrics"] },
  { id: "handhygiene", md: "05-05", name: "World Hand Hygiene Day", specialities: ["all"] },
  { id: "nurses", md: "05-12", name: "International Nurses Day", specialities: ["all"] },
  { id: "hypertension", md: "05-17", name: "World Hypertension Day", specialities: ["cardiology", "general", "kidney"] },
  { id: "thyroid", md: "05-25", name: "World Thyroid Day", specialities: ["diabetes"] },
  { id: "notobacco", md: "05-31", name: "World No Tobacco Day", specialities: ["pulmonology", "oncology", "dental", "cardiology", "general"] },
  { id: "blooddonor", md: "06-14", name: "World Blood Donor Day", specialities: ["all"] },
  { id: "yoga", md: "06-21", name: "International Day of Yoga", specialities: ["physio", "general"] },
  { id: "doctors", md: "07-01", name: "National Doctors' Day", specialities: ["all"] },
  { id: "hepatitis", md: "07-28", name: "World Hepatitis Day", specialities: ["gastro", "general"] },
  { id: "breastfeeding", md: "08-01", name: "World Breastfeeding Week", specialities: ["gynaecology", "paediatrics"] },
  { id: "nutrition", md: "09-01", name: "National Nutrition Week", specialities: ["general", "paediatrics", "diabetes", "gynaecology"] },
  { id: "alzheimers", md: "09-21", name: "World Alzheimer's Day", specialities: ["neuro", "psychiatry"] },
  { id: "rabies", md: "09-28", name: "World Rabies Day", specialities: ["general", "paediatrics"] },
  { id: "heart", md: "09-29", name: "World Heart Day", specialities: ["cardiology", "general"] },
  { id: "mentalhealth", md: "10-10", name: "World Mental Health Day", specialities: ["psychiatry", "neuro", "general"] },
  { id: "arthritis", md: "10-12", name: "World Arthritis Day", specialities: ["orthopaedics", "physio"] },
  { id: "osteoporosis", md: "10-20", name: "World Osteoporosis Day", specialities: ["orthopaedics", "gynaecology"] },
  { id: "polio", md: "10-24", name: "World Polio Day", specialities: ["paediatrics"] },
  { id: "pneumonia", md: "11-12", name: "World Pneumonia Day", specialities: ["pulmonology", "paediatrics"] },
  { id: "diabetes", md: "11-14", name: "World Diabetes Day", specialities: ["diabetes", "general"] },
  { id: "prematurity", md: "11-17", name: "World Prematurity Day", specialities: ["paediatrics", "gynaecology"] },
  { id: "aids", md: "12-01", name: "World AIDS Day", specialities: ["general"] },
];

/** Awareness days whose date changes every year: never auto-pinned — verify the date yearly, then add it. */
export const healthDaysVarying = [
  { name: "World Leprosy Day", rule: "Last Sunday of January" },
  { name: "World Kidney Day", rule: "Second Thursday of March" },
  { name: "World Glaucoma Week", rule: "A week in March, announced each year" },
  { name: "World Asthma Day", rule: "First Tuesday of May" },
  { name: "World Sight Day", rule: "Second Thursday of October" },
];

/** Health days relevant to a practice's specialities. */
export const healthDaysFor = (selected: string[]) =>
  healthDays.filter((d) => d.specialities.includes("all") || d.specialities.some((s) => selected.includes(s)) || (!selected.length && d.specialities.includes("general")));

/** Seasonal health themes for months 2–3 (North India). */
export const medicalSeasonThemes: Record<number, string[]> = {
  1: ["Winter care: colds, chest health and joint stiffness", "New-year health check-up reminders"],
  2: ["Exam-season wellbeing for students and parents", "Preventive check-ups"],
  3: ["Change of season: allergies and hydration", "Women's health month content"],
  4: ["Heat ahead: hydration and heat-illness prevention", "World Health Day"],
  5: ["Peak summer: heat-illness signs and when to see a doctor", "Nurses' appreciation"],
  6: ["Summer holidays: children's health tips", "Yoga and movement"],
  7: ["Monsoon: water- and mosquito-borne illness prevention", "Doctors' Day"],
  8: ["Monsoon care continued", "Breastfeeding week"],
  9: ["Nutrition week", "Heart health"],
  10: ["Mental health awareness", "Festive-season health tips"],
  11: ["Air quality and chest health", "Diabetes awareness"],
  12: ["Winter care for the elderly", "Year-end preventive check-ups"],
};

const ON_CAMERA_SHOT = /^(new |lead )?(doctor|nursing head)\b/i;

/** Templates whose shot list puts a doctor on camera are blocked when the doctors stay off camera. */
export const withCameraRule = <T extends { shots?: string[]; blockedBy?: string[] }>(t: T): T =>
  t.shots?.some((s) => ON_CAMERA_SHOT.test(s)) && !t.blockedBy?.includes("cam:none") ? { ...t, blockedBy: [...(t.blockedBy ?? []), "cam:none"] } : t;
