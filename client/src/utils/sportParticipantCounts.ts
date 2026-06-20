import type { ParticipantStats, SportRecord } from "@/types";

/** Count top-level sports only (excludes sub-sports with a parentId). */
export function countParentSports(sports: Array<{ parentId?: string | null }>): number {
  return sports.filter((s) => !s.parentId).length;
}

export function getSportCounts(
  sport: SportRecord,
  allSports: SportRecord[],
  bySportId: ParticipantStats["bySportId"],
  includeChildren = true
) {
  const childIds = includeChildren
    ? allSports.filter((s) => s.parentId === sport.id).map((s) => s.id)
    : [];
  const sportIds = [sport.id, ...childIds];

  return sportIds.reduce(
    (acc, id) => {
      const counts = bySportId[id] || { registered: 0, accepted: 0 };
      acc.registered += counts.registered;
      acc.accepted += counts.accepted;
      return acc;
    },
    { registered: 0, accepted: 0 }
  );
}
