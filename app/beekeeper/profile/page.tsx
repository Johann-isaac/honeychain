import type { Metadata } from "next";
import { BadgeCheck, Mail, MapPin, Phone, CalendarDays, Hexagon, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { EditProfileForm } from "@/components/beekeeper/edit-profile-form";
import { ChangePasswordForm } from "@/components/beekeeper/change-password-form";
import { formatDate } from "@/lib/utils";
import { getBeekeeperById, getHivesByBeekeeper } from "@/lib/db";
import { getCurrentBeekeeperId } from "@/lib/auth";

export const metadata: Metadata = { title: "Profile" };

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const beekeeperId = await getCurrentBeekeeperId();
  const beekeeper = (await getBeekeeperById(beekeeperId))!;
  const hiveCount = (await getHivesByBeekeeper(beekeeper.id)).length;

  const initials = beekeeper.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Profile & settings"
        description="Your beekeeper identity. Region and verification status are shown to consumers on every batch you register."
      />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-6">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 font-display text-xl font-semibold text-honey-dark dark:text-honey">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-semibold">{beekeeper.name}</h2>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck className="size-4 text-nature" /> {beekeeper.beekeeperCode}
              </span>
              <Badge variant={beekeeper.registrationStatus === "VERIFIED" ? "success" : "warning"}>
                {beekeeper.registrationStatus === "VERIFIED" ? "Verified" : beekeeper.registrationStatus}
              </Badge>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow icon={MapPin} label="Region" value={beekeeper.region} />
            <DetailRow icon={Mail} label="Email" value={beekeeper.email} />
            <DetailRow icon={Phone} label="Phone" value={beekeeper.phone || "Not set"} />
            <DetailRow icon={CalendarDays} label="Member since" value={formatDate(beekeeper.joinedDate)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Apiary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow icon={Hexagon} label="Hives registered" value={String(hiveCount)} />
            <DetailRow
              icon={ShieldCheck}
              label="Visible to consumers"
              value="Name, beekeeper ID, region and verification status"
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <EditProfileForm beekeeper={beekeeper} />
      </div>

      <div className="mt-6">
        <ChangePasswordForm />
      </div>

      <p className="mt-6 rounded-xl border border-border bg-muted/60 p-4 text-xs leading-relaxed text-muted-foreground">
        Contact details and exact hive coordinates are never published. Consumers only ever see region-level
        information about where a batch came from.
      </p>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="break-words font-medium">{value}</p>
      </div>
    </div>
  );
}
