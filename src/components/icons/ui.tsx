import { ACCENT, icon } from "./Icon";

export const ArrowRightIcon = icon(<path d="M5 12h14M13 6l6 6-6 6" />);

export const CheckIcon = icon(<path d="M5 12.5l4.5 4.5L19 7" stroke={ACCENT} />);

export const CalendarIcon = icon(
  <>
    <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
    <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
    <rect x="7" y="13" width="3" height="3" rx="0.5" stroke={ACCENT} />
  </>,
);

export const CameraIcon = icon(
  <>
    <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h2L9 4h6l1.5 2h2A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" />
    <circle cx="12" cy="13" r="3.5" stroke={ACCENT} />
  </>,
);

export const ApprovalIcon = icon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5l2.7 2.7L16 9.5" stroke={ACCENT} />
  </>,
);

export const ReportIcon = icon(
  <>
    <path d="M4 20h16M7 16v-4M17 16v-7" />
    <path d="M12 16V7" stroke={ACCENT} />
  </>,
);

export const ShootIcon = icon(
  <>
    <rect x="3" y="10" width="18" height="10" rx="2" />
    <path d="M3.6 10l15.7-4.2" />
    <path d="M7.5 8.9l1.6-2.9M12 7.7l1.6-2.9M16.5 6.5l1.6-2.9" stroke={ACCENT} />
  </>,
);

export const ChatIcon = icon(
  <>
    <path d="M20 11.5a7.5 7.5 0 0 1-11.1 6.6L4 19.5l1.4-4.6A7.5 7.5 0 1 1 20 11.5z" />
    <path d="M9 11.5h.01M12.5 11.5h.01M16 11.5h.01" strokeWidth={2.2} stroke={ACCENT} />
  </>,
);

export const PhoneIcon = icon(
  <path d="M5 4h3l1.5 4-2 1.5a11 11 0 0 0 7 7l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
);

export const MailIcon = icon(
  <>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M4 7l8 6 8-6" stroke={ACCENT} />
  </>,
);

export const PinIcon = icon(
  <>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.3" stroke={ACCENT} />
  </>,
);

export const ClockIcon = icon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3 2" stroke={ACCENT} />
  </>,
);

export const SendIcon = icon(
  <>
    <path d="M21 3l-6.5 18-4-7.5L3 9.5z" />
    <path d="M21 3L10.5 13.5" stroke={ACCENT} />
  </>,
);

export const ClipboardIcon = icon(
  <>
    <path d="M9 4.5H7.5A2.5 2.5 0 0 0 5 7v11.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V7a2.5 2.5 0 0 0-2.5-2.5H15" />
    <rect x="9" y="3" width="6" height="3" rx="1" />
    <path d="M9 11h6M9 15h4" stroke={ACCENT} />
  </>,
);

export const SlidersIcon = icon(
  <>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" stroke={ACCENT} />
    <circle cx="9" cy="17" r="2" stroke={ACCENT} />
  </>,
);
