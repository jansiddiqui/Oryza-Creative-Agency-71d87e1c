import { ACCENT, icon, type IconComponent } from "./Icon";
import { ApprovalIcon, CalendarIcon, CameraIcon, ClipboardIcon, ReportIcon, SendIcon, SlidersIcon } from "./ui";

export const StrategyIcon = icon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M15.5 8.5l-2 5-5 2 2-5z" stroke={ACCENT} />
  </>,
);

export const ContentIcon = icon(
  <>
    <path d="M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20z" />
    <path d="M14 7l3 3" stroke={ACCENT} />
  </>,
);

export const ReelIcon = icon(
  <>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 3v18M16 3v18" />
    <path d="M4 7.5h4M4 12h4M4 16.5h4M16 7.5h4M16 12h4M16 16.5h4" stroke={ACCENT} />
  </>,
);

export const CommunityIcon = icon(
  <>
    <path d="M14.5 9a5.5 5.5 0 1 0-9.9 3.3L4 15l2.8-.7A5.5 5.5 0 0 0 14.5 9z" />
    <path d="M10 17a5.5 5.5 0 0 0 7.2 1.3L20 19l-.6-2.7a5.5 5.5 0 0 0-2.9-6.7" stroke={ACCENT} />
  </>,
);

export const OptimizeIcon = icon(
  <>
    <circle cx="10" cy="8" r="3.5" />
    <path d="M3.5 20a6.5 6.5 0 0 1 11-4.7" />
    <path d="M16 17.5l1.8 1.8L21 16" stroke={ACCENT} />
  </>,
);

export type ServiceId = "strategy" | "content" | "reels" | "posting" | "community" | "reporting" | "optimization";

export const serviceIcons: Record<ServiceId, IconComponent> = {
  strategy: StrategyIcon,
  content: ContentIcon,
  reels: ReelIcon,
  posting: SendIcon,
  community: CommunityIcon,
  reporting: ReportIcon,
  optimization: OptimizeIcon,
};

export type ProcessStepId = "questions" | "plan" | "setup" | "shoot" | "approval" | "publish" | "report";

export const processIcons: Record<ProcessStepId, IconComponent> = {
  questions: ClipboardIcon,
  plan: CalendarIcon,
  setup: SlidersIcon,
  shoot: CameraIcon,
  approval: ApprovalIcon,
  publish: SendIcon,
  report: ReportIcon,
};
