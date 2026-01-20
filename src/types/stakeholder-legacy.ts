// Stakeholder Types based on OpenAPI spec

// Airlines
export interface Airline {
  id: string;
  organizationId: string;
  name: string;
  iataCode: string;
  icaoCode?: string;
  country?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AirlineInput {
  organizationId: string;
  name: string;
  iataCode: string;
  icaoCode?: string;
  country?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface AirlineRequest {
  id: string;
  airlineId: string;
  requestType: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

// Vendors
export interface Vendor {
  id: string;
  organizationId: string;
  name: string;
  vendorType?: string;
  contactEmail?: string;
  contactPhone?: string;
  averageRating?: number;
  isActive: boolean;
  createdAt: string;
}

export interface VendorInput {
  organizationId: string;
  name: string;
  vendorType?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface VendorRating {
  id: string;
  vendorId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface VendorRatingInput {
  vendorId: string;
  rating: number;
  comment?: string;
}

// Regulatory
export type RegulatoryAgency = "NCAA" | "FAAN" | "CUSTOMS" | "IMMIGRATION";

export interface RegulatorySubmission {
  id: string;
  organizationId: string;
  agency: RegulatoryAgency;
  reportType: string;
  status: "submitted" | "accepted" | "rejected";
  reportData?: Record<string, any>;
  submittedAt: string;
}

export interface RegulatorySubmissionInput {
  organizationId: string;
  agency: RegulatoryAgency;
  reportType: string;
  reportData?: Record<string, any>;
}
