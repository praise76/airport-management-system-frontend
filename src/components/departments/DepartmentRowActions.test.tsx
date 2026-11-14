// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DepartmentTreeNode } from "@/types/department";
import { DepartmentRowActions } from "./DepartmentRowActions";

afterEach(cleanup);

const node = (over: Partial<DepartmentTreeNode> = {}) =>
	({ id: "d1", name: "Dept", code: "D", departmentLevel: 1, isRegistry: false, children: [], archivedAt: null, ...over }) as DepartmentTreeNode;

const handlers = () => ({
	onAddUnit: vi.fn(),
	onAddStation: vi.fn(),
	onEdit: vi.fn(),
	onAssignHead: vi.fn(),
	onArchive: vi.fn(),
	onDelete: vi.fn(),
	onRestore: vi.fn(),
});

describe("department row actions", () => {
	it("a live department can be edited, archived or deleted, and cannot be restored", () => {
		const h = handlers();
		render(<DepartmentRowActions node={node()} {...h} />);
		expect(screen.queryByTitle("Restore")).toBeNull();
		fireEvent.click(screen.getByTitle(/Archive \(hide it/i));
		fireEvent.click(screen.getByTitle("Delete"));
		fireEvent.click(screen.getByTitle("Edit"));
		expect(h.onArchive).toHaveBeenCalledOnce();
		expect(h.onDelete).toHaveBeenCalledOnce();
		expect(h.onEdit).toHaveBeenCalledOnce();
	});

	it("an archived department can only be restored", () => {
		const h = handlers();
		render(<DepartmentRowActions node={node({ archivedAt: "2026-11-14T00:00:00Z" })} {...h} />);
		for (const title of ["Edit", "Delete", "Add Unit", /Archive \(hide it/i, /Assign/]) {
			expect(screen.queryByTitle(title)).toBeNull();
		}
		fireEvent.click(screen.getByTitle("Restore"));
		expect(h.onRestore).toHaveBeenCalledOnce();
	});

	it("restore is disabled while it is being saved", () => {
		render(<DepartmentRowActions node={node({ archivedAt: "2026-11-14T00:00:00Z" })} restoring {...handlers()} />);
		expect((screen.getByTitle("Restore") as HTMLButtonElement).disabled).toBe(true);
	});

	it("only a department can add units, and only a unit can add stations", () => {
		const { rerender } = render(<DepartmentRowActions node={node({ departmentLevel: 1 })} {...handlers()} />);
		expect(screen.queryByTitle("Add Unit")).not.toBeNull();
		expect(screen.queryByTitle("Add Station")).toBeNull();
		rerender(<DepartmentRowActions node={node({ departmentLevel: 2 })} {...handlers()} />);
		expect(screen.queryByTitle("Add Unit")).toBeNull();
		expect(screen.queryByTitle("Add Station")).not.toBeNull();
		rerender(<DepartmentRowActions node={node({ departmentLevel: 3 })} {...handlers()} />);
		expect(screen.queryByTitle("Add Unit")).toBeNull();
		expect(screen.queryByTitle("Add Station")).toBeNull();
	});
});
