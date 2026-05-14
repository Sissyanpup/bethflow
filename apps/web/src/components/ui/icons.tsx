import { type SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const icon = (paths: React.ReactNode, opts?: { viewBox?: string; fill?: boolean }) =>
  ({ size = 18, className, style, ...rest }: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={opts?.viewBox ?? '0 0 24 24'}
      fill={opts?.fill ? 'currentColor' : 'none'}
      stroke={opts?.fill ? 'none' : 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      {...rest}
    >
      {paths}
    </svg>
  );

export const IconDashboard = icon(<>
  <rect x="3" y="3" width="7" height="7" rx="1" />
  <rect x="14" y="3" width="7" height="7" rx="1" />
  <rect x="14" y="14" width="7" height="7" rx="1" />
  <rect x="3" y="14" width="7" height="7" rx="1" />
</>);

export const IconBoard = icon(<>
  <rect x="3" y="3" width="18" height="18" rx="2" />
  <path d="M9 3v18M3 9h6M3 15h6" />
</>);

export const IconCalendar = icon(<>
  <rect x="3" y="4" width="18" height="18" rx="2" />
  <path d="M16 2v4M8 2v4M3 10h18" />
</>);

export const IconGrid = icon(<>
  <rect x="3" y="3" width="7" height="7" rx="1" />
  <rect x="14" y="3" width="7" height="7" rx="1" />
  <rect x="14" y="14" width="7" height="7" rx="1" />
  <rect x="3" y="14" width="7" height="7" rx="1" />
</>);

export const IconLink = icon(<>
  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
</>);

export const IconUser = icon(<>
  <circle cx="12" cy="8" r="4" />
  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
</>);

export const IconUsers = icon(<>
  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
  <circle cx="9" cy="7" r="4" />
  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
</>);

export const IconShield = icon(<>
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
</>);

export const IconLogOut = icon(<>
  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
  <polyline points="16 17 21 12 16 7" />
  <line x1="21" y1="12" x2="9" y2="12" />
</>);

export const IconPlus = icon(<>
  <line x1="12" y1="5" x2="12" y2="19" />
  <line x1="5" y1="12" x2="19" y2="12" />
</>);

export const IconX = icon(<>
  <line x1="18" y1="6" x2="6" y2="18" />
  <line x1="6" y1="6" x2="18" y2="18" />
</>);

export const IconCheck = icon(<>
  <polyline points="20 6 9 17 4 12" />
</>);

export const IconChevronRight = icon(<>
  <polyline points="9 18 15 12 9 6" />
</>);

export const IconEye = icon(<>
  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
  <circle cx="12" cy="12" r="3" />
</>);

export const IconEyeOff = icon(<>
  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
  <line x1="1" y1="1" x2="23" y2="23" />
</>);

export const IconSearch = icon(<>
  <circle cx="11" cy="11" r="8" />
  <line x1="21" y1="21" x2="16.65" y2="16.65" />
</>);

export const IconStar = icon(<>
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
</>);

export const IconTrendingUp = icon(<>
  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
  <polyline points="17 6 23 6 23 12" />
</>);

export const IconKanban = icon(<>
  <rect x="3" y="3" width="5" height="14" rx="1" />
  <rect x="10" y="3" width="5" height="8" rx="1" />
  <rect x="17" y="3" width="5" height="11" rx="1" />
</>);

export const IconArrowRight = icon(<>
  <line x1="5" y1="12" x2="19" y2="12" />
  <polyline points="12 5 19 12 12 19" />
</>);

export const IconSparkle = icon(<>
  <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
</>, { fill: true });

export const IconZap = icon(<>
  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
</>);

export const IconGlobe = icon(<>
  <circle cx="12" cy="12" r="10" />
  <line x1="2" y1="12" x2="22" y2="12" />
  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
</>);

export const IconMail = icon(<>
  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
  <polyline points="22,6 12,13 2,6" />
</>);

export const IconSend = icon(<>
  <line x1="22" y1="2" x2="11" y2="13" />
  <polygon points="22 2 15 22 11 13 2 9 22 2" />
</>);

export const IconMenu = icon(<>
  <line x1="3" y1="12" x2="21" y2="12" />
  <line x1="3" y1="6" x2="21" y2="6" />
  <line x1="3" y1="18" x2="21" y2="18" />
</>);

export const IconGripVertical = icon(<>
  <circle cx="9" cy="5" r="1" fill="currentColor" stroke="none" />
  <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
  <circle cx="9" cy="19" r="1" fill="currentColor" stroke="none" />
  <circle cx="15" cy="5" r="1" fill="currentColor" stroke="none" />
  <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
  <circle cx="15" cy="19" r="1" fill="currentColor" stroke="none" />
</>);

export const IconTrash = icon(<>
  <polyline points="3 6 5 6 21 6" />
  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
</>);

export const IconPencil = icon(<>
  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
</>);

export const IconClock = icon(<>
  <circle cx="12" cy="12" r="10" />
  <polyline points="12 6 12 12 16 14" />
</>);

export const IconMoreHorizontal = icon(<>
  <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
  <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
  <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
</>);

export const IconChevronDown = icon(<>
  <polyline points="6 9 12 15 18 9" />
</>);

export const IconCheckCircle = icon(<>
  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
  <polyline points="22 4 12 14.01 9 11.01" />
</>);

export const IconAlertCircle = icon(<>
  <circle cx="12" cy="12" r="10" />
  <line x1="12" y1="8" x2="12" y2="12" />
  <line x1="12" y1="16" x2="12.01" y2="16" />
</>);

export const IconTarget = icon(<>
  <circle cx="12" cy="12" r="10" />
  <circle cx="12" cy="12" r="6" />
  <circle cx="12" cy="12" r="2" />
</>);

export const IconArchive = icon(<>
  <polyline points="21 8 21 21 3 21 3 8" />
  <rect x="1" y="3" width="22" height="5" rx="1" />
  <line x1="10" y1="12" x2="14" y2="12" />
</>);

export const IconTag = icon(<>
  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
  <line x1="7" y1="7" x2="7.01" y2="7" />
</>);

export const IconMessageSquare = icon(<>
  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
</>);

export const IconDownload = icon(<>
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
  <polyline points="7 10 12 15 17 10" />
  <line x1="12" y1="15" x2="12" y2="3" />
</>);

export const IconImage = icon(<>
  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
  <circle cx="8.5" cy="8.5" r="1.5" />
  <polyline points="21 15 16 10 5 21" />
</>);

export const IconRotateCcw = icon(<>
  <polyline points="1 4 1 10 7 10" />
  <path d="M3.51 15a9 9 0 1 0 .49-4.38" />
</>);

export const IconLock = icon(<>
  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
</>);

export const IconSun = icon(<>
  <circle cx="12" cy="12" r="4" />
  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
</>);

export const IconMoon = icon(<>
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
</>);

export const IconMonitor = icon(<>
  <rect x="2" y="3" width="20" height="14" rx="2" />
  <path d="M8 21h8M12 17v4" />
</>);
