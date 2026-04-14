"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  loading = false,
}: ConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sign-in-modal max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {title}
          </DialogTitle>
          <DialogDescription className="text-muted text-sm">
            {message}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 py-2.5 rounded-full border border-border text-sm font-medium transition-all hover:border-yellow hover:bg-yellow/10 hover:text-yellow hover:-translate-y-0.5 cursor-pointer"
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex-1 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer hover:-translate-y-0.5",
              variant === "danger"
                ? "bg-red text-white hover:bg-red/80 hover:shadow-lg hover:shadow-red/30"
                : "bg-white text-[#0d0d0d] hover:shadow-lg"
            )}
          >
            {loading ? "..." : confirmText}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
