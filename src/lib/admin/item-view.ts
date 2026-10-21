import "server-only";
import { assetViews, getItemDetail, itemResponses } from "./approvals-data";
import { loadOfflineApproval, offlineApprovalFor } from "./board-data";
import { getClient, listTasks, listTeam } from "./ops-data";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Everything the content item page and drawer show (one loader, so both stay identical). */
export async function loadItemView(id: string) {
  if (!UUID.test(id)) return null;
  const item = await getItemDetail(id);
  if (!item) return null;
  const [client, tasks, team, assets, responses, offline, allowOffline] = await Promise.all([
    getClient(item.clientId),
    listTasks({ to: "9999-12-31", itemIds: [id] }),
    listTeam(),
    assetViews(item.assetLinks),
    itemResponses(id),
    offlineApprovalFor(id),
    loadOfflineApproval(),
  ]);
  if (!client) return null;
  return { item, client, tasks, team, assets, responses, offline, allowOffline };
}

export type ItemView = NonNullable<Awaited<ReturnType<typeof loadItemView>>>;
