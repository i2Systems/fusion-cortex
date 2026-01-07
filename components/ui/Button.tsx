import React, { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
}

/**
 * Button Component
 * 
 * Wraps the existing `.fusion-button` CSS classes into a robust React component.
 * Ensures consistent usage of design system tokens and styles.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {

        // Map variants to existing CSS classes from components.css
        const getVariantClass = (v: string) => {
            switch (v) {
                case 'primary': return 'fusion-button-primary';
                case 'secondary': return 'fusion-button-secondary';
                case 'ghost': return 'fusion-button-ghost';
                case 'danger': return 'fusion-button-danger';
                default: return 'fusion-button-primary';
            }
        };

        // Map sizes to tailwind utilities (since existing CSS handles padding, we might need overrides)
        const getSizeClass = (s: string) => {
            switch (s) {
                case 'sm': return 'text-xs py-1 px-3';
                case 'md': return ''; // Default handled by .fusion-button
                case 'lg': return 'text-lg py-3 px-8';
                case 'icon': return 'p-2 aspect-square flex items-center justify-center';
                default: return '';
            }
        };

        const baseClass = 'fusion-button';
        const variantClass = getVariantClass(variant);
        const sizeClass = getSizeClass(size);
        const loadingClass = isLoading ? 'opacity-70 cursor-wait' : '';

        // Combine classes
        const combinedClassName = `${baseClass} ${variantClass} ${sizeClass} ${loadingClass} ${className}`.trim();

        return (
            <button
                ref={ref}
                className={combinedClassName}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && (
                    <span className="animate-spin mr-2">
                        {/* Simple SVG spinner */}
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </span>
                )}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
