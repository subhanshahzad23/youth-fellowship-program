"use client";

import { forwardRef, useState } from "react";
import { Accordion as A, Dialog as D, DropdownMenu as DM, Popover as P, Tabs as T, Tooltip as TT } from "radix-ui";
import { ChevronDown, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Button, type ButtonVariant } from "./button";

/* ------------------------------------------------------------------ */
/* Dialog                                                              */
/* ------------------------------------------------------------------ */

export const DialogRoot = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({
  title,
  description,
  children,
  footer,
  className,
  size = "md",
  hideTitle,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  hideTitle?: boolean;
}) {
  const w = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" }[size];
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-[fade-in_180ms_ease-out]" />
      <D.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-[71] flex max-h-[min(88dvh,900px)] w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[16px] bg-paper shadow-float outline-none data-[state=open]:animate-[dialog-in_220ms_cubic-bezier(0.23,1,0.32,1)]",
          w,
          className,
        )}
      >
        <div className={cn("flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6", hideTitle && "sr-only")}>
          <div className="min-w-0">
            <D.Title className="text-[18px] font-semibold tracking-[-0.01em]">{title}</D.Title>
            {description ? <D.Description className="mt-1 text-[14px] text-muted">{description}</D.Description> : <D.Description className="sr-only">{typeof title === "string" ? title : "Dialog"}</D.Description>}
          </div>
          <D.Close className="-mr-2 -mt-1 grid size-9 shrink-0 place-items-center rounded-[8px] hover:bg-fog" aria-label="Close">
            <X className="size-4" />
          </D.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-[#fafafa] px-5 py-3 sm:px-6">{footer}</div>}
      </D.Content>
    </D.Portal>
  );
}

/** Controlled confirm dialog with an async action and bounded pending state. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "dark",
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel?: string;
  confirmVariant?: ButtonVariant;
  onConfirm: () => void | boolean | Promise<void | boolean>;
  children?: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <DialogRoot open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent
        title={title}
        description={description}
        size="sm"
        footer={
          <>
            <DialogClose asChild>
              <Button variant="ghost" disabled={busy}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant={confirmVariant}
              loading={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const r = await onConfirm();
                  if (r !== false) onOpenChange(false);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {confirmLabel}
            </Button>
          </>
        }
      >
        {children}
      </DialogContent>
    </DialogRoot>
  );
}

/* ------------------------------------------------------------------ */
/* Sheet (side drawer)                                                 */
/* ------------------------------------------------------------------ */

export function Sheet({ open, onOpenChange, title, children, side = "left", className }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; children: React.ReactNode; side?: "left" | "right"; className?: string }) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <D.Portal forceMount>
            <D.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-[70] bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} />
            </D.Overlay>
            <D.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                className={cn("fixed bottom-0 top-0 z-[71] flex w-[min(88vw,340px)] flex-col bg-paper shadow-float outline-none", side === "left" ? "left-0" : "right-0", className)}
                initial={{ x: side === "left" ? "-100%" : "100%" }}
                animate={{ x: 0 }}
                exit={{ x: side === "left" ? "-100%" : "100%" }}
                transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
              >
                <D.Title className="sr-only">{title}</D.Title>
                {children}
              </motion.div>
            </D.Content>
          </D.Portal>
        )}
      </AnimatePresence>
    </D.Root>
  );
}

/* ------------------------------------------------------------------ */
/* Dropdown menu                                                       */
/* ------------------------------------------------------------------ */

export const Menu = DM.Root;
export const MenuTrigger = DM.Trigger;

export function MenuContent({ children, align = "end", className, sideOffset = 8 }: { children: React.ReactNode; align?: "start" | "center" | "end"; className?: string; sideOffset?: number }) {
  return (
    <DM.Portal>
      <DM.Content
        align={align}
        sideOffset={sideOffset}
        collisionPadding={12}
        className={cn("z-[80] min-w-[220px] overflow-hidden rounded-[14px] bg-paper p-1.5 shadow-float data-[state=open]:animate-[pop-in_160ms_cubic-bezier(0.23,1,0.32,1)]", className)}
      >
        {children}
      </DM.Content>
    </DM.Portal>
  );
}

