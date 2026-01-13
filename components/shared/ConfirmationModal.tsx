import React from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'primary';
    isLoading?: boolean;
}

export const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'primary',
    isLoading = false
}: ConfirmationModalProps) => {
    return (
        <Dialog isOpen={isOpen} onClose={onClose} className="max-w-md">
            <DialogHeader>
                <div className="flex items-center gap-3">
                    {variant === 'danger' && (
                        <div className="p-2 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                            <AlertTriangle size={20} />
                        </div>
                    )}
                    <DialogTitle>{title}</DialogTitle>
                </div>
                <DialogDescription className="mt-2 pt-2">
                    {message}
                </DialogDescription>
            </DialogHeader>

            <DialogFooter>
                <Button
                    variant="ghost"
                    onClick={onClose}
                    disabled={isLoading}
                >
                    {cancelLabel}
                </Button>
                <Button
                    variant={variant === 'danger' ? 'danger' : 'primary'}
                    onClick={onConfirm}
                    isLoading={isLoading}
                >
                    {confirmLabel}
                </Button>
            </DialogFooter>
        </Dialog>
    );
};
