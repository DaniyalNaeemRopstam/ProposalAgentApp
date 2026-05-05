import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import type { QueryClient } from "@tanstack/react-query";
import { serverApi } from "./api";
import { requestMarkProposalSent } from "./markProposalSentApi";

export const PENDING_MUTATIONS_KEY = "pa_pending_mutations";

export type PendingMarkSent = {
  kind: "mark_sent";
  proposalId: string;
  queuedAt: number;
};

function isPendingMarkSent(x: unknown): x is PendingMarkSent {
  return (
    typeof x === "object" &&
    x !== null &&
    (x as PendingMarkSent).kind === "mark_sent" &&
    typeof (x as PendingMarkSent).proposalId === "string"
  );
}

export async function readPendingQueue(): Promise<PendingMarkSent[]> {
  const raw = await AsyncStorage.getItem(PENDING_MUTATIONS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPendingMarkSent);
  } catch {
    return [];
  }
}

async function writeQueue(items: PendingMarkSent[]): Promise<void> {
  await AsyncStorage.setItem(PENDING_MUTATIONS_KEY, JSON.stringify(items));
}

export async function enqueueMarkProposalSent(proposalId: string): Promise<void> {
  const q = await readPendingQueue();
  const filtered = q.filter((x) => x.proposalId !== proposalId);
  filtered.push({ kind: "mark_sent", proposalId, queuedAt: Date.now() });
  await writeQueue(filtered);
}

export function isLikelyNetworkFailure(e: unknown): boolean {
  if (e instanceof TypeError) return true;
  if (
    e instanceof Error &&
    /network|failed to fetch|internet|offline|load failed/i.test(e.message)
  ) {
    return true;
  }
  return false;
}

export async function flushPendingMutationQueue(
  queryClient: QueryClient
): Promise<void> {
  const net = await NetInfo.fetch();
  if (net.isConnected === false) return;
  if (net.isInternetReachable === false) return;

  const q = await readPendingQueue();
  if (!q.length) return;

  const remaining: PendingMarkSent[] = [];
  for (const item of q) {
    try {
      await requestMarkProposalSent(item.proposalId);
    } catch {
      remaining.push(item);
    }
  }

  const cleared = remaining.length < q.length;
  await writeQueue(remaining);
  if (cleared) {
    await queryClient.invalidateQueries({ queryKey: ["sequences"] });
    await queryClient.invalidateQueries({ queryKey: ["jobs"] });
    await queryClient.invalidateQueries({ queryKey: ["job"] });
    await queryClient.invalidateQueries({ queryKey: ["proposals"] });
  }
}
