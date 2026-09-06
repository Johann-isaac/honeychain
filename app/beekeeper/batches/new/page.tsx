import { CreateBatchForm } from "@/components/batch/create-batch-form";
import { DEFAULT_BEEKEEPER_ID, getHivesByBeekeeper } from "@/lib/db";

export default async function NewBatchPage() {
  const hives = getHivesByBeekeeper(DEFAULT_BEEKEEPER_ID);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Create Honey Batch</h1>
        <p className="text-sm text-muted-foreground">Batch ID is generated automatically once you submit this form.</p>
      </div>
      <CreateBatchForm hives={hives} />
    </div>
  );
}
