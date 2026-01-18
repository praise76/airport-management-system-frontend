export type ContractorOrganization = {
  id: string
  organizationName: string
  registrationNumber: string
  contactPerson: string
  contactEmail: string
  contactPhone: string
  address: string
  organizationType: 'contractor'
  status: 'active' | 'pending' | 'suspended'
}

export type ContractorPersonnel = {
  id: string
  organizationId: string
  firstName: string
  lastName: string
  phone: string
  idType: 'nin' | 'passport' | 'other'
  idNumber: string
  position: string
}

export type PassApplication = {
  id: string
  organizationId: string
  passType: 'apron' | 'visitor'
  purpose: string
  projectName: string
  startDate: string
  endDate: string
  personnelCount: number
  status: 'pending' | 'approved' | 'rejected'
}

export type RegisterContractorRequest = Omit<ContractorOrganization, 'id' | 'status'>
export type RegisterPersonnelRequest = Omit<ContractorPersonnel, 'id'>
export type ApplyPassRequest = Omit<PassApplication, 'id' | 'status'> & {
  personnelList: Array<{
    firstName: string
    lastName: string
    idType: string
    idNumber: string
  }>
}
