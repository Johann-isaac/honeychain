import { BadgeCheck, Mail, MapPin, Phone, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EditProfileForm } from "@/components/beekeeper/edit-profile-form";
import { formatDate } from "@/lib/utils";
import { getDefaultBeekeeperId, getBeekeeperById, getHivesByBeekeeper } from "@/lib/db";

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const beekeeperId = await getDefaultBeekeeperId();
  const beekeeper = (await getBeekeeperById(beekeeperId))!;
  const hiveCount = (await getHivesByBeekeeper(beekeeper.id)).length;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-2xl">Profile</h1>
        <p className="text-sm text-muted-foreground">Your public beekeeper identity as shown to consumers.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{beekeeper.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <BadgeCheck className="size-4 text-nature" />
            <span>{beekeeper.beekeeperCode}</span>
            <Badge variant={beekeeper.registrationStatus === "VERIFIED" ? "success" : "warning"}>{beekeeper.registrationStatus}</Badge>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4" /> {beekeeper.region}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="size-4" /> {beekeeper.email}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="size-4" /> {beekeeper.phone || "Not set"}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="size-4" /> Joined {formatDate(beekeeper.joinedDate)}
          </div>
          <div className="border-t border-border pt-3 text-muted-foreground">{hiveCount} hives registered</div>
        </CardContent>
      </Card>

      <EditProfileForm beekeeper={beekeeper} />

      <p className="text-xs text-muted-foreground">
        There is no login system yet — this app operates as a single beekeeper account. Contact details and exact
        hive coordinates are never shown to consumers, only region-level information is public.
      </p>
    </div>
  );
}
