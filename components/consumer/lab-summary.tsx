"use client";

import * as React from "react";
import { ChevronDown, FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface PublicTest {
  category?: string;
  testName: string;
  measuredValue: number | string;
  unit: string;
  result: "PASS" | "FAIL";
}

export function LabSummary({
  overallResult,
  qualityGrade,
  qualityScore,
  selectedTests,
  allTests,
  adulterationPassed,
  testedAt,
}: {
  overallResult: "PASSED" | "FAILED";
  qualityGrade: string;
  qualityScore: number;
  selectedTests: PublicTest[];
  allTests: PublicTest[];
  adulterationPassed: boolean;
  testedAt: string;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const passed = overallResult === "PASSED";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="size-4 text-nature" /> Laboratory Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={passed ? "success" : "destructive"}>{passed ? "🟢 Passed" : "🔴 Failed"}</Badge>
          <p className="text-sm">Quality Grade: <b>{qualityGrade}</b></p>
          <p className="text-sm">Score: <b>{qualityScore}/100</b></p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {selectedTests.map((t) => (
            <div key={t.testName} className="rounded-xl bg-muted p-3">
              <p className="text-sm font-semibold">{t.measuredValue}{t.unit}</p>
              <p className="text-[11px] text-muted-foreground">{t.testName.split(" (")[0]}</p>
            </div>
          ))}
          <div className="rounded-xl bg-muted p-3">
            <p className="text-sm font-semibold">{adulterationPassed ? "Passed" : "Flagged"}</p>
            <p className="text-[11px] text-muted-foreground">Adulteration Screening</p>
          </div>
        </div>

        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
          HoneyChain Demo Quality Grade · tested {formatDate(testedAt)} · not an official regulatory certification
        </p>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-medium text-nature"
        >
          View Complete Lab Report <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>

        {expanded && (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-muted text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Test</th>
                  <th className="px-3 py-2 font-medium">Result Value</th>
                  <th className="px-3 py-2 font-medium">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {allTests.map((t) => (
                  <tr key={t.testName}>
                    <td className="px-3 py-2">{t.testName}</td>
                    <td className="px-3 py-2">{t.measuredValue} {t.unit}</td>
                    <td className="px-3 py-2">
                      <Badge variant={t.result === "PASS" ? "success" : "destructive"}>{t.result}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
