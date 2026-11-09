/**
 * FAAN leave policy as used by the app.
 *
 * - Annual leave depends on grade level (on the staff profile):
 *     Grade 1-7  -> 21 working days a year
 *     Grade 8-16 -> 30 working days a year
 * - Sick leave and exam leave are open to every staff member. They don't come out of the
 *   annual balance; supporting evidence (medical certificate, exam timetable) is checked by the
 *   approver.
 *
 * The backend must apply the same rules (see docs/QA_BACKEND_FIXES_2026-11-08.md,
 * "Grade-based leave"). This file only drives what the screens show.
 */

export const MIN_GRADE = 1;
export const MAX_GRADE = 16;
export const GRADE_LEVELS: number[] = Array.from({ length: MAX_GRADE - MIN_GRADE + 1 }, (_, i) => i + MIN_GRADE);

export function isValidGrade(grade: unknown): grade is number {
	return Number.isInteger(grade) && (grade as number) >= MIN_GRADE && (grade as number) <= MAX_GRADE;
}

/** Annual leave in working days for a grade level, or null when the grade isn't set or is out of range. */
export function annualLeaveDaysForGrade(grade: unknown): number | null {
	const g = typeof grade === "string" ? Number(grade) : grade;
	if (!isValidGrade(g)) return null;
	return g <= 7 ? 21 : 30;
}

/** Leave types that are deducted from a yearly balance. */
export const BALANCE_BASED_TYPES = new Set(["Annual"]);

/** Short guidance shown on the Apply form for each type. */
export const LEAVE_TYPE_NOTES: Record<string, string> = {
	Annual: "Comes out of your annual balance.",
	Sick: "Doesn't use your annual balance. Your approver may ask for a medical certificate.",
	Exam: "For sitting an exam. Doesn't use your annual balance. Your approver may ask for the exam timetable or admission slip.",
	Compassionate: "For bereavement or a family emergency.",
	Maternity: "Statutory maternity leave.",
	Paternity: "Statutory paternity leave.",
	Unpaid: "Leave without pay.",
};

export const gradeLabel = (grade: unknown) => (isValidGrade(Number(grade)) ? `Grade ${Number(grade)}` : "Not set");
