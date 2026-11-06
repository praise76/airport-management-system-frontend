import "leaflet/dist/leaflet.css";
import { LocateFixed, Redo2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	Circle,
	CircleMarker,
	MapContainer,
	Polygon,
	TileLayer,
	Tooltip,
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

/**
 * Reads typed coordinates, one point per line as "latitude, longitude" (spaces, commas or
 * semicolons between them). Returns the points or the first problem in plain words.
 */
export function parseCoordinates(
	text: string,
): { points: Point[] } | { error: string } {
	const points: Point[] = [];
	const lines = text
		.split(/\n/)
		.map((l) => l.trim())
		.filter(Boolean);
	for (const [i, line] of lines.entries()) {
		const nums = line
			.split(/[\s,;]+/)
			.filter(Boolean)
			.map(Number);
		if (nums.length !== 2 || nums.some((n) => Number.isNaN(n))) {
			return {
				error: `Line ${i + 1} ("${line}") needs two numbers: latitude, longitude.`,
			};
		}
		const [lat, lng] = nums;
		if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
			return {
				error: `Line ${i + 1}: latitude must be between -90 and 90, longitude between -180 and 180.`,
			};
		}
		points.push({ lat, lng });
	}
	return { points };
}

/** Lagos is about 6.5° N, 3.3° E; the two numbers swapped is the commonest typing mistake. */
function looksSwapped(points: Point[]): boolean {
	return (
		points.length > 0 &&
		points.every(
			(p) => p.lat > 2.5 && p.lat < 4.5 && p.lng > 5.5 && p.lng < 7.5,
		)
	);
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

	const [typed, setTyped] = useState("");
	const [typedProblem, setTypedProblem] = useState<string | null>(null);

	const applyTyped = () => {
		const result = parseCoordinates(typed);
		if ("error" in result) return setTypedProblem(result.error);
		const pts = result.points;
		if (looksSwapped(pts)) {
			return setTypedProblem(
				"These look like longitude, latitude. Put latitude first (about 6.5 for Lagos), then longitude (about 3.3).",
			);
		}
		if (value.type === "circle") {
			if (pts.length !== 1)
				return setTypedProblem("For a circle, enter one point: the centre.");
			setTypedProblem(null);
			onChange?.({
				...value,
				latitude: pts[0].lat,
				longitude: pts[0].lng,
				radius: value.radius || 100,
			});
			return;
		}
		if (pts.length < 3)
			return setTypedProblem(
				"An area needs at least three corners, one per line.",
			);
		setTypedProblem(null);
		onChange?.({ ...value, polygon: polygonFromVertices(pts) });
	};

	// Walk the boundary on site and add each corner where you stand.
	const addMyLocationAsCorner = async () => {
		if (!onChange) return;
		try {
			const position = await getPosition();
			onChange({
				...value,
				polygon: polygonFromVertices([
					...vertices,
					{ lat: position.coords.latitude, lng: position.coords.longitude },
				]),
			});
			toast.success(
				`Corner ${vertices.length + 1} added (accurate to about ${Math.round(position.coords.accuracy)} m).`,
			);
		} catch (error) {
			toast.error(locationErrorMessage(error as GeolocationPositionError));
		}
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
									onClick={addMyLocationAsCorner}
									title="Stand at a corner of the area and tap this; repeat at each corner"
									className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-medium hover:bg-muted"
								>
									<LocateFixed className="h-4 w-4" /> Add my location
								</button>
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

			{!readOnly && (
				<details className="rounded-lg border p-3 text-sm">
					<summary className="cursor-pointer font-medium">
						Type coordinates instead
					</summary>
					<div className="mt-3 space-y-2">
						<p className="text-muted-foreground">
							{value.type === "circle"
								? "Enter the centre as latitude, longitude, for example 6.5774, 3.3212."
								: "Enter each corner on its own line as latitude, longitude, going round the area in order. For example:"}
						</p>
						<textarea
							aria-label="Coordinates"
							value={typed}
							onChange={(e) => setTyped(e.target.value)}
							rows={value.type === "circle" ? 1 : 5}
							placeholder={
								value.type === "circle"
									? "6.5774, 3.3212"
									: "6.5842, 3.3205\n6.5842, 3.3232\n6.5828, 3.3232\n6.5828, 3.3205"
							}
							className="w-full rounded-lg border bg-background p-2 font-mono text-sm"
						/>
						{typedProblem && (
							<p role="alert" className="text-destructive">
								{typedProblem}
							</p>
						)}
						<div className="flex flex-wrap gap-2">
							<button
								type="button"
								onClick={applyTyped}
								className="rounded-lg bg-primary px-3 py-2 font-medium text-primary-foreground"
							>
								Show on map
							</button>
							{value.type === "polygon" && vertices.length > 0 && (
								<button
									type="button"
									onClick={() =>
										setTyped(
											vertices
												.map((p) => `${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`)
												.join("\n"),
										)
									}
									className="rounded-lg border px-3 py-2 font-medium hover:bg-muted"
								>
									Copy current corners here
								</button>
							)}
						</div>
					</div>
				</details>
			)}

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

type OverviewZone = {
	id: string;
	name: string;
	type?: string;
	isActive?: boolean;
	latitude?: number | string;
	longitude?: number | string;
	radius?: number | string;
	polygonJson?: { coordinates?: number[][][] } | null;
};

function FitAll({ points }: { points: [number, number][] }) {
	const map = useMap();
	const key = points.map((p) => p.join(",")).join(";");
	// biome-ignore lint/correctness/useExhaustiveDependencies: key tracks coordinate content without rerunning for array identity changes
	useEffect(() => {
		if (points.length)
			map.fitBounds(points, { padding: [24, 24], maxZoom: 17 });
	}, [key, map]);
	return null;
}

/** Every zone on one map with its name, so gaps and overlaps between terminals are visible. */
export function ZonesOverviewMap({
	zones,
	onSelect,
}: {
	zones: OverviewZone[];
	onSelect?: (id: string) => void;
}) {
	const shapes = zones.map((z) => {
		const ring = z.polygonJson?.coordinates?.[0] ?? [];
		const pts: [number, number][] =
			z.type === "polygon"
				? ring.map(([lng, lat]) => [lat, lng] as [number, number])
				: [];
		const centre: [number, number] | null =
			z.latitude !== undefined && z.longitude !== undefined
				? [Number(z.latitude), Number(z.longitude)]
				: null;
		return { z, pts, centre };
	});
	const all = shapes.flatMap((s) =>
		s.pts.length ? s.pts : s.centre ? [s.centre] : [],
	);
	return (
		<div className="relative h-[420px] overflow-hidden rounded-2xl border bg-muted">
			<MapContainer
				center={all[0] ?? MMIA_CENTER}
				zoom={15}
				scrollWheelZoom
				className="h-full w-full"
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				<FitAll points={all} />
				{shapes.map(({ z, pts, centre }) => {
					const colour = z.isActive === false ? "#94a3b8" : "#7c3aed";
					const events = { click: () => onSelect?.(z.id) };
					const label = (
						<Tooltip
							key={`${z.id}-label`}
							permanent
							direction="center"
							className="!bg-white/90 !text-xs !font-semibold"
						>
							{z.name}
						</Tooltip>
					);
					if (pts.length >= 3)
						return (
							<Polygon
								key={z.id}
								positions={pts}
								pathOptions={{ color: colour, weight: 2, fillOpacity: 0.2 }}
								eventHandlers={events}
							>
								{label}
							</Polygon>
						);
					if (centre)
						return (
							<Circle
								key={z.id}
								center={centre}
								radius={Number(z.radius) || 100}
								pathOptions={{ color: colour, weight: 2, fillOpacity: 0.2 }}
								eventHandlers={events}
							>
								{label}
							</Circle>
						);
					return null;
				})}
			</MapContainer>
		</div>
	);
}
