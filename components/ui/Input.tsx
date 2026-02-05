import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
    errorMessage?: string;
    fullWidth?: boolean;
    icon?: React.ReactNode;
}

/**
 * Input Component
 *
 * Standardized text input with consistent styling, focus states, and error handling.
 * Use error and errorMessage for inline validation feedback.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', error, errorMessage, fullWidth = true, icon, ...props }, ref) => {
        const hasError = error || !!errorMessage;

        const baseStyles = 'bg-surface-subtle text-text border border-border-subtle rounded-md px-4 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200';

        const errorStyles = hasError
            ? 'border-danger focus:ring-danger text-danger placeholder:text-danger/50'
            : '';

        const widthStyles = fullWidth ? 'w-full' : '';
        const iconPaddingStyles = icon ? 'pl-10' : '';

        const combinedClassName = `${baseStyles} ${errorStyles} ${widthStyles} ${iconPaddingStyles} ${className}`.trim();

        const inputEl = icon ? (
            <div className={`relative ${widthStyles}`}>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none flex items-center justify-center">
                    {icon}
                </div>
                <input ref={ref} className={combinedClassName} {...props} />
            </div>
        ) : (
            <input ref={ref} className={combinedClassName} {...props} />
        );

        if (errorMessage) {
            return (
                <div className={widthStyles}>
                    {inputEl}
                    <p className="mt-1 text-xs text-danger" role="alert">
                        {errorMessage}
                    </p>
                </div>
            );
        }

        return inputEl;
    }
);

Input.displayName = 'Input';
