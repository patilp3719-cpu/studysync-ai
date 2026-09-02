// Central SVG icon library — clean, monochrome, classic style
// All icons are 1:1 viewBox="0 0 24 24", stroke-based, no fill colours

import React from 'react'

interface IconProps {
  className?: string
  size?: number
  strokeWidth?: number
}

const base = (strokeWidth = 1.75) => ({
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
})

export const IconHome        = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
)

export const IconClipboard   = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <rect x="8" y="2" width="8" height="4" rx="1"/>
    <path d="M8 4H5a1 1 0 00-1 1v14a1 1 0 001 1h14a1 1 0 001-1V5a1 1 0 00-1-1h-3"/>
    <path d="M9 12h6M9 16h4"/>
  </svg>
)

export const IconTimer       = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <circle cx="12" cy="13" r="8"/>
    <path d="M12 9v4l2.5 2.5"/>
    <path d="M9 2h6M12 2v3"/>
  </svg>
)

export const IconTarget      = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <circle cx="12" cy="12" r="9"/>
    <circle cx="12" cy="12" r="5"/>
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>
  </svg>
)

export const IconCalendar    = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
)

export const IconBell        = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
)

export const IconCards       = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <rect x="2" y="7" width="16" height="12" rx="2"/>
    <path d="M6 7V5a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2h-2"/>
  </svg>
)

export const IconGamepad     = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <rect x="2" y="6" width="20" height="12" rx="4"/>
    <path d="M7 12h4M9 10v4"/>
    <circle cx="16" cy="11" r="1" fill="currentColor" stroke="none"/>
    <circle cx="15" cy="13" r="1" fill="currentColor" stroke="none"/>
  </svg>
)

export const IconCode        = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
)

export const IconGradCap     = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <path d="M22 10L12 5 2 10l10 5 10-5z"/>
    <path d="M6 12.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/>
    <line x1="22" y1="10" x2="22" y2="15"/>
  </svg>
)

export const IconBrain       = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <path d="M9.5 2a4.5 4.5 0 00-4 6.5A4 4 0 003 12a4 4 0 004 4v2a1 1 0 002 0v-2h2v2a1 1 0 002 0v-2a4 4 0 004-4 4 4 0 00-2.5-3.7A4.5 4.5 0 0014.5 2c-1.5 0-2.8.7-3.6 1.8A4.5 4.5 0 009.5 2z"/>
  </svg>
)

export const IconKeyboard    = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <rect x="2" y="6" width="20" height="12" rx="2"/>
    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8M6 10v.01M10 10v.01"/>
  </svg>
)

export const IconHelpCircle  = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
    <circle cx="12" cy="17" r=".5" fill="currentColor" stroke="none"/>
  </svg>
)

export const IconBarChart    = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <line x1="12" y1="20" x2="12" y2="10"/>
    <line x1="18" y1="20" x2="18" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="16"/>
    <line x1="3"  y1="20" x2="21" y2="20"/>
  </svg>
)

export const IconFolder      = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
  </svg>
)

export const IconMic         = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <rect x="9" y="2" width="6" height="11" rx="3"/>
    <path d="M19 10a7 7 0 01-14 0"/>
    <line x1="12" y1="19" x2="12" y2="22"/>
    <line x1="8" y1="22" x2="16" y2="22"/>
  </svg>
)

export const IconWrench      = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <path d="M14.7 6.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-1-1a1 1 0 010-1.4l8-8a1 1 0 011.4 0l1 1z"/>
    <path d="M19.07 4.93A10 10 0 016.99 17.01a4 4 0 006-5.25l2.83-2.83a4 4 0 004.25-4z"/>
  </svg>
)

export const IconChevronLeft = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

export const IconChevronRight = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

export const IconChevronDown = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

export const IconChevronUp   = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <polyline points="18 15 12 9 6 15"/>
  </svg>
)

export const IconMenu        = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <line x1="3" y1="6"  x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)

export const IconX           = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

export const IconUser        = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)

export const IconLogOut      = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

export const IconPause       = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <rect x="6" y="4" width="4" height="16"/>
    <rect x="14" y="4" width="4" height="16"/>
  </svg>
)

export const IconPlay        = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
)

export const IconExternalLink = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)

export const IconSun         = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <circle cx="12" cy="12" r="4"/>
    <line x1="12" y1="2"  x2="12" y2="4"/>
    <line x1="12" y1="20" x2="12" y2="22"/>
    <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="2" y1="12" x2="4" y2="12"/>
    <line x1="20" y1="12" x2="22" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)

export const IconMoon        = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
)

export const IconSunrise     = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <path d="M17 18a5 5 0 00-10 0"/>
    <line x1="12" y1="2"  x2="12" y2="9"/>
    <line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/>
    <line x1="2" y1="18" x2="4" y2="18"/>
    <line x1="20" y1="18" x2="22" y2="18"/>
    <line x1="19.78" y1="11.64" x2="18.36" y2="10.22"/>
    <line x1="2" y1="22"  x2="22" y2="22"/>
    <polyline points="8 6 12 2 16 6"/>
  </svg>
)

export const IconSunset      = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <path d="M17 18a5 5 0 00-10 0"/>
    <line x1="12" y1="9" x2="12" y2="2"/>
    <line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/>
    <line x1="2" y1="18" x2="4" y2="18"/>
    <line x1="20" y1="18" x2="22" y2="18"/>
    <line x1="19.78" y1="11.64" x2="18.36" y2="10.22"/>
    <line x1="2" y1="22"  x2="22" y2="22"/>
    <polyline points="16 5 12 9 8 5"/>
  </svg>
)

export const IconTrophy      = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <path d="M6 9H3V4h3M18 9h3V4h-3"/>
    <path d="M6 4h12v8a6 6 0 01-12 0V4z"/>
    <path d="M9 22v-4M15 22v-4"/>
    <line x1="7" y1="22" x2="17" y2="22"/>
  </svg>
)

export const IconZap         = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

export const IconStar        = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

export const IconAlertTriangle = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <circle cx="12" cy="17" r=".5" fill="currentColor" stroke="none"/>
  </svg>
)

export const IconCheckCircle = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <circle cx="12" cy="12" r="10"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
)

export const IconInfo        = ({ className = '', size = 20, strokeWidth = 1.75 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base(strokeWidth)}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)
