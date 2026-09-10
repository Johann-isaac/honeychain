import { CreateBatchForm } from "@/components/batch/create-batch-form";
import { getDefaultBeekeeperId, getHivesByBeekeeper } from "@/lib/db";

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function NewBatchPage() {
  const beekeeperId = await getDefaultBeekeeperId();
  const hives = await getHivesByBeekeeper(beekeeperId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Create Honey Batch</h1>
        <p className="text-sm text-muted-foreground">Batch ID is generated automatically once you submit this form.</p>
      </div>
      {hives.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          You need to register a hive before creating a batch. Add one from the My Hives page.
        </p>
      ) : (
        <CreateBatchForm hives={hives} />
      )}
    </div>
  );
}
