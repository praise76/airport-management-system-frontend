import { api } from "./client";
import type {
  Airline,
  AirlineInput,
  AirlineRequest,
  Vendor,
  VendorInput,
  VendorRating,
  VendorRatingInput,
  RegulatorySubmission,
  RegulatorySubmissionInput,
} from "@/types/stakeholder";

// Airlines
export async function getAirlines(): Promise<Airline[]> {
  const res = await api.get("/stakeholders/airlines");
  return res.data.data;
}

export async function getAirline(id: string): Promise<Airline> {
  const res = await api.get(`/stakeholders/airlines/${id}`);
  return res.data.data;
}

export async function createAirline(input: AirlineInput): Promise<Airline> {
  const res = await api.post("/stakeholders/airlines", input);
  return res.data.data;
}

export async function updateAirline(id: string, input: Partial<AirlineInput>): Promise<Airline> {
  const res = await api.patch(`/stakeholders/airlines/${id}`, input);
  return res.data.data;
}

// Airline Requests
export async function getAirlineRequests(airlineId: string): Promise<AirlineRequest[]> {
  const res = await api.get(`/stakeholders/airlines/${airlineId}/requests`);
  return res.data.data;
}

// Vendors
export async function getVendors(): Promise<Vendor[]> {
  const res = await api.get("/stakeholders/vendors");
  return res.data.data;
}

export async function getVendor(id: string): Promise<Vendor> {
  const res = await api.get(`/stakeholders/vendors/${id}`);
  return res.data.data;
}

export async function createVendor(input: VendorInput): Promise<Vendor> {
  const res = await api.post("/stakeholders/vendors", input);
  return res.data.data;
}

export async function updateVendor(id: string, input: Partial<VendorInput>): Promise<Vendor> {
  const res = await api.patch(`/stakeholders/vendors/${id}`, input);
  return res.data.data;
}

// Vendor Ratings
export async function getVendorRatings(vendorId: string): Promise<VendorRating[]> {
  const res = await api.get(`/stakeholders/vendors/${vendorId}/ratings`);
  return res.data.data;
}

export async function createVendorRating(input: VendorRatingInput): Promise<VendorRating> {
  const res = await api.post("/stakeholders/vendor-ratings", input);
  return res.data.data;
}

// Regulatory
export async function getRegulatorySubmissions(): Promise<RegulatorySubmission[]> {
  const res = await api.get("/stakeholders/regulatory");
  return res.data.data;
}

export async function createRegulatorySubmission(input: RegulatorySubmissionInput): Promise<RegulatorySubmission> {
  const res = await api.post("/stakeholders/regulatory", input);
  return res.data.data;
}
