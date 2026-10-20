import { ACCENT, icon, type IconComponent, type IconProps } from "./Icon";

export const SchoolIcon = icon(
  <>
    <path d="M2.5 9L12 4.5 21.5 9 12 13.5z" />
    <path d="M6.5 11v4.5c1.5 1.5 3.5 2.2 5.5 2.2s4-.7 5.5-2.2V11" />
    <path d="M21.5 9v5" stroke={ACCENT} />
  </>,
);

export const HospitalIcon = icon(
  <>
    <rect x="4" y="4" width="16" height="17" rx="2" />
    <path d="M10 21v-3h4v3" />
    <path d="M12 8v6M9 11h6" stroke={ACCENT} />
  </>,
);

export const DoctorIcon = icon(
  <>
    <path d="M6 3.5v5a4 4 0 0 0 8 0v-5M5 3.5h2M13 3.5h2" />
    <path d="M10 12.5V15a5 5 0 0 0 10 0v-1.5" />
    <circle cx="20" cy="11.5" r="2" stroke={ACCENT} />
  </>,
);

export const RealEstateIcon = icon(
  <>
    <path d="M3.5 11L12 4l8.5 7M5.5 9.5V20h13V9.5" />
    <path d="M10 20v-5h4v5" stroke={ACCENT} />
  </>,
);

export const LeaderIcon = icon(
  <>
    <path d="M4 10v4a1 1 0 0 0 1 1h2l8 4V5L7 9H5a1 1 0 0 0-1 1zM7 15l1 4.5" />
    <path d="M18.5 9.5a3.5 3.5 0 0 1 0 5" stroke={ACCENT} />
  </>,
);

export const RestaurantIcon = icon(
  <>
    <path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M3.5 21h13" />
    <path d="M8 3.5c-.8 1 .8 2 0 3M12 3.5c-.8 1 .8 2 0 3" stroke={ACCENT} />
  </>,
);

export const CoachingIcon = icon(
  <>
    <path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z" />
    <path d="M12 6.5v13" stroke={ACCENT} />
  </>,
);

export const RetailIcon = icon(
  <>
    <path d="M5 8h14l-1 12.5H6z" />
    <path d="M9 10.5V7a3 3 0 0 1 6 0v3.5" stroke={ACCENT} />
  </>,
);

export const GymSalonIcon = icon(
  <>
    <path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5" />
    <path d="M6.5 12h11" stroke={ACCENT} />
  </>,
);

export const FactoryIcon = icon(
  <>
    <path d="M3 20.5V10l5 3v-3l5 3v-3l5 3V5h3v15.5z" />
    <path d="M7 17h2M11.5 17h2M16 17h2" stroke={ACCENT} />
  </>,
);

export const ProfessionalIcon = icon(
  <>
    <rect x="3" y="7" width="18" height="13" rx="2.5" />
    <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
    <path d="M3 12.5h18" stroke={ACCENT} />
  </>,
);

export const CreatorIcon = icon(
  <>
    <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
    <path d="M10.5 18.5h3" />
    <circle cx="12" cy="11" r="3" stroke={ACCENT} />
  </>,
);

export const GemIcon = icon(
  <>
    <path d="M6.5 4h11L21 9l-9 11L3 9zM3 9h18" />
    <path d="M9.5 4L8 9l4 11 4-11-1.5-5" stroke={ACCENT} />
  </>,
);

/** One icon per industry category slug (see src/data/categories.ts). */
export const industryIcons: Record<string, IconComponent> = {
  schools: SchoolIcon,
  "hospitals-clinics": HospitalIcon,
  doctors: DoctorIcon,
  "real-estate": RealEstateIcon,
  "political-leaders": LeaderIcon,
  "restaurants-cafes": RestaurantIcon,
  "coaching-institutes": CoachingIcon,
  "retail-showrooms": RetailIcon,
  "gyms-salons": GymSalonIcon,
  "b2b-manufacturers": FactoryIcon,
  professionals: ProfessionalIcon,
  creators: CreatorIcon,
  "interiors-fashion-jewellery": GemIcon,
};

/** Icon for an industry slug (falls back to the briefcase). */
export function IndustryIcon({ slug, ...props }: { slug: string } & IconProps) {
  const Icon = industryIcons[slug] ?? ProfessionalIcon;
  return <Icon {...props} />;
}
