import { createFileRoute } from '@tanstack/react-router'
import { StationCheckIn } from '@/features/stations/components/StationCheckIn'
import { useListStations } from '@/hooks/useStations'

export const Route = createFileRoute('/stations/')({
  component: Page,
})

function Page() {
  const { data: stationsRes, isLoading } = useListStations();
  const stations = (stationsRes?.data || []).filter(s => s.departmentLevel === 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Station Manning</h1>
        <p className="text-sm text-[color-mix(in_oklab,var(--color-text)_60%,transparent)]">
          AVSEC Station Check-in and Post Control
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-10 opacity-50">Loading live stations...</div>
      ) : stations.length === 0 ? (
        <div className="text-center py-10 opacity-50 border-2 border-dashed rounded-xl">
          No stations found on the live backend.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stations.map(station => (
            <StationCheckIn 
              key={station.id}
              stationId={station.id} 
              stationName={station.name} 
            />
          ))}
        </div>
      )}
    </div>
  )
}
