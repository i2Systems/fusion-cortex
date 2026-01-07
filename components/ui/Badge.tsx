import React, { HTMLAttributes, forwardRef } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning';
    appearance?: 'solid' | 'soft' | 'outline';
}

/**
 * Badge Component
 * 
 * Used for status indicators, labels, and tags.
 * Supports 'solid' (full color), 'soft' (tinted token style), and 'outline'.
 */
export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
    ({ className = '', variant = 'default', appearance = 'solid', children, ...props }, ref) => {

        // Base styles shared by all
        const sharedStyles = "inline-flex items-center rounded-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

        // Solid/Outline specific base (Tailwind sizing)
        const solidBase = "border px-2.5 py-0.5 text-xs";

        const variantStyles = {
            default: "border-transparent bg-primary text-text-on-primary hover:bg-primary/80",
            secondary: "border-transparent bg-surface-subtle text-text hover:bg-surface-subtle/80",
            destructive: "border-transparent bg-danger text-text-on-primary hover:bg-danger/80",
            success: "border-transparent bg-success text-text-on-primary hover:bg-success/80",
            warning: "border-transparent bg-warning text-black hover:bg-warning/80",
            outline: "text-text border-border-subtle",
        };

        // Map variants to token classes for 'soft' appearance
        const tokenMap: Record<string, string> = {
            default: 'token-status-info',
            secondary: 'token-status-not-assigned',
            destructive: 'token-status-error',
            success: 'token-status-success',
            warning: 'token-status-warning',
            outline: 'token-status-not-assigned'
        };

        let finalClass = '';

        if (appearance === 'soft') {
            // Use CSS class based token system
            const tokenClass = tokenMap[variant] || 'token-status-info';
            // Note: .token class in CSS handles padding/border/size
            finalClass = `token ${tokenClass} ${sharedStyles} ${className}`;
        } else {
            // Use Tailwind based solid/outline system
            const vStyle = appearance === 'outline' ? variantStyles.outline : variantStyles[variant];
            finalClass = `${sharedStyles} ${solidBase} ${vStyle} ${className}`;
        }

        return (
            <div
                ref={ref}
                className={finalClass.trim()}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Badge.displayName = 'Badge';
