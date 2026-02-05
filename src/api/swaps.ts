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

export async function createSwapRequest(data: CreateSwapRequest): Promise<SwapRequest> {
  const res = await api.post('/roster/swaps', data);
  return res.data.data;
}

export async function getMySwapRequests(status?: string): Promise<SwapRequest[]> {
  const res = await api.get('/roster/swaps/my-requests', { params: { status } });
  return res.data.data;
}

export async function getIncomingSwapRequests(): Promise<SwapRequest[]> {
  const res = await api.get('/roster/swaps/incoming');
  return res.data.data;
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
