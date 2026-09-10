import { CreateHiveForm } from "@/components/hive/create-hive-form";

export default function NewHivePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Register a Hive</h1>
        <p className="text-sm text-muted-foreground">
          Every physical hive gets its own Hive ID — one ESP32 per hive, each reporting under its own ID.
        </p>
      </div>
      <CreateHiveForm />
    </div>
  );
}
