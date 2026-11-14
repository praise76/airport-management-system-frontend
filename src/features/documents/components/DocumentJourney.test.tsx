// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { DocumentJourneyStep } from "@/types/document";
import { DocumentJourney } from "./DocumentJourney";

afterEach(cleanup);

const step = (over: Partial<DocumentJourneyStep>): DocumentJourneyStep => ({
	stepNumber: 1,
	status: "completed",
	action: "sent_on_by_hod",
	location: "HOD - Operations",
	date: "2026-11-14T10:00:00Z",
	...over,
});

describe("document journey", () => {
	it("shows who acted, the minute and the files attached to it", () => {
		render(
			<DocumentJourney
				steps={[
					step({
						actorName: "Ada Obi",
						comments: "Approved. Please action.",
						attachments: [{ id: "f1", name: "letter.pdf", url: "/uploads/documents/x.pdf" }],
					}),
				]}
			/>,
		);
		expect(screen.getByText("Ada Obi")).toBeTruthy();
		expect(screen.getByText(/Approved\. Please action\./)).toBeTruthy();
		const link = screen.getByRole("link", { name: /letter\.pdf/ }) as HTMLAnchorElement;
		expect(link.href).toContain("/uploads/documents/x.pdf");
		expect(link.target).toBe("_blank");
	});

	it("steps without names or files look as they always did", () => {
		render(<DocumentJourney steps={[step({ comments: "Registered" })]} />);
		expect(screen.queryByLabelText("Attached files")).toBeNull();
		expect(screen.getByText(/Registered/)).toBeTruthy();
	});
});
