import Link from "next/link";
import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { getAllLabReports, getLabSampleById, getBatchById } from "@/lib/db";

// Reads live mutable state (lib/db.ts), so this must be rendered per request rather than frozen at build time.
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const reports = getAllLabReports();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Laboratory Reports</h1>
        <p className="text-sm text-muted-foreground">Digitally signed HoneyChain quality reports.</p>
      </div>

      {reports.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No reports issued yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => {
            const sample = getLabSampleById(report.sampleId);
            const batch = sample ? getBatchById(sample.batchId) : undefined;
            return (
              <Link key={report.id} href={`/lab/samples/${report.sampleId}`}>
                <Card className="h-full transition-transform hover:-translate-y-0.5 hover:border-honey/50">
                  <CardContent className="space-y-2.5 p-5">
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-1.5 font-mono text-sm font-semibold">
                        <FileText className="size-3.5 text-muted-foreground" /> {batch?.batchCode ?? "—"}
                      </p>
                      <Badge variant={report.overallResult === "PASSED" ? "success" : "destructive"}>{report.overallResult}</Badge>
                    </div>
                    <p className="text-sm">Grade <b>{report.qualityGrade}</b> · Score {report.qualityScore}/100</p>
                    <p className="text-xs text-muted-foreground">Issued {formatDate(report.createdAt)}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
