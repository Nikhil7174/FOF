import type { ParticipantStats, SportRecord } from "@/types";

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
