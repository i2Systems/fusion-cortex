import React, { useEffect, useRef } from 'react';
import { Button } from './Button';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';

interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
}

/**
 * Dialog Component
 * 
 * simple modal implementation using Tailwind and React state.
 * Includes backdrop blur and centering properties.
 */
export const Dialog = ({ isOpen, onClose, children, className = '' }: DialogProps) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // Focus trap for accessibility
    useFocusTrap({
        isOpen,
        onClose,
        containerRef: modalRef,
        enabled: isOpen,
    });

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
                className="absolute inset-0 backdrop-blur-sm transition-opacity"
                style={{ backgroundColor: 'var(--color-backdrop)' }}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Content Container */}
            <div
                ref={modalRef}
                tabIndex={-1}
                className={`relative z-50 w-full max-w-lg transform rounded-xl bg-bg-elevated border border-border-subtle shadow-strong p-6 text-left shadow-xl transition-all animate-in fade-in zoom-in-95 duration-200 ${className}`}
            >
                {children}

                {/* Close Button (X) */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-bg transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-text-muted text-text-muted hover:text-text"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    <span className="sr-only">Close</span>
                </button>
            </div>
        </div>
    );
};

// --- Subcomponents ---

export const DialogHeader = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={`flex flex-col space-y-1.5 text-center sm:text-left mb-4 ${className}`} {...props} />
);

export const DialogTitle = ({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className={`text-lg font-semibold leading-none tracking-tight text-text ${className}`} {...props} />
);

export const DialogDescription = ({ className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={`text-sm text-text-muted ${className}`} {...props} />
);

export const DialogFooter = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 ${className}`} {...props} />
);
