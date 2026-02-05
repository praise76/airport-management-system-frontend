import { RosterEntry } from './roster';

export type SwapType = 'direct_swap' | 'give_away' | 'marketplace';
export type Urgency = 'normal' | 'urgent' | 'emergency';
export type SwapStatus = 
  | 'pending_target' 
  | 'target_accepted' 
  | 'target_declined'
  | 'pending_supervisor'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled';

export interface SwapRequest {
  id: string;
  requestNumber: string;
  requestingStaffId: string;
  targetStaffId?: string;
  rosterEntryId: string;
  targetRosterEntryId?: string;
  
  originalDutyDate: string;
  originalShift: string;
  
  swapType: SwapType;
  urgency: Urgency;
  status: SwapStatus;
  
  reason: string;
  
  requesterGivesShift: {
    date: string;
    shift: string;
    start_time: string;
    end_time: string;
  };
  
  targetStaff?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  rosterEntry?: RosterEntry;
  
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSwapRequest {
  rosterEntryId: string;
  targetStaffId?: string;
  targetRosterEntryId?: string;
  swapType?: SwapType;
  urgency?: Urgency;
  reason: string;
  expiresInHours?: number;
}

export interface SwapResponse {
  accepted: boolean;
  notes?: string;
  counterOffer?: {
    alternativeDate?: string;
    alternativeShift?: string;
    notes?: string;
  };
}

export interface SwapReview {
  approved: boolean;
  comments?: string;
  conditions?: string[];
}

export interface CreateMarketplaceListing {
  rosterEntryId: string;
  reason?: string;
  compensationOffered?: string;
  expiresInHours?: number;
}

export interface MarketplaceListing {
  id: string;
  shiftDate: string;
  shiftType: string;
  shiftStartTime: string;
  shiftEndTime: string;
  reason: string;
  compensationOffered?: string;
  status: 'open' | 'claimed' | 'expired';
  interestedStaffIds: string[];
  expiresAt: string;
  offeringStaff: {
    id: string;
    firstName: string;
    lastName: string;
  };
  unit: {
    id: string;
    name: string;
  };
}

export interface CreditSummary {
  month: string;
  allocated: number;
  used: number;
  remaining: number;
  bonus: number;
  penalties: number;
  totalAvailable: number;
}
