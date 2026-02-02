export interface TerminalRepresentative {
  id: string
  terminalId: string
  userId: string
  departmentId: string
  role: string
  isPrimary: "Y" | "N"
  user: {
    firstName: string
    lastName: string
    position?: string
  }
  department: {
    name: string
  }
  createdAt: string
}

export interface TerminalRepresentativeInput {
  userId: string
  departmentId: string
  role: string
  isPrimary?: "Y" | "N"
}

export type TerminalType = "domestic" | "international" | "cargo" | "general_aviation" | "vip" | "seasonal" | "mixed";

export interface Terminal {
  id: string;
  organizationId: string;
  terminalName: string;
  terminalCode: string;
  terminalType: TerminalType;
  airportCode: string;
  location?: string;
  description?: string;
  isOperational: boolean;
  operatorType: string;
  operatorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TerminalInput {
  terminalName: string;
  terminalCode: string;
  airportCode: string;
  terminalType: TerminalType;
  organizationId: string;
  location?: string;
  description?: string;
  isOperational: boolean;
  operatorType: string;
  isSeasonal?: boolean;
}

export interface TerminalUpdate extends Partial<TerminalInput> {}

export interface TerminalStats {
  assignedStaff: number;
  activeRosters: number;
  activeInspections: number;
  activeTasks: number;
}

export interface TerminalReportInput {
  reportDate?: string;
  reportPeriod?: "daily" | "weekly" | "monthly";
  totalPassengers?: number;
  totalFlights?: number;
  incidentsCount: number;
  equipmentDowntimeHours?: number;
  achievements: string;
  challenges?: string;
  actionItems?: string;
}
