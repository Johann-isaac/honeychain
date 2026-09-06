"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BlockchainProof } from "@/components/blockchain/blockchain-proof";
import { QrPanel } from "@/components/qr/qr-panel";
import { computeQuality, evaluateTestResult } from "@/lib/qualityService";
import { formatDateTime } from "@/lib/utils";
import type { BlockchainRecord, LabReport, LabTest } from "@/types";

interface TestTemplate {
  category: LabTest["category"];
  testName: string;
  unit: string;
  expectedRange: string;
}

const CATEGORY_LABELS: Record<LabTest["category"], string> = {
  PHYSICAL: "Physical Properties",
  CHEMICAL: "Chemical Properties",
  ADULTERATION: "Adulteration Screening",
  MICROBIOLOGICAL: "Microbiological Tests",
};

type RowState = { measuredValue: string; remarks: string };

export function TestingWorkspace({
  sampleId,
  batchId,
  batchCode,
  templates,
  initialTests,
  initialReport,
  initialBlockchain,
}: {
  sampleId: string;
  batchId: string;
  batchCode: string;
  templates: TestTemplate[];
  initialTests: LabTest[];
  initialReport: LabReport | null;
  initialBlockchain: BlockchainRecord | null;
}) {
  const router = useRouter();
  const [rows, setRows] = React.useState<RowState[]>(() =>
    templates.map((t) => {
      const existing = initialTests.find((it) => it.testName === t.testName);
      return { measuredValue: existing ? String(existing.measuredValue) : "", remarks: existing?.remarks ?? "" };
    })
  );
  const [saving, setSaving] = React.useState(false);
  const [approving, setApproving] = React.useState(false);
  const [registering, setRegistering] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [report, setReport] = React.useState<LabReport | null>(initialReport);
  const [blockchain, setBlockchain] = React.useState<BlockchainRecord | null>(initialBlockchain);
  const [saved, setSaved] = React.useState(initialTests.length > 0);

  const filledCount = rows.filter((r) => r.measuredValue.trim() !== "").length;
  const allFilled = filledCount === templates.length;

  const liveTests: LabTest[] = React.useMemo(
    () =>
      templates.map((t, i) => {
        const measuredValue = rows[i].measuredValue.trim();
        const numeric = measuredValue !== "" && !Number.isNaN(Number(measuredValue)) ? Number(measuredValue) : measuredValue;
        const result = measuredValue === "" ? "PASS" : evaluateTestResult({ measuredValue: numeric, expectedRange: t.expectedRange });
        return {
          id: `preview_${i}`,
          sampleId,
          category: t.category,
          testName: t.testName,
          measuredValue: numeric,
          unit: t.unit,
          expectedRange: t.expectedRange,
          result,
          remarks: rows[i].remarks,
        };
      }),
    [rows, templates, sampleId]
  );

  const preview = React.useMemo(() => computeQuality(liveTests), [liveTests]);

  function updateRow(i: number, key: keyof RowState, value: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  }

  async function handleSaveResults() {
    setSaving(true);
    setError(null);
    try {
      const payload = templates.map((t, i) => ({
        category: t.category,
        testName: t.testName,
        unit: t.unit,
        expectedRange: t.expectedRange,
        measuredValue: liveTests[i].measuredValue,
        remarks: rows[i].remarks,
      }));
      const res = await fetch("/api/lab/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleId, tests: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to save results.");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save results.");
    } finally {
      setSaving(false);
    }
  }

  async function handleApproveAndRegister() {
    setApproving(true);
    setError(null);
    try {
      const res = await fetch("/api/lab/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to approve report.");
      const newReport: LabReport = data.report;
      setReport(newReport);

      if (newReport.overallResult === "PASSED") {
        setApproving(false);
        setRegistering(true);
        const bcRes = await fetch(`/api/lab/${batchId}/blockchain`, { method: "POST" });
        const bcData = await bcRes.json();
        if (bcRes.ok) setBlockchain(bcData.record);
        setRegistering(false);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to approve report.");
    } finally {
      setApproving(false);
    }
  }

  const grouped = templates.reduce<Record<string, { template: TestTemplate; index: number }[]>>((acc, t, i) => {
    acc[t.category] = acc[t.category] ?? [];
    acc[t.category].push({ template: t, index: i });
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {!report && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Laboratory Testing</CardTitle>
            <Badge variant={allFilled ? "success" : "muted"}>{filledCount}/{templates.length} tests entered</Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            {(Object.keys(grouped) as LabTest["category"][]).map((cat) => (
              <div key={cat}>
                <p className="mb-2 text-sm font-semibold">{CATEGORY_LABELS[cat]}</p>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-muted text-left text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-medium">Test</th>
                        <th className="px-3 py-2 font-medium">Measured Value</th>
                        <th className="px-3 py-2 font-medium">Expected Range</th>
                        <th className="px-3 py-2 font-medium">Result</th>
                        <th className="px-3 py-2 font-medium">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {grouped[cat].map(({ template, index }) => (
                        <tr key={template.testName}>
                          <td className="px-3 py-2 font-medium">{template.testName}</td>
                          <td className="px-3 py-2">
                            <input
                              value={rows[index].measuredValue}
                              onChange={(e) => updateRow(index, "measuredValue", e.target.value)}
                              placeholder={template.unit ? `Value (${template.unit})` : "Value"}
                              className="h-8 w-32 rounded-md border border-border bg-card px-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                            />
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{template.expectedRange}{template.unit ? ` ${template.unit}` : ""}</td>
                          <td className="px-3 py-2">
                            {rows[index].measuredValue.trim() === "" ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : liveTests[index].result === "PASS" ? (
                              <Badge variant="success">PASS</Badge>
                            ) : (
                              <Badge variant="destructive">FAIL</Badge>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              value={rows[index].remarks}
                              onChange={(e) => updateRow(index, "remarks", e.target.value)}
                              placeholder="Optional"
                              className="h-8 w-full rounded-md border border-border bg-card px-2 text-xs outline-none focus:ring-2 focus:ring-primary/40"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center justify-between rounded-xl bg-muted p-4">
              <div>
                <p className="text-xs text-muted-foreground">Live calculated quality score</p>
                <p className="font-display text-2xl">{preview.qualityScore} / 100 <span className="text-sm text-muted-foreground">· Grade {preview.qualityGrade}</span></p>
              </div>
              <Button onClick={handleSaveResults} disabled={saving || filledCount === 0}>
                {saving ? "Saving…" : "Save Test Results"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {saved && !report && (
        <QualityAssessment computed={preview} onApprove={handleApproveAndRegister} approving={approving} />
      )}

      {report && (
        <>
          <QualityAssessment
            computed={{ qualityScore: report.qualityScore, qualityGrade: report.qualityGrade, overallResult: report.overallResult, breakdown: report.breakdown }}
            locked
          />
          <DigitalReport report={report} batchCode={batchCode} />
        </>
      )}

      {registering && (
        <Card className="border-honey/40 bg-accent/30">
          <CardContent className="flex items-center gap-3 p-6">
            <Loader2 className="size-5 animate-spin text-honey-dark" />
            <div>
              <p className="text-sm font-semibold">Blockchain Registration</p>
              <p className="text-xs text-muted-foreground">Registering… writing lab result to the HoneyChain demo ledger.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {report?.overallResult === "PASSED" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <BlockchainProof record={blockchain} />
          {blockchain && <QrPanel batchId={batchId} batchCode={batchCode} />}
        </div>
      )}

      {report?.overallResult === "FAILED" && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-start gap-3 p-5">
            <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-destructive">Batch withheld from blockchain registration</p>
              <p className="mt-1 text-sm text-muted-foreground">{report.remarks}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QualityAssessment({
  computed,
  onApprove,
  approving,
  locked = false,
}: {
  computed: { qualityScore: number; qualityGrade: string; overallResult: string; breakdown: { purity: number; chemicalQuality: number; physicalQuality: number; microbiologicalSafety: number } };
  onApprove?: () => void;
  approving?: boolean;
  locked?: boolean;
}) {
  const passed = computed.overallResult === "PASSED";
  return (
    <Card className={passed ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {passed ? <CheckCircle2 className="size-4 text-success" /> : <XCircle className="size-4 text-destructive" />}
          Quality Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <Badge variant={passed ? "success" : "destructive"}>{passed ? "🟢 PASSED" : "🔴 FAILED"}</Badge>
          <p className="text-sm">Quality Grade: <b>{computed.qualityGrade}</b></p>
          <p className="text-sm">Quality Score: <b>{computed.qualityScore} / 100</b></p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Purity" value={computed.breakdown.purity} />
          <Metric label="Chemical quality" value={computed.breakdown.chemicalQuality} />
          <Metric label="Physical quality" value={computed.breakdown.physicalQuality} />
          <Metric label="Microbiological safety" value={computed.breakdown.microbiologicalSafety} />
        </div>
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">HoneyChain Demo Quality Grade — not an official regulatory certification</p>
        {!locked && onApprove && (
          <Button onClick={onApprove} disabled={approving} className="w-full sm:w-auto">
            <ShieldCheck className="size-4" /> {approving ? "Approving…" : "Approve & Register on Blockchain"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-card p-3 text-center">
      <p className="font-display text-lg">{value}%</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function DigitalReport({ report, batchCode }: { report: LabReport; batchCode: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Digital Lab Report</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        <Info label="Batch ID" value={batchCode} />
        <Info label="Technician ID" value={report.technicianId} />
        <Info label="Test Date" value={formatDateTime(report.createdAt)} />
        <Info label="Result" value={report.overallResult} />
        <Info label="Quality Grade" value={report.qualityGrade} />
        <Info label="Digital Signature" value={report.digitallySigned ? "Signed ✓" : "Pending"} />
        <div className="col-span-full">
          <p className="text-xs text-muted-foreground">Remarks</p>
          <p className="mt-1 text-sm">{report.remarks}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
