import { can } from "@/lib/auth";
import { listImportHistory } from "@/lib/modules/importer";
import { PageHeader, Card, CardHeader, Table, Th, Td, EmptyState, Badge } from "@/components/ui";
import { Forbidden } from "@/components/Forbidden";
import { formatDateTime } from "@/lib/utils";
import { ImportWizard } from "./ImportWizard";

export default async function ImportPage() {
  const allowed = await can("import", "view");
  if (!allowed) return <Forbidden />;

  const canAdd = await can("import", "add");
  const history = listImportHistory() as {
    id: string;
    file_name: string;
    module: string;
    imported_by_name: string | null;
    records_found: number;
    records_imported: number;
    records_updated: number;
    records_skipped: number;
    records_errors: number;
    created_at: string;
  }[];

  return (
    <div>
      <PageHeader title="Data Import Centre" subtitle="Bring your existing Excel data into the ERP without losing anything" />

      {canAdd ? (
        <ImportWizard />
      ) : (
        <Card className="p-6 text-sm text-slate-500">You do not have permission to import data. Contact your Super Admin.</Card>
      )}

      <Card className="mt-5">
        <CardHeader title="Import History" />
        {history.length === 0 ? (
          <EmptyState title="No imports yet" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>File</Th>
                <Th>Module</Th>
                <Th>Imported By</Th>
                <Th>Found</Th>
                <Th>Imported</Th>
                <Th>Updated</Th>
                <Th>Skipped</Th>
                <Th>Errors</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <Td className="font-medium text-slate-800">{h.file_name}</Td>
                  <Td>
                    <Badge value={h.module.toUpperCase()} label={h.module} />
                  </Td>
                  <Td>{h.imported_by_name ?? "-"}</Td>
                  <Td>{h.records_found}</Td>
                  <Td>{h.records_imported}</Td>
                  <Td>{h.records_updated}</Td>
                  <Td>{h.records_skipped}</Td>
                  <Td>{h.records_errors}</Td>
                  <Td>{formatDateTime(h.created_at)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
