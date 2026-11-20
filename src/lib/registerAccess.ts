/**
 * Incoming mail is registered only at the RGM's office: the RGM, the registry clerks and the
 * administrators. The server refuses everyone else, so the screens stop offering it to them
 * (MMIA test pack: an HOD could register incoming mail).
 */
const REGISTERS_INCOMING = new Set(["rgm", "registry_clerk", "super_admin", "org_admin"]);

export const canRegisterIncoming = (role?: string | null): boolean =>
	!!role && REGISTERS_INCOMING.has(role);
