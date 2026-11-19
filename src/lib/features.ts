/**
 * Screens that are built but whose server routes are missing. They are switched off: no menu link,
 * and opening the address sends the person to the dashboard instead of a page that never loads.
 * Turn one on when its backend ships. (The terminal imprest has its own flag in lib/imprest.ts.)
 */
export const INSPECTIONS_ENABLED = false;
