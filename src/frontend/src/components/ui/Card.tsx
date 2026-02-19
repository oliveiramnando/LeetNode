// components/ui/Card.tsx
import * as React from "react";

export function Card({
  className = "",
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={[
        "rounded-2xl border border-white/10 bg-white/5 shadow-sm",
        "backdrop-blur supports-[backdrop-filter]:bg-white/5",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className = "",
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={["p-5", className].join(" ")}>{children}</div>;
}

export function CardContent({
  className = "",
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={["px-5 pb-5", className].join(" ")}>{children}</div>;
}