export const MenuItem = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof DM.Item> & { icon?: React.ReactNode; danger?: boolean }>(function MenuItem({ className, icon, danger, children, ...rest }, ref) {
  return (
    <DM.Item
      ref={ref}
      className={cn(
        "flex min-h-10 cursor-pointer select-none items-center gap-2.5 rounded-[9px] px-3 text-[14.5px] outline-none data-[disabled]:cursor-not-allowed data-[highlighted]:bg-fog data-[disabled]:opacity-50",
        danger && "text-[#b00d28]",
        className,
      )}
      {...rest}
    >
      {icon && <span className="flex size-4 items-center justify-center text-muted">{icon}</span>}
      {children}
    </DM.Item>
  );
});

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return <DM.Label className="px-3 pb-1 pt-2 text-[11.5px] font-medium uppercase tracking-[0.16em] text-muted">{children}</DM.Label>;
}
export function MenuSeparator() {
  return <DM.Separator className="my-1 h-px bg-line" />;
}

/* ------------------------------------------------------------------ */
/* Popover                                                             */
/* ------------------------------------------------------------------ */

export const PopoverRoot = P.Root;
export const PopoverTrigger = P.Trigger;
export const PopoverClose = P.Close;
export function PopoverContent({ children, className, align = "end", side = "bottom", sideOffset = 10 }: { children: React.ReactNode; className?: string; align?: "start" | "center" | "end"; side?: "top" | "bottom" | "left" | "right"; sideOffset?: number }) {
  return (
    <P.Portal>
      <P.Content
        align={align}
        side={side}
        sideOffset={sideOffset}
        collisionPadding={12}
        className={cn("z-[80] rounded-[16px] bg-paper shadow-float outline-none data-[state=open]:animate-[pop-in_160ms_cubic-bezier(0.23,1,0.32,1)]", className)}
      >
        {children}
      </P.Content>
    </P.Portal>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */

export const TabsRoot = T.Root;
export const TabsContent = T.Content;

export function TabsList({ children, className, "aria-label": ariaLabel }: { children: React.ReactNode; className?: string; "aria-label"?: string }) {
  return (
    <T.List aria-label={ariaLabel} className={cn("no-scrollbar flex gap-1 overflow-x-auto border-b border-line", className)}>
      {children}
    </T.List>
  );
}

export function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  return (
    <T.Trigger
      value={value}
      className={cn(
        "relative -mb-px inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-3 text-[14.5px] text-muted transition-colors hover:text-void data-[state=active]:border-void data-[state=active]:font-medium data-[state=active]:text-void",
        className,
      )}
    >
      {children}
    </T.Trigger>
  );
}

/** Pill-style segmented control (used for filters and small view switches). */
export function Segmented<V extends string>({ value, onChange, options, className, label }: { value: V; onChange: (v: V) => void; options: { value: V; label: React.ReactNode }[]; className?: string; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-[10px] bg-fog p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn("h-8 whitespace-nowrap rounded-[7px] px-3 text-[13.5px] transition-colors", value === o.value ? "bg-paper font-medium shadow-sm" : "text-muted hover:text-void")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Accordion                                                           */
/* ------------------------------------------------------------------ */

export function Accordion({ items, className, defaultValue }: { items: { value: string; title: React.ReactNode; content: React.ReactNode }[]; className?: string; defaultValue?: string }) {
  return (
    <A.Root type="single" collapsible defaultValue={defaultValue} className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((it) => (
        <A.Item key={it.value} value={it.value}>
          <A.Header>
            <A.Trigger className="group flex w-full items-center justify-between gap-6 py-5 text-left text-[18px] font-medium tracking-[-0.01em] transition-colors hover:text-[#333] sm:text-[20px]">
              {it.title}
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-fog transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-data-[state=open]:rotate-180">
                <ChevronDown className="size-4" aria-hidden />
              </span>
            </A.Trigger>
          </A.Header>
          <A.Content className="overflow-hidden data-[state=closed]:animate-[acc-up_220ms_cubic-bezier(0.23,1,0.32,1)] data-[state=open]:animate-[acc-down_260ms_cubic-bezier(0.23,1,0.32,1)]">
            <div className="max-w-3xl pb-6 text-[16px] leading-relaxed text-ink">{it.content}</div>
          </A.Content>
        </A.Item>
      ))}
    </A.Root>
  );
}

/* ------------------------------------------------------------------ */
/* Tooltip                                                             */
/* ------------------------------------------------------------------ */

export function Tooltip({ content, children }: { content: React.ReactNode; children: React.ReactNode }) {
  return (
    <TT.Provider delayDuration={250}>
      <TT.Root>
        <TT.Trigger asChild>{children}</TT.Trigger>
        <TT.Portal>
          <TT.Content sideOffset={6} className="z-[90] max-w-xs rounded-[8px] bg-void px-2.5 py-1.5 text-[12.5px] text-paper shadow-float">
            {content}
          </TT.Content>
        </TT.Portal>
      </TT.Root>
    </TT.Provider>
  );
}
