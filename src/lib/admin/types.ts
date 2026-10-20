export type AdminRole = "owner" | "editor";

export interface Admin {
  email: string;
  role: AdminRole;
}

export type AuditAction =
  | "image.upload"
  | "image.approve"
  | "image.replace"
  | "image.rollback"
  | "image.remove"
  | "image.delete"
  | "image.focal"
  | "lead.update"
  | "user.add"
  | "user.update";

export type LeadStatus = "new" | "contacted" | "converted" | "not_fit";

export const LEAD_STATUSES: { id: LeadStatus; label: string }[] = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "converted", label: "Converted" },
  { id: "not_fit", label: "Not a fit" },
];
