"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  // Gold gradient — matches the "+ Add Route" header button
  primary:
    "bg-gradient-to-b from-[#FFCC66] to-[#CC9933] text-black font-semibold hover:opacity-90 hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:opacity-40 disabled:active:scale-100",
  // Dark bg with subtle border — for cancel / secondary actions
  secondary:
    "bg-[#1F1F1F] text-gray-300 border border-[#333] hover:bg-[#252525] hover:border-[#444] disabled:opacity-40 disabled:cursor-not-allowed",
  // Amber-tinted fill — for optional/tertiary actions
  outline:
    "bg-[#2A2500] text-[#FFCC66] border border-[#FFCC66]/40 hover:bg-[#3A3000] hover:border-[#FFCC66]/60 disabled:opacity-40 disabled:cursor-not-allowed",
  // No background, text highlight only — for inline / table row actions
  ghost:
    "bg-transparent text-gray-400 hover:text-[#FFCC66] hover:bg-[#1F1F1F] disabled:opacity-40 disabled:cursor-not-allowed",
  // Red — for destructive actions (delete, reject)
  danger:
    "bg-red-500 text-white font-semibold hover:bg-red-400 disabled:opacity-40 disabled:cursor-not-allowed",
  // Green — for positive confirmations (approve, done)
  success:
    "bg-green-600 text-white font-semibold hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-4 py-2 text-sm rounded-lg gap-2",
  lg: "px-5 py-2.5 text-sm rounded-xl gap-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      className = "",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center font-medium transition-all duration-200 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
