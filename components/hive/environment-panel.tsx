import { Cloud, Droplets, Flower2, Thermometer, Wind, Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EnvSnapshot {
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  airQualityIndex: number;
  floweringCondition: string;
  nearbyFloweringCrops: string[];
}

export function EnvironmentPanel({ env }: { env: EnvSnapshot }) {
  const metrics = [
    { icon: Thermometer, label: "Temperature", value: `${env.temperature}°C` },
    { icon: Droplets, label: "Humidity", value: `${env.humidity}%` },
    { icon: Cloud, label: "Rainfall (24h)", value: `${env.rainfall} mm` },
    { icon: Wind, label: "Wind Speed", value: `${env.windSpeed} km/h` },
    { icon: Gauge, label: "Air Quality Index", value: `${env.airQualityIndex}` },
    { icon: Flower2, label: "Flowering Condition", value: env.floweringCondition },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Environment Monitoring</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-xl bg-muted p-3">
              <m.icon className="size-4 text-nature" />
              <p className="mt-2 text-sm font-semibold">{m.value}</p>
              <p className="text-[11px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Nearby Flowering Crops</p>
          <div className="flex flex-wrap gap-1.5">
            {env.nearbyFloweringCrops.map((c) => (
              <Badge key={c} variant="secondary">{c}</Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
