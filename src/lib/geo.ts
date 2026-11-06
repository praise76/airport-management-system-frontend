/** Location helpers for geofenced check-in. */

export interface ZoneLike {
	id: string;
	name: string;
	type?: "circle" | "polygon" | string;
	latitude?: number;
	longitude?: number;
	radius?: number;
	isActive?: boolean;
	polygonJson?: { coordinates?: number[][][] } | null;
}

/** Distance in metres between two points (haversine). */
export function distanceMetres(
	aLat: number,
	aLng: number,
	bLat: number,
	bLng: number,
): number {
	const R = 6371000;
	const toRad = (d: number) => (d * Math.PI) / 180;
	const dLat = toRad(bLat - aLat);
	const dLng = toRad(bLng - aLng);
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(h));
}

function centreOf(z: ZoneLike): [number, number] | null {
	if (typeof z.latitude === "number" && typeof z.longitude === "number")
		return [z.latitude, z.longitude];
	const ring = z.polygonJson?.coordinates?.[0];
	if (ring?.length) {
		// GeoJSON stores [lng, lat]
		const lat = ring.reduce((s, p) => s + p[1], 0) / ring.length;
		const lng = ring.reduce((s, p) => s + p[0], 0) / ring.length;
		return [lat, lng];
	}
	return null;
}

/** True when the point is inside the polygon ring (GeoJSON [lng, lat] pairs), by ray casting. */
function insideRing(lat: number, lng: number, ring: number[][]): boolean {
	let inside = false;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const [xi, yi] = ring[i];
		const [xj, yj] = ring[j];
		if (
			yi > lat !== yj > lat &&
			lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
		)
			inside = !inside;
	}
	return inside;
}

/** Metres from a point to the nearest point on a segment (flat-earth; fine over a few km). */
function metresToSegment(
	lat: number,
	lng: number,
	a: number[],
	b: number[],
): number {
	const k = 111320,
		kx = k * Math.cos((lat * Math.PI) / 180);
	const ax = (a[0] - lng) * kx,
		ay = (a[1] - lat) * k,
		bx = (b[0] - lng) * kx,
		by = (b[1] - lat) * k;
	const dx = bx - ax,
		dy = by - ay,
		len2 = dx * dx + dy * dy;
	const t = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
	return Math.hypot(ax + t * dx, ay + t * dy);
}

/** Metres from the point to the zone's edge; 0 when inside. */
function metresOutside(lat: number, lng: number, z: ZoneLike): number | null {
	const ring = z.polygonJson?.coordinates?.[0];
	if (z.type === "polygon" && ring && ring.length >= 3) {
		if (insideRing(lat, lng, ring)) return 0;
		let best = Infinity;
		for (let i = 0; i < ring.length; i++)
			best = Math.min(
				best,
				metresToSegment(lat, lng, ring[i], ring[(i + 1) % ring.length]),
			);
		return Math.round(best);
	}
	const c = centreOf(z);
	if (!c) return null;
	return Math.max(
		0,
		Math.round(distanceMetres(lat, lng, c[0], c[1]) - (z.radius ?? 0)),
	);
}

/**
 * The nearest active zone and how far outside its edge the person is (0 when inside).
 * Area-shaped zones are measured to their edge; before, they were measured to their centre,
 * so someone at a terminal's door was told they were hundreds of metres away.
 * Used only to tell staff where they are; the server decides when they tap Check in.
 */
export function nearestZone(
	lat: number,
	lng: number,
	zones: ZoneLike[],
): { zone: ZoneLike; metresAway: number } | null {
	let best: { zone: ZoneLike; metresAway: number } | null = null;
	for (const z of zones) {
		if (z.isActive === false) continue;
		const away = metresOutside(lat, lng, z);
		if (away === null) continue;
		if (!best || away < best.metresAway) best = { zone: z, metresAway: away };
	}
	return best;
}

/** Plain-language reason for a failed GPS read. */
export function locationErrorMessage(
	err: GeolocationPositionError | { code?: number },
): string {
	switch (err?.code) {
		case 1:
			return "Location is turned off for this site. Allow location access in your browser settings, then try again.";
		case 2:
			return "Your phone couldn't find its location. Move near a window or outside and try again.";
		case 3:
			return "Finding your location took too long. Please try again.";
		default:
			return "Couldn't read your location. Please try again.";
	}
}

/** True for errors from the browser's GPS, as opposed to errors from the server. */
export function isLocationError(err: unknown): err is GeolocationPositionError {
	return (
		typeof err === "object" &&
		err !== null &&
		"code" in err &&
		typeof (err as { code: unknown }).code === "number" &&
		!("status" in err)
	);
}

export function getPosition(timeoutMs = 15000): Promise<GeolocationPosition> {
	return new Promise((resolve, reject) => {
		if (typeof navigator === "undefined" || !navigator.geolocation) {
			reject({ code: 2 });
			return;
		}
		navigator.geolocation.getCurrentPosition(resolve, reject, {
			enableHighAccuracy: true,
			timeout: timeoutMs,
			maximumAge: 10000,
		});
	});
}

/**
 * A stable ID for this browser on this device, kept in local storage.
 * (The browser's name, used before, is the same on thousands of phones.)
 */
export function getDeviceId(): string {
	const KEY = "nams_device_id";
	try {
		const existing = localStorage.getItem(KEY);
		if (existing) return existing;
		const id =
			typeof crypto !== "undefined" && "randomUUID" in crypto
				? crypto.randomUUID()
				: `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
		localStorage.setItem(KEY, id);
		return id;
	} catch {
		return "unknown-device";
	}
}
