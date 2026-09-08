'use client'

import { useEffect, useState } from 'react'

export default function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Start fade-out after 2.2s, fully gone at 2.7s
    const t1 = setTimeout(() => setFadeOut(true), 2200)
    const t2 = setTimeout(() => setVisible(false), 2700)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#0f131c',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.5s ease',
        pointerEvents: fadeOut ? 'none' : 'all',
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        width: 340,
        height: 340,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)',
        animation: 'splash-pulse 2s ease-in-out infinite',
      }} />

      {/* Logo mark */}
      <div style={{
        width: 100,
        height: 100,
        borderRadius: 24,
        background: '#1a1535',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 40px rgba(139,92,246,0.35)',
        animation: 'splash-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
        opacity: 0,
        animationDelay: '0.05s',
      }}>
        <LogoSVG size={64} />
      </div>

      {/* Wordmark */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
        animation: 'splash-rise 0.5s ease forwards',
        opacity: 0,
        animationDelay: '0.35s',
      }}>
        <p style={{
          fontFamily: 'var(--font-inter, sans-serif)',
          fontSize: '1.375rem',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          color: '#dfe2ee',
        }}>
          StudySync <span style={{ color: '#a78bfa' }}>AI</span>
        </p>
        <p style={{
          fontFamily: 'var(--font-jetbrains, monospace)',
          fontSize: '0.7rem',
          fontWeight: 500,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#494454',
        }}>
          Your AI Study Companion
        </p>
      </div>

      {/* Loading dots */}
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem',
        animation: 'splash-rise 0.5s ease forwards', opacity: 0, animationDelay: '0.6s' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 5, height: 5, borderRadius: '50%',
            background: '#8B5CF6',
            animation: `splash-dot 1.2s ease-in-out ${i * 0.18}s infinite`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes splash-pop {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes splash-rise {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splash-pulse {
          0%, 100% { transform: scale(1);   opacity: 0.7; }
          50%       { transform: scale(1.1); opacity: 1;   }
        }
        @keyframes splash-dot {
          0%, 80%, 100% { transform: scale(1);   opacity: 0.3; }
          40%           { transform: scale(1.4); opacity: 1;   }
        }
        @keyframes logo-spin-cw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes logo-spin-ccw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
      `}</style>
    </div>
  )
}

/** Inline SVG recreation of the provided logo */
export function LogoSVG({ size = 28, spin = false }: { size?: number; spin?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={spin ? { animation: 'logo-spin-cw 2.4s linear infinite' } : undefined}
    >
      {/* Top arc — violet/purple, clockwise arrow at right */}
      <path
        d="M 50 18 A 32 32 0 0 1 82 50"
        stroke="url(#arc1)"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrow head for top arc (pointing down-left at right side) */}
      <polyline
        points="75,38 83,50 70,50"
        stroke="url(#arc1)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Bottom arc — blue/indigo, counter-clockwise arrow at left */}
      <path
        d="M 50 82 A 32 32 0 0 1 18 50"
        stroke="url(#arc2)"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrow head for bottom arc (pointing up-right at left side) */}
      <polyline
        points="25,62 17,50 30,50"
        stroke="url(#arc2)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Center dot */}
      <circle cx="50" cy="50" r="9" fill="url(#dotGrad)" />

      <defs>
        <linearGradient id="arc1" x1="50" y1="18" x2="82" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#c4b5fd" />
        </linearGradient>
        <linearGradient id="arc2" x1="50" y1="82" x2="18" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
        <radialGradient id="dotGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7c3aed" />
        </radialGradient>
      </defs>
    </svg>
  )
}
