import React, { HTMLAttributes, forwardRef } from 'react';

// --- Card Root ---
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className = '', variant = 'default', ...props }, ref) => {
        // Reusing the existing .fusion-card class for the main style
        const baseClass = 'fusion-card';
        return (
            <div
                ref={ref}
                className={`${baseClass} ${className}`}
                {...props}
            />
        );
    }
);
Card.displayName = 'Card';

// --- Card Header ---
export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className = '', ...props }, ref) => (
        <div
            ref={ref}
            className={`flex flex-col space-y-1.5 p-6 pb-2 ${className}`}
            {...props}
        />
    )
);
CardHeader.displayName = 'CardHeader';

// --- Card Title ---
export const CardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
    ({ className = '', ...props }, ref) => (
        <h3
            ref={ref}
            className={`text-2xl font-semibold leading-none tracking-tight text-text ${className}`}
            {...props}
        />
    )
);
CardTitle.displayName = 'CardTitle';

// --- Card Description ---
export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
    ({ className = '', ...props }, ref) => (
        <p
            ref={ref}
            className={`text-sm text-text-muted ${className}`}
            {...props}
        />
    )
);
CardDescription.displayName = 'CardDescription';

// --- Card Content ---
export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className = '', ...props }, ref) => (
        <div ref={ref} className={`p-6 pt-0 ${className}`} {...props} />
    )
);
CardContent.displayName = 'CardContent';

// --- Card Footer ---
export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className = '', ...props }, ref) => (
        <div
            ref={ref}
            className={`flex items-center p-6 pt-0 ${className}`}
            {...props}
        />
    )
);
CardFooter.displayName = 'CardFooter';
