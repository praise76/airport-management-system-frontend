import { api } from './client';
import type {
  CreateSwapRequest,
  SwapRequest,
  SwapResponse,
  SwapReview,
  CreateMarketplaceListing,
  MarketplaceListing,
  CreditSummary,
} from '@/types/swaps';

// --- Swap Requests ---

/**
 * The API stores the reason as `swapReason` and returns people only as ids unless it joins them.
 * Screens read `reason` and want names, so normalise here (QA finding RST-05: approvers saw
 * `""` for the reason and a raw user id instead of the requester's name).
 */
const fullName = (p?: { firstName?: string; lastName?: string } | null) =>
  p ? [p.firstName, p.lastName].filter(Boolean).join(' ') || undefined : undefined;

export function normalizeSwap(r: any): SwapRequest {
  const requester = r.requestingStaff ?? r.requester ?? r.requestingUser;
  const target = r.targetStaff ?? r.target ?? r.targetUser;
  return {
    ...r,
    reason: r.reason ?? r.swapReason ?? '',
    requesterName: r.requesterName ?? fullName(requester),
    targetName: r.targetName ?? fullName(target),
  };
}
const normalizeList = (list: any): SwapRequest[] => (Array.isArray(list) ? list.map(normalizeSwap) : []);

export async function createSwapRequest(data: CreateSwapRequest): Promise<SwapRequest> {
  const res = await api.post('/roster/swaps', data);
  return normalizeSwap(res.data.data);
}

export async function getMySwapRequests(status?: string): Promise<SwapRequest[]> {
  const res = await api.get('/roster/swaps/my-requests', { params: { status } });
  return normalizeList(res.data.data);
}

export async function getIncomingSwapRequests(): Promise<SwapRequest[]> {
  const res = await api.get('/roster/swaps/incoming');
  return normalizeList(res.data.data);
}

export async function respondToSwapRequest(id: string, data: SwapResponse): Promise<void> {
  await api.post(`/roster/swaps/${id}/respond`, data);
}

export async function reviewSwapRequest(id: string, data: SwapReview): Promise<void> {
  await api.post(`/roster/swaps/${id}/review`, data);
}

export async function cancelSwapRequest(id: string, reason: string): Promise<void> {
  await api.post(`/roster/swaps/${id}/cancel`, { reason });
}

// --- Marketplace ---

export async function getMarketplaceListings(params?: { unitId?: string; fromDate?: string }): Promise<MarketplaceListing[]> {
  const res = await api.get('/roster/swaps/marketplace', { params });
  return res.data.data;
}

export async function postToMarketplace(data: CreateMarketplaceListing): Promise<void> {
  await api.post('/roster/swaps/marketplace', data);
}

export async function claimMarketplaceShift(id: string, note?: string): Promise<void> {
  await api.post(`/roster/swaps/marketplace/${id}/claim`, { note });
}

export async function expressInterestInMarketplaceShift(id: string): Promise<void> {
  await api.post(`/roster/swaps/marketplace/${id}/interest`);
}

// --- Credits ---

export async function getSwapCredits(): Promise<CreditSummary> {
  const res = await api.get('/roster/swaps/credits');
  return res.data.data;
}

export async function getSwapCreditHistory(): Promise<any[]> {
  const res = await api.get('/roster/swaps/credits/history');
  return res.data.data;
}

// --- Rules ---

export async function getSwapRules(unitId: string): Promise<any> {
    const res = await api.get(`/roster/swaps/rules/${unitId}`);
    return res.data.data;
}

/** Swap requests waiting for this supervisor/manager's decision. */
export async function getSwapApprovals(): Promise<SwapRequest[]> {
  const res = await api.get('/roster/swaps/approvals');
  return normalizeList(res.data.data);
}
