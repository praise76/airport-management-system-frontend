import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as swapApi from '@/api/swaps';
import type { CreateSwapRequest, SwapResponse, SwapReview, CreateMarketplaceListing } from '@/types/swaps';

export const useMySwapRequests = (status?: string) => {
  return useQuery({
    queryKey: ['swaps', 'my-requests', status],
    queryFn: () => swapApi.getMySwapRequests(status),
  });
};

export const useIncomingSwaps = () => {
  return useQuery({
    queryKey: ['swaps', 'incoming'],
    queryFn: () => swapApi.getIncomingSwapRequests(),
  });
};

export const useCreateSwap = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSwapRequest) => swapApi.createSwapRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swaps'] });
    },
  });
};

export const useRespondToSwap = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & SwapResponse) => 
      swapApi.respondToSwapRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['swaps'] });
    },
  });
};

export const useReviewSwap = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: { id: string } & SwapReview) =>
            swapApi.reviewSwapRequest(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['swaps'] });
        },
    });
};

export const useCancelSwap = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            swapApi.cancelSwapRequest(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['swaps'] });
        },
    });
};

export const useMarketplace = (filters?: { unitId?: string; fromDate?: string }) => {
  return useQuery({
    queryKey: ['marketplace', filters],
    queryFn: () => swapApi.getMarketplaceListings(filters),
  });
};

export const usePostToMarketplace = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateMarketplaceListing) => swapApi.postToMarketplace(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketplace'] });
            queryClient.invalidateQueries({ queryKey: ['swaps'] });
        },
    });
};

export const useClaimMarketplaceShift = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, note }: { id: string; note?: string }) =>
            swapApi.claimMarketplaceShift(id, note),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['marketplace'] });
            queryClient.invalidateQueries({ queryKey: ['swaps'] });
        },
    });
};

export const useSwapCredits = () => {
  return useQuery({
    queryKey: ['swap-credits'],
    queryFn: () => swapApi.getSwapCredits(),
  });
};

export const useSwapCreditHistory = () => {
    return useQuery({
        queryKey: ['swap-credits', 'history'],
        queryFn: () => swapApi.getSwapCreditHistory(),
    });
};
