/** Oryza Plan Engine — Hospitals & clinics and Doctors (personal brand), on the shared core. */
import { generatePlan } from "./core";
import { doctorConfig, hospitalConfig, type DoctorAnswers, type HospitalAnswers } from "./categories/medical";
import type { Plan } from "./types";

export type { DoctorAnswers, HospitalAnswers };

export const generateHospitalPlan = (a: HospitalAnswers): Plan => generatePlan(hospitalConfig, a);
export const generateDoctorPlan = (a: DoctorAnswers): Plan => generatePlan(doctorConfig, a);
