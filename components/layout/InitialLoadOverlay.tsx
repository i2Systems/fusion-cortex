/**
 * Initial Load Overlay
 * 
 * Shows a futuristic loading curtain on the first full page load.
 * After first load, soft navigations (Next.js routing) won't trigger it.
 * 
 * Only shows on hard refresh (Cmd+Shift+R) or first visit.
 */

'use client'

import { useEffect, useState } from 'react'

// CSS keyframes as inline style
const keyframes = `
  @keyframes initialTextGlow {
    0%, 100% { 
      opacity: 0.7;
      text-shadow: 0 0 30px rgba(255, 255, 255, 0.3), 0 0 60px rgba(200, 220, 255, 0.15);
    }
    50% { 
      opacity: 1;
      text-shadow: 0 0 40px rgba(255, 255, 255, 0.5), 0 0 80px rgba(200, 220, 255, 0.25);
    }
  }
  @keyframes initialFadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
`

export function InitialLoadOverlay() {
    // Start true - show by default, hide after checking sessionStorage
    const [shouldRender, setShouldRender] = useState(true)
    const [visible, setVisible] = useState(true)

    // Check mount only - show on every full page load, but not on client-side nav
    useEffect(() => {
        // First load - keep showing, then fade out
        const showDuration = 1200 // Show for 1.2 seconds

        const fadeTimer = setTimeout(() => {
            setVisible(false)
        }, showDuration)

        // Remove from DOM after fade completes
        const removeTimer = setTimeout(() => {
            setShouldRender(false)
        }, showDuration + 600)

        // Cleanup
        return () => {
            clearTimeout(fadeTimer)
            clearTimeout(removeTimer)
        }
    }, [])

    // Don't render if session already loaded or after animation completes
    if (!shouldRender) return null

    return (
        <>
            {/* Inject keyframes */}
            <style dangerouslySetInnerHTML={{ __html: keyframes }} />

            <div
                className={`
          fixed inset-0 z-[10000] flex items-center justify-center
          overflow-hidden
          ${visible
                        ? 'opacity-100 backdrop-blur-lg bg-white/50 dark:bg-black/40 pointer-events-auto'
                        : 'opacity-0 backdrop-blur-none bg-transparent pointer-events-none'
                    }
        `}
                style={{
                    transition: visible
                        ? 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
                        : 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                aria-hidden="true"
            >
                {/* Holographic Grid Overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        opacity: visible ? 0.5 : 0,
                        transition: 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                        backgroundImage: `
                            linear-gradient(rgba(120, 180, 255, 0.035) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(120, 180, 255, 0.035) 1px, transparent 1px)
                        `,
                        backgroundSize: '50px 50px',
                    }}
                />

                {/* Loading Text */}
                <div
                    className="flex flex-col items-center gap-2"
                    style={{
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'scale(1)' : 'scale(0.95)',
                        transition: visible
                            ? 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1) 100ms, transform 300ms cubic-bezier(0.4, 0, 0.2, 1) 100ms'
                            : 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                        animation: visible ? 'initialFadeIn 400ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                    }}
                >
                    <span
                        className="text-3xl font-black tracking-wider uppercase select-none"
                        style={{
                            color: 'rgba(255, 255, 255, 0.85)',
                            textShadow: '0 0 30px rgba(255, 255, 255, 0.3), 0 0 60px rgba(200, 220, 255, 0.15)',
                            animation: visible ? 'initialTextGlow 2s cubic-bezier(0.4, 0, 0.2, 1) infinite' : 'none',
                        }}
                    >
                        FUSION
                    </span>
                    <span
                        className="text-sm font-medium tracking-widest uppercase select-none"
                        style={{
                            color: 'rgba(255, 255, 255, 0.5)',
                        }}
                    >
                        i2 Cloud
                    </span>
                </div>
            </div>
        </>
    )
}
