import type { Metadata } from "next";
import { CreateHiveForm } from "@/components/hive/create-hive-form";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Register a Hive" };

export default function NewHivePage() {
  return (
    <div>
      <PageHeader
        title="Register a hive"
        description="Every physical hive gets its own Hive ID — one ESP32 node per hive, each reporting under its own ID."
        backHref="/beekeeper/hives"
        backLabel="Back to hives"
      />
      <CreateHiveForm />
    </div>
  );
}
