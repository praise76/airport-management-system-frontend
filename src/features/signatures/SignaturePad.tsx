import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { SignatureType } from "@/types/signatures";

type SignaturePadProps = {
	onChange: (
		payload: { signatureType: SignatureType; signatureData: string } | null,
	) => void;
	className?: string;
};

/**
 * Captures a signature as typed text, a hand-drawn canvas stroke (exported as a PNG
 * data URL), or an uploaded image (read as a data URL) - matching the backend's
 * signatureType enum. The parent owns submission; this only reports the current value.
 */
export function SignaturePad({ onChange, className }: SignaturePadProps) {
	const [mode, setMode] = useState<SignatureType>("typed");
	const [typedName, setTypedName] = useState("");
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const isDrawing = useRef(false);
	const hasDrawn = useRef(false);

	function emitTyped(value: string) {
		setTypedName(value);
		onChange(
			value.trim()
				? { signatureType: "typed", signatureData: value.trim() }
				: null,
		);
	}

	function getCanvasPoint(e: React.PointerEvent<HTMLCanvasElement>) {
		const canvas = canvasRef.current;
		if (!canvas) return { x: 0, y: 0 };
		const rect = canvas.getBoundingClientRect();
		return { x: e.clientX - rect.left, y: e.clientY - rect.top };
	}

	function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
		const canvas = canvasRef.current;
		if (!canvas) return;
		isDrawing.current = true;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const { x, y } = getCanvasPoint(e);
		ctx.beginPath();
		ctx.moveTo(x, y);
	}

	function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
		if (!isDrawing.current) return;
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;
		const { x, y } = getCanvasPoint(e);
		ctx.lineWidth = 2;
		ctx.lineCap = "round";
		ctx.strokeStyle = "#111827";
		ctx.lineTo(x, y);
		ctx.stroke();
		hasDrawn.current = true;
	}

	function handlePointerUp() {
		isDrawing.current = false;
		const canvas = canvasRef.current;
		if (!canvas || !hasDrawn.current) return;
		onChange({
			signatureType: "drawn",
			signatureData: canvas.toDataURL("image/png"),
		});
	}

	function clearCanvas() {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");
		if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
		hasDrawn.current = false;
		onChange(null);
	}

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) {
			onChange(null);
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === "string") {
				onChange({ signatureType: "uploaded", signatureData: reader.result });
			}
		};
		reader.readAsDataURL(file);
	}

	return (
		<div className={cn("space-y-3", className)}>
			<Tabs
				value={mode}
				onValueChange={(v) => {
					setMode(v as SignatureType);
					onChange(null);
				}}
			>
				<TabsList>
					<TabsTrigger value="typed">Type</TabsTrigger>
					<TabsTrigger value="drawn">Draw</TabsTrigger>
					<TabsTrigger value="uploaded">Upload</TabsTrigger>
				</TabsList>
				<TabsContent value="typed" className="space-y-2 pt-2">
					<Label htmlFor="typedSignature">Type your full name</Label>
					<Input
						id="typedSignature"
						value={typedName}
						onChange={(e) => emitTyped(e.target.value)}
						placeholder="e.g. Amina Bello"
						className="font-serif italic text-lg"
					/>
				</TabsContent>
				<TabsContent value="drawn" className="space-y-2 pt-2">
					<canvas
						ref={canvasRef}
						width={400}
						height={140}
						className="w-full rounded-md border bg-white touch-none"
						onPointerDown={handlePointerDown}
						onPointerMove={handlePointerMove}
						onPointerUp={handlePointerUp}
						onPointerLeave={handlePointerUp}
					/>
					<Button type="button" variant="ghost" size="sm" onClick={clearCanvas}>
						Clear
					</Button>
				</TabsContent>
				<TabsContent value="uploaded" className="space-y-2 pt-2">
					<Label htmlFor="signatureUpload">Upload a signature image</Label>
					<Input
						id="signatureUpload"
						type="file"
						accept="image/*"
						onChange={handleFileChange}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
