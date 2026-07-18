import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function ReorderButtons({
  disabledUp,
  disabledDown,
  onUp,
  onDown,
}: {
  disabledUp: boolean;
  disabledDown: boolean;
  onUp: () => void;
  onDown: () => void;
}) {
  return (
    <div className="flex flex-col">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        disabled={disabledUp}
        onClick={onUp}
        aria-label="Move up"
      >
        <ArrowUp className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        disabled={disabledDown}
        onClick={onDown}
        aria-label="Move down"
      >
        <ArrowDown className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}

export function SaveBar({
  onSave,
  onCancel,
  saving,
  dirty,
  savedMessage,
}: {
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  dirty: boolean;
  savedMessage?: string | null;
}) {
  return (
    <div className="sticky bottom-0 -mx-6 mt-8 flex items-center gap-3 border-t bg-white/95 px-6 py-4 backdrop-blur">
      <Button type="button" onClick={onSave} disabled={saving || !dirty}>
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Save
      </Button>
      <Button type="button" variant="outline" onClick={onCancel} disabled={saving || !dirty}>
        Cancel
      </Button>
      {savedMessage && <span className="text-sm text-emerald-600">{savedMessage}</span>}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
