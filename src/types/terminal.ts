// Terminal Types based on OpenAPI spec

export interface Terminal {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description?: string;
  location?: string;
  type?: "domestic" | "international" | "cargo" | "general_aviation";
  isActive: boolean;
  createdAt: string;
}

export interface TerminalInput {
  organizationId: string;
  code: string;
  name: string;
  airportCode: string; // Required by backend
  description?: string;
  location?: string;
  type?: "domestic" | "international" | "cargo" | "general_aviation";
}

export interface TerminalUpdate {
  code?: string;
  name?: string;
  description?: string;
  location?: string;
  type?: "domestic" | "international" | "cargo" | "general_aviation";
  isActive?: boolean;
}

export interface TerminalStats {
  assignedStaff: number;
  activeRosters: number;
  activeInspections: number;
  activeTasks: number;
}
