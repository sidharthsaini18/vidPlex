import { Check, Sparkles, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

const PLANS = [
  {
    name: "Pro",
    price: "$9",
    tag: "For creators",
    features: ["Unlimited 4K downloads", "Priority queue", "Cloud favorites", "No wait between files"],
    highlight: false,
  },
  {
    name: "Studio",
    price: "$19",
    tag: "For teams",
    features: ["Everything in Pro", "5 team seats", "Shared libraries", "API access & webhooks"],
    highlight: true,
  },
];

export function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="A little more room to create"
      description="Pro and Studio are on the way. The free workspace stays unlimited — plans add team features and priority processing."
      className="max-w-2xl"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative overflow-hidden rounded-2xl border p-4 ${
              plan.highlight
                ? "border-violet-400/30 bg-violet-500/[0.08]"
                : "border-white/[0.08] bg-white/[0.025]"
            }`}
          >
            {plan.highlight && (
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-violet-500/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-violet-200">
                <Sparkles className="h-2.5 w-2.5" /> Popular
              </span>
            )}
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{plan.tag}</p>
            <div className="mt-2 flex items-end gap-1">
              <span className="text-[28px] font-semibold tracking-tight text-white">{plan.price}</span>
              <span className="pb-1 text-[11px] text-slate-500">/month</span>
            </div>
            <p className="mt-0.5 text-[12px] font-medium text-slate-300">{plan.name}</p>
            <ul className="mt-3 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-[11.5px] text-slate-400">
                  <span className="mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full bg-emerald-500/15">
                    <Check className="h-2.5 w-2.5 text-emerald-300" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              variant={plan.highlight ? "primary" : "secondary"}
              size="sm"
              fullWidth
              className="mt-4"
              leftIcon={<Zap className="h-3.5 w-3.5" />}
              onClick={() => {
                toast.success(`${plan.name} waitlist joined — we'll be in touch.`);
                onClose();
              }}
            >
              Join waitlist
            </Button>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-[10px] text-slate-600">
        No payment is collected in this demo. Your current workspace remains free.
      </p>
    </Modal>
  );
}
