// components/profile/EmptyState.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <h1 className="text-base font-semibold text-white">{title}</h1>
        {description ? <p className="mt-1 text-sm text-white/60">{description}</p> : null}
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-white/70">
          Try a different username or wire this route to your user search later.
        </div>
      </CardContent>
    </Card>
  );
}
