import type { Types } from "mongoose";
import { Sequence } from "../models/Sequence";

/** Stop active follow-ups when a proposal is marked replied or won. */
export async function stopSequencesForProposal(
  proposalId: Types.ObjectId
): Promise<number> {
  const result = await Sequence.updateMany(
    { proposalId, status: "active" },
    {
      $set: {
        status: "replied",
        "messages.$[pending].status": "skipped",
      },
    },
    {
      arrayFilters: [{ "pending.status": "pending" }],
    }
  );
  return result.modifiedCount;
}
