/**
 * Site Transition Overlay
 * 
 * Futuristic full-page transition with:
 * - Frosted glass blur with smooth ease-in-out
 * - Holographic grid overlay
 * - Scan line sweep animation
 * - Subtle text glow pulse with color shift
 */

'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSiteStore } from '@/lib/stores/siteStore'

// CSS keyframes as inline style
const keyframes = `
  @keyframes scanline {
    0% { transform: translateY(-100vh); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(100vh); opacity: 0; }
  }
  @keyframes textGlowPulse {
    0%, 100% { 
      color: rgba(80, 80, 100, 0.5);
      text-shadow: 0 0 20px rgba(100, 150, 255, 0.2), 0 0 40px rgba(100, 150, 255, 0.1);
    }
    50% { 
      color: rgba(60, 80, 120, 0.6);
      text-shadow: 0 0 25px rgba(120, 170, 255, 0.3), 0 0 50px rgba(120, 170, 255, 0.15);
    }
  }
`

export function SiteTransitionOverlay() {
    const isSwitching = useSiteStore((state) => state.isSwitching)
    const siteName = useSiteStore((state) => state.switchingSiteName)
    const [visible, setVisible] = useState(false)
    const [shouldRender, setShouldRender] = useState(false)

    useEffect(() => {
        if (isSwitching) {
            setShouldRender(true)
            requestAnimationFrame(() => {
                setVisible(true)
            })
        } else {
            setVisible(false)
            const timeout = setTimeout(() => {
                setShouldRender(false)
            }, 600)
            return () => clearTimeout(timeout)
        }
    }, [isSwitching])

    // Memoize grid background
    const gridStyle = useMemo(() => ({
        opacity: visible ? 0.5 : 0,
        transition: 'opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundImage: `
      linear-gradient(rgba(120, 180, 255, 0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(120, 180, 255, 0.035) 1px, transparent 1px)
    `,
        backgroundSize: '50px 50px',
    }), [visible])

    if (!shouldRender) return null

    return (
        <>
            {/* Inject keyframes */}
            <style dangerouslySetInnerHTML={{ __html: keyframes }} />

            <div
                className={`
          fixed inset-0 z-[9999] flex items-center justify-center
          pointer-events-none overflow-hidden
          ${visible
                        ? 'opacity-100 backdrop-blur-lg bg-white/50 dark:bg-black/40'
                        : 'opacity-0 backdrop-blur-none bg-transparent'
                    }
        `}
                style={{
                    transition: visible
                        ? 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
                        : 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                aria-hidden="true"
            >
                {/* Holographic Grid Overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={gridStyle}
                />

                {/* Scan Line */}
                {visible && (
                    <div
                        className="absolute inset-x-0 h-[1px] pointer-events-none"
                        style={{
                            background: 'linear-gradient(90deg, transparent 10%, rgba(150, 200, 255, 0.4) 30%, rgba(255, 255, 255, 0.6) 50%, rgba(150, 200, 255, 0.4) 70%, transparent 90%)',
                            animation: 'scanline 1s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 0 12px rgba(150, 200, 255, 0.35), 0 0 25px rgba(150, 200, 255, 0.15)',
                        }}
                    />
                )}

                {/* Loading Text */}
                {siteName && (
                    <span
                        className="text-2xl font-black tracking-wider uppercase select-none"
                        style={{
                            opacity: visible ? 1 : 0,
                            transform: visible ? 'scale(1)' : 'scale(0.97)',
                            transition: visible
                                ? 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1) 80ms, transform 300ms cubic-bezier(0.4, 0, 0.2, 1) 80ms'
                                : 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                            animation: visible ? 'textGlowPulse 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite' : 'none',
                            color: 'rgba(255, 255, 255, 0.7)',
                            textShadow: '0 0 30px rgba(255, 255, 255, 0.3), 0 0 60px rgba(200, 220, 255, 0.15)',
                        }}
                    >
                        ...loading {siteName}
                    </span>
                )}
            </div>
        </>
    )
}
