import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

export type RegistrationStation = { id: string; name: string; code: string };

export function useRegistrationStations(enabled = true) {
  return useQuery({
    queryKey: ["registration-stations"],
    enabled,
    queryFn: async () => {
      const response = await api.get("/stakeholder-orgs/auth/registration-stations");
      return (response.data?.data ?? []) as RegistrationStation[];
    },
  });
}

/** This is a request for review, not permission to enter a station. */
export function RequestedStations({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const { data, isLoading, isError, refetch } = useRegistrationStations();
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-slate-300">Requested stations</legend>
      <p className="text-xs text-slate-400">Select the posts your company needs. Selection is a request and does not grant access.</p>
      {isLoading ? <p className="text-sm text-slate-400">Loading stations...</p> : isError ? (
        <p role="alert" className="text-sm text-red-300">Could not load stations. <button type="button" className="underline" onClick={() => refetch()}>Try again</button></p>
      ) : !data?.length ? <p className="text-sm text-slate-400">No stations are available.</p> : (
        <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-700 p-3 space-y-2">
          {data.map(station => <label key={station.id} className="flex items-start gap-2 text-sm text-slate-200">
            <input type="checkbox" checked={value.includes(station.id)} onChange={event => onChange(event.target.checked ? [...value, station.id] : value.filter(id => id !== station.id))} />
            <span>{station.name}</span>
          </label>)}
        </div>
      )}
    </fieldset>
  );
}
