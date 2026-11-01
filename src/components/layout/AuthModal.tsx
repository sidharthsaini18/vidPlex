import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Mail, ShieldCheck, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Enter a valid email address.");
      return;
    }
    try {
      const clean = email.trim();
      localStorage.setItem("vidplex.v2.identity", clean);
      localStorage.setItem(
        "vidplex.v2.profile",
        JSON.stringify({ name: clean.split("@")[0] || "Creator", email: clean })
      );
    } catch {
      /* ignore */
    }
    toast.success("Welcome to your workspace.");
    onClose();
    navigate("/dashboard");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Step into your workspace"
      description="Your downloads, favorites and analytics live in one private dashboard. No password needed in this demo."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1.5">
          <label className="flex items-center gap-2 rounded-xl px-3">
            <Mail className="h-4 w-4 text-slate-500" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@studio.com"
              className="h-11 w-full bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none"
              autoFocus
            />
          </label>
        </div>
        <Button type="submit" fullWidth size="lg" rightIcon={<ArrowRight className="h-4 w-4" />} magnetic>
          Continue to dashboard
        </Button>
        <div className="grid gap-2 pt-1 text-[13px] text-slate-400">
          {[
            "Unlimited downloads with no sign-up wall",
            "Private history stored on this device",
            "Cancel or clear your data at any time",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500/15">
                <Check className="h-3 w-3 text-emerald-300" />
              </span>
              {item}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-[11px] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          Demo workspace — no payment or account is created.
          <Sparkles className="ml-auto h-3.5 w-3.5 text-violet-300" />
        </div>
      </form>
    </Modal>
  );
}
