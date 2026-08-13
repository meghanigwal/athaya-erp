"use client";

import { useMemo, useRef, useState } from "react";
import { Button, Card, CardHeader, Field, FormMessage, Select, Table, Th, Td } from "@/components/ui";
import { parseImportFileAction, commitImportAction, type ParseResult, type CommitResult } from "./actions";
import type { ImportModule } from "@/lib/modules/importer";
import { UploadCloud } from "lucide-react";

type Step = "upload" | "map" | "done";

export function ImportWizard() {
  const [step, setStep] = useState<Step>("upload");
  const [mod, setMod] = useState<ImportModule>("players");
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [addNew, setAddNew] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CommitResult | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleUpload(formData: FormData) {
    setBusy(true);
    setError(null);
    const file = fileInput.current?.files?.[0];
    if (file) setFileName(file.name);
    const res = await parseImportFileAction(formData);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setParsed(res);
    setMapping(res.mapping ?? {});
    setStep("map");
  }

  async function handleCommit() {
    if (!parsed?.rows) return;
    setBusy(true);
    setError(null);
    const res = await commitImportAction(mod, parsed.rows, mapping, { addNew, updateExisting }, fileName);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setResult(res);
    setStep("done");
  }

  function reset() {
    setStep("upload");
    setParsed(null);
    setMapping({});
    setResult(null);
    setError(null);
    setFileName("");
  }

  const previewRows = useMemo(() => parsed?.rows?.slice(0, 8) ?? [], [parsed]);

  return (
    <Card>
      <CardHeader title="Import Wizard" subtitle="Upload existing Excel/CSV data and map it into the ERP" />
      <div className="px-5 py-5">
        {error && (
          <div className="mb-4">
            <FormMessage message={error} />
          </div>
        )}

        {step === "upload" && (
          <form
            action={(formData) => {
              formData.set("module", mod);
              handleUpload(formData);
            }}
            className="space-y-4"
          >
            <Field label="Import Into" htmlFor="module">
              <Select id="module" value={mod} onChange={(e) => setMod(e.target.value as ImportModule)}>
                <option value="players">Players</option>
                <option value="leads">Leads</option>
              </Select>
            </Field>
            <Field label="Excel or CSV File" htmlFor="file" required hint="Supported formats: .xlsx, .xls, .csv">
              <input
                ref={fileInput}
                id="file"
                name="file"
                type="file"
                accept=".xlsx,.xls,.csv"
                required
                className="block w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-sm text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
              />
            </Field>
            <Button type="submit" disabled={busy}>
              <UploadCloud className="h-4 w-4" /> {busy ? "Reading file..." : "Upload & Preview"}
            </Button>
          </form>
        )}

        {step === "map" && parsed?.headers && parsed.fields && (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-slate-500">
                <span className="font-medium text-slate-700">{fileName}</span> — {parsed.rows?.length ?? 0} row(s) found,{" "}
                {parsed.headers.length} column(s) detected.
              </p>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Map Columns to ERP Fields</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {parsed.fields.map((f) => (
                  <div key={f.key} className="flex items-center gap-2">
                    <span className="w-40 shrink-0 text-sm text-slate-600">
                      {f.label}
                      {f.required && <span className="text-rose-500"> *</span>}
                    </span>
                    <Select
                      value={mapping[f.key] ?? ""}
                      onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value || null }))}
                    >
                      <option value="">Not mapped</option>
                      {parsed.headers!.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Preview (first 8 rows)</h4>
              <Table>
                <thead>
                  <tr>
                    {parsed.fields.map((f) => (
                      <Th key={f.key}>{f.label}</Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, idx) => (
                    <tr key={idx}>
                      {parsed.fields!.map((f) => (
                        <Td key={f.key}>{mapping[f.key] ? row[mapping[f.key]!] || "-" : "-"}</Td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Import Options</h4>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={addNew} onChange={(e) => setAddNew(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
                  Add new records
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Update existing records (matched by phone number)
                </label>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Records that already exist (matched by phone number) will be skipped unless &ldquo;Update existing&rdquo; is checked.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleCommit} disabled={busy}>
                {busy ? "Importing..." : "Confirm Import"}
              </Button>
              <Button variant="secondary" onClick={reset} disabled={busy}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {step === "done" && result?.summary && (
          <div className="space-y-4">
            <FormMessage tone="success" message="Import completed." />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <SummaryStat label="Found" value={result.summary.found} />
              <SummaryStat label="Imported" value={result.summary.imported} />
              <SummaryStat label="Updated" value={result.summary.updated} />
              <SummaryStat label="Skipped" value={result.summary.skipped} />
              <SummaryStat label="Errors" value={result.summary.errors} />
            </div>
            {result.summary.errorDetails.length > 0 && (
              <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
                <p className="mb-1 font-medium">Error details:</p>
                <ul className="list-inside list-disc space-y-0.5">
                  {result.summary.errorDetails.slice(0, 10).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button onClick={reset}>Import Another File</Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-3 text-center">
      <p className="text-lg font-semibold text-slate-800">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}
