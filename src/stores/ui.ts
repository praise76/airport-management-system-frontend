import { create } from 'zustand'

type UiState = {
  selectedOrganizationId: string | null
  setSelectedOrganizationId: (id: string | null) => void
}

export const useUiStore = create<UiState>((set) => ({
  selectedOrganizationId:
    typeof localStorage !== 'undefined' ? localStorage.getItem('selectedOrganizationId') : null,
  setSelectedOrganizationId: (id) => {
    if (id) {
      localStorage.setItem('selectedOrganizationId', id)
    } else {
      localStorage.removeItem('selectedOrganizationId')
    }
    set({ selectedOrganizationId: id })
  },
}))


