"use client"

import { Modal } from "@/components/ui/modal"
import { Button, type ButtonProps } from "@/components/ui/button"

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  confirmVariant?: ButtonProps["variant"]
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "destructive",
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <div className="mt-2 flex gap-3">
        <Button variant="outline" size="lg" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={confirmVariant}
          size="lg"
          className="flex-1"
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
