import type { SportRecord } from "@/types";

type SportFormatFields = Pick<
  SportRecord,
  "formatCategory" | "formatTeam" | "formatGender" | "formatGeneral" | "formatFileUrl"
>;

function hasStructuredFormat(sport: SportFormatFields): boolean {
  return Boolean(
    sport.formatCategory?.trim() ||
      sport.formatTeam?.trim() ||
      sport.formatGender?.trim() ||
      sport.formatGeneral?.trim()
  );
}

export function hasSportFormat(sport: SportFormatFields): boolean {
  return hasStructuredFormat(sport);
}

interface FormatRowProps {
  label: string;
  value?: string | null;
}

function FormatRow({ label, value }: FormatRowProps) {
  return (
    <tr className="border-b last:border-b-0">
      <th className="bg-muted/50 px-4 py-3 text-left font-semibold text-foreground w-36 align-top">
        {label}
      </th>
      <td className="px-4 py-3 text-muted-foreground whitespace-pre-wrap">{value?.trim() || "—"}</td>
    </tr>
  );
}

export function SportFormatContent({ sport }: { sport: SportFormatFields }) {
  if (!hasStructuredFormat(sport)) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <tbody>
          <FormatRow label="Category" value={sport.formatCategory} />
          <FormatRow label="Team" value={sport.formatTeam} />
          <FormatRow label="Gender" value={sport.formatGender} />
          <FormatRow label="General Format" value={sport.formatGeneral} />
        </tbody>
      </table>
    </div>
  );
}
