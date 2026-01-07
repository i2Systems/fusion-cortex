import React, { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ToggleProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    pressed?: boolean;
    onPressedChange?: (pressed: boolean) => void;
    size?: 'sm' | 'md' | 'lg' | 'icon';
    variant?: 'default' | 'outline';
}

/**
 * Toggle Component
 * 
 * A two-state button that can be either on (pressed) or off (unpressed).
 * Designed to be more compact and semantic than a standard Button.
 */
export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
    ({ className = '', pressed = false, onPressedChange, size = 'md', variant = 'default', children, onClick, ...props }, ref) => {

        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            if (onPressedChange) {
                onPressedChange(!pressed);
            }
            if (onClick) {
                onClick(e);
            }
        };

        const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 border";

        const sizeStyles = {
            sm: "h-7 px-2 text-xs gap-1.5",
            md: "h-9 px-3 text-sm gap-2",
            lg: "h-10 px-4 text-base gap-2.5",
            icon: "h-9 w-9 p-0",
        };

        // State styles using CSS variables for theming support
        const unpressedStyles = "bg-transparent border-border-subtle text-text-muted hover:bg-surface-subtle hover:text-text hover:border-border-strong";
        const pressedStyles = "bg-primary-soft border-primary text-text shadow-glow-primary";

        const combinedClassName = `
            ${baseStyles}
            ${sizeStyles[size]}
            ${pressed ? pressedStyles : unpressedStyles}
            ${className}
        `.trim();

        return (
            <button
                ref={ref}
                type="button"
                aria-pressed={pressed}
                data-state={pressed ? 'on' : 'off'}
                className={combinedClassName}
                onClick={handleClick}
                {...props}
            >
                {children}
            </button>
        );
    }
);

Toggle.displayName = 'Toggle';
