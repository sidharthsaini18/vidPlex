import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "danger",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  tone?: "danger" | "primary";
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            leftIcon={tone === "danger" ? <AlertTriangle className="h-4 w-4" /> : undefined}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-3 rounded-xl border border-amber-400/15 bg-amber-500/[0.06] p-3 text-[12px] leading-relaxed text-amber-100/80">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        This action can't be undone. Downloaded files already saved to your device are not affected.
      </div>
    </Modal>
  );
}
