import { CheckCircle2, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

type ToastProps = {
  type: ToastType;
  title: string;
  message: string;
  onClose: () => void;
};

export default function Toast({ type, title, message, onClose }: ToastProps) {
  const config = {
    success: {
      icon: CheckCircle2,
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    },

    error: {
      icon: XCircle,
      className: "border-red-200 bg-red-50 text-red-800",
    },

    info: {
      icon: Info,
      className: "border-blue-200 bg-blue-50 text-blue-800",
    },
  };

  const selected = config[type];

  const Icon = selected.icon;

  return (
    <div className="fixed right-5 top-5 z-100 w-[min(380px,calc(100vw-2rem))]">
      <div
        className={[
          "flex items-start gap-3 rounded-2xl border p-4 shadow-xl",
          selected.className,
        ].join(" ")}
      >
        <Icon size={20} className="mt-0.5 shrink-0" />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{title}</p>

          <p className="mt-1 text-sm opacity-80">{message}</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="shrink-0 opacity-50 transition hover:opacity-100"
          aria-label="Tutup"
        >
          <X size={17} />
        </button>
      </div>
    </div>
  );
}
