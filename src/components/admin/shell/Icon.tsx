import type { IconName } from "./nav";

/* Admin-only line icons (24px grid, 1.7 stroke). Kept apart from the public icon set so no public chunk changes. */
const P: Record<IconName, string> = {
  today: "M4 7h16M4 12h10M4 17h7M18 13a3 3 0 1 1 0 6 3 3 0 0 1 0-6z",
  calendar: "M5.5 5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3.5 10h17M8 3v4M16 3v4",
  clients: "M9 4.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M19 14.8c1.4.9 2.3 2.6 2.5 5.2",
  shoots: "M5 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM12 10a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM8.5 7l1.5-3h4l1.5 3",
  team: "M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 21c1-4.5 4.2-7 8-7s7 2.5 8 7",
  leads: "M4 6h16v12H4zM4 7l8 6 8-6",
  reports: "M5 20V10M12 20V4M19 20v-7",
  images: "M5.5 4.5h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2zM9 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM20.5 16l-5-5-9 8.5",
  payments: "M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM3 10h18M7 15h4",
  settings: "M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1",
  users: "M9 4a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM2.5 20c.8-3.5 3.4-5.5 6.5-5.5 1.4 0 2.6.3 3.7 1M16.5 14v6M13.5 17h6",
  activity: "M3 12h4l3-8 4 16 3-8h4",
  account: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 7.5a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM6.5 18.5c1.2-2 3.2-3 5.5-3s4.3 1 5.5 3",
  search: "M11 4.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM16 16l4.5 4.5",
  bell: "M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0",
  plus: "M12 5v14M5 12h14",
  more: "M5 10.4a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2zM12 10.4a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2zM19 10.4a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2z",
  close: "M6 6l12 12M18 6L6 18",
  menu: "M4 7h16M4 12h16M4 17h16",
  chevron: "M9 6l6 6-6 6",
  left: "M15 6l-6 6 6 6",
  check: "M5 12.5l4.5 4.5L19 7",
  upload: "M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
  note: "M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5",
  logout: "M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10",
  external: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  keyboard: "M4 7h16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM7 10h.01M11 10h.01M15 10h.01M7 14h10",
  board: "M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v13h-4z",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
};

export function Icon({ name, size = 18, label, className = "" }: { name: IconName; size?: number; label?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={`shrink-0 ${className}`}>
      {label && <title>{label}</title>}
      <path d={P[name]} />
    </svg>
  );
}
