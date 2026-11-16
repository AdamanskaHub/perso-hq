import type { ReactNode, SVGProps } from 'react';

function Icon({ children, ...p }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...p}
    >
      {children}
    </svg>
  );
}

export const IconPlus = () => (
  <Icon>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const IconEdit = () => (
  <Icon>
    <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z" />
    <path d="m13.5 6.5 3 3" />
  </Icon>
);
export const IconTrash = () => (
  <Icon>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </Icon>
);
export const IconCheck = () => (
  <Icon>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
);
export const IconExternal = () => (
  <Icon>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Icon>
);
export const IconDownload = () => (
  <Icon>
    <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
  </Icon>
);
export const IconUpload = () => (
  <Icon>
    <path d="M12 16V5M7 9l5-5 5 5M5 20h14" />
  </Icon>
);
export const IconPlay = () => (
  <Icon>
    <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
  </Icon>
);
export const IconTimer = () => (
  <Icon>
    <circle cx="12" cy="13.5" r="7" />
    <path d="M12 10v4l2.5 1.5M9.5 3h5" />
  </Icon>
);
export const IconBoard = () => (
  <Icon>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M9.5 4v16M14.5 4v10" />
  </Icon>
);
export const IconTrophy = () => (
  <Icon>
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v4M8.5 20h7" />
  </Icon>
);
export const IconClose = () => (
  <Icon>
    <path d="m6 6 12 12M18 6 6 18" />
  </Icon>
);
export const IconImage = () => (
  <Icon>
    <rect x="3.5" y="5" width="17" height="14" rx="2" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m4.5 17 4.5-4.5 3.5 3.5 2.5-2.5 4.5 4" />
  </Icon>
);
