// Terminal Types based on User Specification

export type TerminalType = 'domestic' | 'international' | 'cargo' | 'vip' | 'seasonal' | 'mixed';
export type OperatorType = 'faan' | 'private' | 'military';

export interface Terminal {
  id: string; // UUID
  organizationId: string; // UUID
  
  // Terminal Identity
  terminalCode: string; // Unique, e.g., "IT1", "GAT", "MM1"
  terminalName: string; // e.g., "International Terminal 1"
  terminalType: TerminalType;
  airportCode: string; // e.g., "MMIA"

  // Operations
  operatorType: OperatorType;
  operatorName?: string | null; // e.g., "Bi-Courtney"
  isOperational: boolean;
  isSeasonal: boolean;
  operationalMonths?: string | null; // JSON array string: "[8, 9, 10]"

  // Capacity
  annualPassengerCapacity?: number | null;
  gatesCount?: number | null;
  checkInCounters?: number | null;
  baggageCarousels?: number | null;
  
  // Management
  terminalManagerUserId?: string | null; // UUID of manager
  staffCount?: number | null;

  // Location
  latitude?: string | null;
  longitude?: string | null;
  geofenceRadius?: number | null; // meters

  // Metadata
  description?: string | null;
  concessionAgreementUrl?: string | null;
  concessionExpiryDate?: string | null; // YYYY-MM-DD
  
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
}

export interface TerminalInput {
  organizationId: string;
  terminalCode: string;
  terminalName: string;
  terminalType: TerminalType;
  airportCode: string;
  operatorType: OperatorType;
  
  // Optional at creation
  operatorName?: string;
  isOperational?: boolean;
  isSeasonal?: boolean;
  operationalMonths?: string;
  
  annualPassengerCapacity?: number;
  gatesCount?: number;
  checkInCounters?: number;
  baggageCarousels?: number;
  
  terminalManagerUserId?: string;
  
  latitude?: string;
  longitude?: string;
  geofenceRadius?: number;
  
  description?: string;
  concessionAgreementUrl?: string;
  concessionExpiryDate?: string;
}

export interface TerminalUpdate extends Partial<Omit<TerminalInput, 'organizationId'>> {
  // Inherits all fields from Input as optional, except orgId which shouldn't change
}

export interface TerminalStats {
  assignedStaff: number;
  activeRosters: number;
  activeInspections: number;
  activeTasks: number;
}
