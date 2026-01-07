import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
}

/**
 * Input Component
 * 
 * Standardized text input with consistent styling, focus states, and error handling.
 * Uses Tailwind utilities to match the base design system.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', error, fullWidth = true, icon, ...props }, ref) => {

        const baseStyles = 'bg-surface-subtle text-text border border-border-subtle rounded-md px-4 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200';

        // Error state styling
        const errorStyles = error
            ? 'border-danger focus:ring-danger text-danger placeholder:text-danger/50'
            : '';

        const widthStyles = fullWidth ? 'w-full' : '';
        const iconPaddingStyles = icon ? 'pl-10' : '';

        const combinedClassName = `${baseStyles} ${errorStyles} ${widthStyles} ${iconPaddingStyles} ${className}`.trim();

        if (icon) {
            return (
                <div className={`relative ${widthStyles}`}>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none flex items-center justify-center">
                        {icon}
                    </div>
                    <input
                        ref={ref}
                        className={combinedClassName}
                        {...props}
                    />
                </div>
            )
        }

        return (
            <input
                ref={ref}
                className={combinedClassName}
                {...props}
            />
        );
    }
);

Input.displayName = 'Input';
