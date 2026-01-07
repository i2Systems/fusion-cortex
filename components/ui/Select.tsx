import React, { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
    label: string;
    value: string | number;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    options: SelectOption[];
    error?: boolean;
    fullWidth?: boolean;
    placeholder?: string;
}

/**
 * Select Component
 * 
 * Standardized dropdown wrapper that uses a native <select> element for 
 * accessibility and mobile behavior, but with custom styling to match the design system.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className = '', options, error, fullWidth = true, placeholder, ...props }, ref) => {

        const baseStyles = 'appearance-none bg-surface-subtle text-text border border-border-subtle rounded-md pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 cursor-pointer';

        // Error state styling
        const errorStyles = error
            ? 'border-danger focus:ring-danger text-danger'
            : '';

        const widthStyles = fullWidth ? 'w-full' : '';

        const combinedClassName = `${baseStyles} ${errorStyles} ${widthStyles} ${className}`.trim();

        return (
            <div className={`relative ${widthStyles}`}>
                <select
                    ref={ref}
                    className={combinedClassName}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled selected={!props.value}>
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none flex items-center justify-center">
                    <ChevronDown size={16} />
                </div>
            </div>
        );
    }
);

Select.displayName = 'Select';
