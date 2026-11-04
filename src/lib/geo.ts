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
export function distanceMetres(aLat: number, aLng: number, bLat: number, bLng: number): number {
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
	if (typeof z.latitude === "number" && typeof z.longitude === "number") return [z.latitude, z.longitude];
	const ring = z.polygonJson?.coordinates?.[0];
	if (ring?.length) {
		// GeoJSON stores [lng, lat]
		const lat = ring.reduce((s, p) => s + p[1], 0) / ring.length;
		const lng = ring.reduce((s, p) => s + p[0], 0) / ring.length;
		return [lat, lng];
	}
	return null;
}

/**
 * The nearest active zone and how far outside its edge the person is (0 when inside a circle).
 * Used only to tell staff where to go; the server makes the real inside/outside decision.
 */
export function nearestZone(
	lat: number,
	lng: number,
	zones: ZoneLike[],
): { zone: ZoneLike; metresAway: number } | null {
	let best: { zone: ZoneLike; metresAway: number } | null = null;
	for (const z of zones) {
		if (z.isActive === false) continue;
		const c = centreOf(z);
		if (!c) continue;
		const d = distanceMetres(lat, lng, c[0], c[1]);
		const away = Math.max(0, Math.round(d - (z.radius ?? 0)));
		if (!best || away < best.metresAway) best = { zone: z, metresAway: away };
	}
	return best;
}

/** Plain-language reason for a failed GPS read. */
export function locationErrorMessage(err: GeolocationPositionError | { code?: number }): string {
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
