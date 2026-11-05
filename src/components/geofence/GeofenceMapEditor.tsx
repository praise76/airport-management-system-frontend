import "leaflet/dist/leaflet.css";
import { LocateFixed, Redo2, Trash2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import {
	Circle,
	CircleMarker,
	MapContainer,
	Polygon,
	TileLayer,
	useMap,
	useMapEvents,
} from "react-leaflet";
import { toast } from "sonner";
import { getPosition, locationErrorMessage } from "@/lib/geo";

export type GeofenceMapValue = {
	type: "circle" | "polygon";
	latitude?: number;
	longitude?: number;
	radius?: number;
	polygon?: {
		type: "Polygon";
		coordinates: number[][][];
	};
};

type Point = { lat: number; lng: number };

const MMIA_CENTER: [number, number] = [6.5774, 3.3212];

function verticesFromPolygon(polygon?: GeofenceMapValue["polygon"]): Point[] {
	const ring = polygon?.coordinates?.[0] ?? [];
	const points = ring.map(([lng, lat]) => ({ lat, lng }));
	if (
		points.length > 1 &&
		points[0].lat === points[points.length - 1].lat &&
		points[0].lng === points[points.length - 1].lng
	) {
		return points.slice(0, -1);
	}
	return points;
}

function polygonFromVertices(vertices: Point[]): GeofenceMapValue["polygon"] {
	const ring = vertices.map(({ lat, lng }) => [lng, lat]);
	if (ring.length) ring.push([...ring[0]]);
	return { type: "Polygon", coordinates: [ring] };
}

function MapClick({
	disabled,
	onPoint,
}: {
	disabled: boolean;
	onPoint: (point: Point) => void;
}) {
	useMapEvents({
		click(event) {
			if (!disabled) onPoint(event.latlng);
		},
	});
	return null;
}

function Recenter({ center }: { center: [number, number] }) {
	const map = useMap();
	useEffect(() => {
		if (!map.getBounds().contains(center)) map.panTo(center);
	}, [center, map]);
	return null;
}

export function GeofenceMapEditor({
	value,
	onChange,
	readOnly = false,
}: {
	value: GeofenceMapValue;
	onChange?: (value: GeofenceMapValue) => void;
	readOnly?: boolean;
}) {
	const vertices = useMemo(
		() => verticesFromPolygon(value.polygon),
		[value.polygon],
	);
	const center: [number, number] =
		value.type === "circle" &&
		value.latitude !== undefined &&
		value.longitude !== undefined
			? [value.latitude, value.longitude]
			: vertices[0]
				? [vertices[0].lat, vertices[0].lng]
				: MMIA_CENTER;

	const setPoint = (point: Point) => {
		if (!onChange) return;
		if (value.type === "circle") {
			onChange({
				...value,
				latitude: point.lat,
				longitude: point.lng,
				radius: value.radius || 100,
			});
			return;
		}
		onChange({ ...value, polygon: polygonFromVertices([...vertices, point]) });
	};

	const useCurrentLocation = async () => {
		if (!onChange) return;
		try {
			const position = await getPosition();
			onChange({
				...value,
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
				radius: value.radius || 100,
			});
			toast.success(
				`Map centred on your location (about ${Math.round(position.coords.accuracy)} m accuracy).`,
			);
		} catch (error) {
			toast.error(locationErrorMessage(error as GeolocationPositionError));
		}
	};

	return (
		<div className="space-y-3">
			{!readOnly && (
				<div className="flex flex-wrap items-center justify-between gap-2 text-sm">
					<p className="text-muted-foreground">
						{value.type === "circle"
							? "Click the map to place the zone centre, then adjust its radius."
							: "Click around the terminal boundary to draw at least three points."}
					</p>
					<div className="flex gap-2">
						{value.type === "circle" ? (
							<button
								type="button"
								onClick={useCurrentLocation}
								className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-medium hover:bg-muted"
							>
								<LocateFixed className="h-4 w-4" /> Use my location
							</button>
						) : (
							<>
								<button
									type="button"
									disabled={!vertices.length}
									onClick={() =>
										onChange?.({
											...value,
											polygon: polygonFromVertices(vertices.slice(0, -1)),
										})
									}
									className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-medium hover:bg-muted disabled:opacity-40"
								>
									<Redo2 className="h-4 w-4 -scale-x-100" /> Undo point
								</button>
								<button
									type="button"
									disabled={!vertices.length}
									onClick={() =>
										onChange?.({ ...value, polygon: polygonFromVertices([]) })
									}
									className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-medium text-destructive hover:bg-muted disabled:opacity-40"
								>
									<Trash2 className="h-4 w-4" /> Clear
								</button>
							</>
						)}
					</div>
				</div>
			)}

			<div className="relative h-[360px] overflow-hidden rounded-2xl border bg-muted">
				<MapContainer
					center={center}
					zoom={16}
					scrollWheelZoom
					className="h-full w-full"
					attributionControl
				>
					<TileLayer
						attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
					/>
					<Recenter center={center} />
					<MapClick disabled={readOnly} onPoint={setPoint} />

					{value.type === "circle" &&
						value.latitude !== undefined &&
						value.longitude !== undefined && (
							<>
								<Circle
									center={[value.latitude, value.longitude]}
									radius={value.radius || 100}
									pathOptions={{
										color: "#2563eb",
										fillColor: "#3b82f6",
										fillOpacity: 0.22,
									}}
								/>
								<CircleMarker
									center={[value.latitude, value.longitude]}
									radius={6}
									pathOptions={{
										color: "#fff",
										fillColor: "#2563eb",
										fillOpacity: 1,
										weight: 2,
									}}
								/>
							</>
						)}

					{value.type === "polygon" && vertices.length > 0 && (
						<>
							{vertices.length >= 3 && (
								<Polygon
									positions={vertices}
									pathOptions={{
										color: "#7c3aed",
										fillColor: "#8b5cf6",
										fillOpacity: 0.22,
									}}
								/>
							)}
							{vertices.map((point, index) => (
								<CircleMarker
									key={`${point.lat}-${point.lng}-${index}`}
									center={[point.lat, point.lng]}
									radius={5}
									pathOptions={{
										color: "#fff",
										fillColor: "#7c3aed",
										fillOpacity: 1,
										weight: 2,
									}}
								/>
							))}
						</>
					)}
				</MapContainer>
			</div>

			{!readOnly && value.type === "circle" && (
				<div className="grid gap-3 sm:grid-cols-[1fr_130px] sm:items-center">
					<input
						type="range"
						min={10}
						max={2000}
						step={10}
						value={value.radius || 100}
						onChange={(event) =>
							onChange?.({ ...value, radius: Number(event.target.value) })
						}
						aria-label="Zone radius"
					/>
					<label className="flex items-center gap-2 text-sm">
						<input
							type="number"
							min={1}
							max={10000}
							value={value.radius || 100}
							onChange={(event) =>
								onChange?.({ ...value, radius: Number(event.target.value) })
							}
							className="h-10 w-24 rounded-lg border bg-background px-3"
						/>
						metres
					</label>
				</div>
			)}

			{!readOnly && value.type === "polygon" && (
				<p
					className={
						vertices.length >= 3
							? "text-sm text-emerald-600"
							: "text-sm text-amber-600"
					}
				>
					{vertices.length} point{vertices.length === 1 ? "" : "s"} selected
					{vertices.length < 3
						? ` — add ${3 - vertices.length} more`
						: " — boundary ready"}
					.
				</p>
			)}
		</div>
	);
}
