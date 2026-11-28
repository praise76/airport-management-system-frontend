import { describe, expect, it, vi } from "vitest";
const get = vi.hoisted(() => vi.fn());
vi.mock("./client", () => ({ api: { get } }));
import { listStakeholderPermits } from "./stakeholder-portal";
describe("permit company identity", () => {
 it("preserves the approved company code for the printable permit", async () => {
  get.mockResolvedValue({data:{data:[{id:"permit",stakeholderOrganizationId:"company",concessionaireCode:"MMIA-CON-2026-0001",permitNumber:"PER-1",permitType:"temporary",accessLevel:"landside",personnelName:"Test Person",validFrom:"2026-11-01",validUntil:"2027-01-01",status:"approved",createdAt:"2026-11-01"}]}});
  const result=await listStakeholderPermits("company");
  expect(result.data[0]).toMatchObject({personName:"Test Person",concessionaireCode:"MMIA-CON-2026-0001"});
 });
});
