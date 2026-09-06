import { NextRequest, NextResponse } from "next/server";
import { submitLabTests, type SubmittedTestInput } from "@/lib/db";
import { ValidationError, requireString } from "@/lib/validation";

const CATEGORIES = ["PHYSICAL", "CHEMICAL", "ADULTERATION", "MICROBIOLOGICAL"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sampleId = requireString(body.sampleId, "Sample ID");
    const tests = body.tests;
    if (!Array.isArray(tests) || tests.length === 0) {
      throw new ValidationError("At least one test result is required.");
    }

    const parsed: SubmittedTestInput[] = tests.map((t: Record<string, unknown>, idx: number) => {
      if (!CATEGORIES.includes(String(t.category))) {
        throw new ValidationError(`Invalid test category at row ${idx + 1}.`);
      }
      const testName = requireString(t.testName, `Test name (row ${idx + 1})`);
      const expectedRange = requireString(t.expectedRange, `Expected range for ${testName}`);
      if (t.measuredValue === undefined || t.measuredValue === null || t.measuredValue === "") {
        throw new ValidationError(`Measured value for ${testName} is required.`);
      }
      return {
        category: t.category as SubmittedTestInput["category"],
        testName,
        unit: typeof t.unit === "string" ? t.unit : "",
        expectedRange,
        measuredValue: t.measuredValue as number | string,
        remarks: typeof t.remarks === "string" ? t.remarks : "",
      };
    });

    const saved = submitLabTests(sampleId, parsed);
    return NextResponse.json({ tests: saved }, { status: 201 });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to save test results." }, { status: 400 });
  }
}
