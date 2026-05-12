import type { Types } from "mongoose";
import { Job } from "../models/Job";

/**
 * Copy aggregated jobs already in the DB (from any account) into a new user's feed.
 * Needed when aggregation ran before signup or when global dedup skipped inserts.
 */
export async function backfillAggregatedJobsForUser(userId: Types.ObjectId): Promise<number> {
  const templates = await Job.aggregate<{
    _id: { externalId: string; platform: string };
    doc: Record<string, unknown>;
  }>([
    {
      $match: {
        isAggregated: true,
        archived: false,
        externalId: { $exists: true, $nin: [null, ""] },
        score: { $gte: 61 },
      },
    },
    { $sort: { score: -1, fetchedAt: -1 } },
    {
      $group: {
        _id: { externalId: "$externalId", platform: "$platform" },
        doc: { $first: "$$ROOT" },
      },
    },
  ]);

  if (!templates.length) return 0;

  const existing = await Job.find(
    { userId, isAggregated: true },
    { externalId: 1, platform: 1 }
  ).lean();
  const have = new Set(existing.map((j) => `${j.platform}::${j.externalId}`));

  const toInsert = templates
    .filter((t) => !have.has(`${t._id.platform}::${t._id.externalId}`))
    .map(({ doc }) => {
      const {
        _id: _omitId,
        userId: _omitUser,
        createdAt: _c,
        updatedAt: _u,
        __v: _v,
        ...rest
      } = doc as Record<string, unknown> & {
        _id?: unknown;
        userId?: unknown;
        createdAt?: unknown;
        updatedAt?: unknown;
        __v?: unknown;
      };
      return { ...rest, userId };
    });

  if (!toInsert.length) return 0;

  try {
    const inserted = await Job.insertMany(toInsert, { ordered: false });
    return inserted.length;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: number }).code === 11000 &&
      "insertedDocs" in error
    ) {
      return ((error as { insertedDocs?: unknown[] }).insertedDocs ?? []).length;
    }
    throw error;
  }
}
