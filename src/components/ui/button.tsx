"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Buttons follow the audited mural.co pattern: 8px radius, jade fill with
 * black text and a separate mint "arrow box" inset 2px on the right. On hover
 * a 10% black overlay fades in over 300ms cubic-bezier(0.23,1,0.32,1)
 * (observed). The 3px arrow nudge is our addition.
 */

export type ButtonVariant = "primary" | "dark" | "outline" | "soft" | "ghost" | "danger" | "light" | "ghost-dark";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex shrink-0 select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-[8px] font-medium transition-[background-color,border-color,color,box-shadow] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-jade text-void focus-visible:outline-void",
  dark: "bg-void text-paper focus-visible:outline-jade",
  outline: "border-[1.5px] border-line bg-paper text-void hover:border-void",
  soft: "bg-fog text-void hover:bg-ash",
  ghost: "text-void hover:bg-fog",
  danger: "bg-[#c8102e] text-paper hover:bg-[#a60d26]",
  light: "bg-paper text-void hover:bg-fog",
  "ghost-dark": "border-[1.5px] border-dark-line text-paper hover:border-paper",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13.5px]",
  md: "h-10 px-4 text-[15px]",
  lg: "h-12 px-5 text-[16px]",
};

const arrowPad: Record<ButtonSize, string> = { sm: "pr-10", md: "pr-[52px]", lg: "pr-[58px]" };
const arrowBox: Record<ButtonSize, string> = { sm: "w-7", md: "w-9", lg: "w-11" };

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  arrow?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

function Inner({ children, arrow, loading, icon, size = "md", variant = "primary" }: Pick<ButtonProps, "children" | "arrow" | "loading" | "icon" | "size" | "variant">) {
  const overlay = variant === "primary" || variant === "dark";
  return (
    <>
      {overlay && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/btn:opacity-100",
            variant === "primary" ? "bg-black/10" : "bg-white/12",
          )}
        />
      )}
      {loading ? <Loader2 className="relative size-4 animate-spin" aria-hidden /> : icon ? <span className="relative flex">{icon}</span> : null}
      <span className="relative">{children}</span>
      {arrow && (
        <span
          aria-hidden
          className={cn(
            "absolute bottom-[2px] right-[2px] top-[2px] grid place-items-center rounded-[6px]",
            arrowBox[size],
            variant === "primary" && "bg-mint text-void",
            variant === "dark" && "bg-[#4b4b4b] text-paper",
            (variant === "outline" || variant === "soft" || variant === "light" || variant === "ghost") && "bg-fog text-void",
            variant === "ghost-dark" && "bg-[#2a2a2a] text-paper",
          )}
        >
          <ChevronRight className="size-[18px] transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/btn:translate-x-[3px]" strokeWidth={2} />
        </span>
      )}
    </>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", arrow, loading, icon, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant], sizes[size], arrow && arrowPad[size], className)}
      {...rest}
    >
      <Inner arrow={arrow} loading={loading} icon={icon} size={size} variant={variant}>
        {children}
      </Inner>
    </button>
  );
});

export interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  arrow?: boolean;
  icon?: React.ReactNode;
  prefetch?: boolean;
}

export function ButtonLink({ href, className, variant = "primary", size = "md", arrow, icon, children, ...rest }: ButtonLinkProps) {
  const external = /^(https?:|mailto:)/.test(href) || href.startsWith("/samples/") || href.startsWith("/media/");
  const cls = cn(base, variants[variant], sizes[size], arrow && arrowPad[size], className);
  if (external)
    return (
      <a href={href} className={cls} {...rest}>
        <Inner arrow={arrow} icon={icon} size={size} variant={variant}>
          {children}
        </Inner>
      </a>
    );
  return (
    <Link href={href} className={cls} {...rest}>
      <Inner arrow={arrow} icon={icon} size={size} variant={variant}>
        {children}
      </Inner>
    </Link>
  );
}

export function IconButton({ className, label, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn("inline-grid size-10 place-items-center rounded-[8px] text-void transition-colors hover:bg-fog disabled:opacity-40", className)}
      {...rest}
    >
      {children}
    </button>
  );
}
