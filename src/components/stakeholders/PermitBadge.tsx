import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Printer, Download, Shield, Calendar, MapPin, Building2 } from "lucide-react";
import { format } from "date-fns";
import type { StakeholderPermit, GlobalPermit } from "@/types/stakeholder-portal";

interface PermitBadgeProps {
	permit: StakeholderPermit | GlobalPermit;
	organizationName?: string;
	onClose?: () => void;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function PermitBadge({
	permit,
	organizationName,
	open,
	onOpenChange,
}: PermitBadgeProps) {
	const badgeRef = useRef<HTMLDivElement>(null);

	// Use organizationName from props or from GlobalPermit
	const orgName = organizationName ?? ('organizationName' in permit ? permit.organizationName : 'Unknown Organization');

	const handlePrint = () => {
		if (!badgeRef.current) return;

		const printWindow = window.open('', '_blank');
		if (!printWindow) {
			alert('Please allow pop-ups to print the badge');
			return;
		}

		const badgeHtml = badgeRef.current.innerHTML;
		
		printWindow.document.write(`
			<!DOCTYPE html>
			<html>
			<head>
				<title>Access Permit - ${permit.permitNumber}</title>
				<style>
					@page {
						size: 85.6mm 54mm;
						margin: 0;
					}
					* {
						margin: 0;
						padding: 0;
						box-sizing: border-box;
					}
					body {
						font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
						-webkit-print-color-adjust: exact;
						print-color-adjust: exact;
					}
					.badge-container {
						width: 85.6mm;
						height: 54mm;
						padding: 4mm;
						background: linear-gradient(135deg, #1e3a5f 0%, #0a1628 100%);
						color: white;
						position: relative;
						overflow: hidden;
					}
					.badge-header {
						display: flex;
						justify-content: space-between;
						align-items: flex-start;
						margin-bottom: 3mm;
					}
					.badge-title {
						font-size: 8pt;
						font-weight: 600;
						text-transform: uppercase;
						letter-spacing: 0.5px;
						color: #94a3b8;
					}
					.permit-type {
						font-size: 10pt;
						font-weight: 700;
						color: #60a5fa;
						text-transform: uppercase;
					}
					.person-section {
						display: flex;
						gap: 3mm;
						margin-bottom: 2mm;
					}
					.photo-placeholder {
						width: 18mm;
						height: 22mm;
						background: #334155;
						border-radius: 2mm;
						display: flex;
						align-items: center;
						justify-content: center;
						overflow: hidden;
					}
					.photo-placeholder img {
						width: 100%;
						height: 100%;
						object-fit: cover;
					}
					.person-info {
						flex: 1;
					}
					.person-name {
						font-size: 11pt;
						font-weight: 700;
						margin-bottom: 1mm;
					}
					.person-designation {
						font-size: 7pt;
						color: #94a3b8;
						margin-bottom: 2mm;
					}
					.org-name {
						font-size: 8pt;
						font-weight: 600;
						color: #60a5fa;
					}
					.permit-number {
						font-size: 7pt;
						font-family: monospace;
						color: #94a3b8;
						margin-top: 1mm;
					}
					.badge-footer {
						display: flex;
						justify-content: space-between;
						align-items: flex-end;
						position: absolute;
						bottom: 4mm;
						left: 4mm;
						right: 4mm;
					}
					.validity {
						font-size: 6pt;
						color: #94a3b8;
					}
					.validity-dates {
						font-size: 7pt;
						font-weight: 600;
						color: white;
					}
					.qr-code {
						width: 12mm;
						height: 12mm;
						background: white;
						padding: 1mm;
						border-radius: 1mm;
					}
					.qr-code svg {
						width: 100%;
						height: 100%;
					}
					.access-areas {
						font-size: 5pt;
						color: #94a3b8;
						margin-top: 1mm;
					}
					.watermark {
						position: absolute;
						top: 50%;
						left: 50%;
						transform: translate(-50%, -50%) rotate(-30deg);
						font-size: 40pt;
						font-weight: 900;
						color: rgba(255,255,255,0.03);
						text-transform: uppercase;
						letter-spacing: 5px;
						pointer-events: none;
					}
				</style>
			</head>
			<body>
				${badgeHtml}
				<script>
					window.onload = function() {
						window.print();
						window.onafterprint = function() {
							window.close();
						};
					}
				<\/script>
			</body>
			</html>
		`);
		printWindow.document.close();
	};

	// Generate QR data for verification
	const qrData = JSON.stringify({
		permitNumber: permit.permitNumber,
		personName: permit.personName,
		validUntil: permit.validUntil,
		type: permit.permitType,
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Shield className="h-5 w-5" />
						Print Access Badge
					</DialogTitle>
				</DialogHeader>

				{/* Badge Preview */}
				<div className="flex justify-center py-4">
					<div
						ref={badgeRef}
						className="badge-container"
						style={{
							width: '340px',
							height: '214px',
							padding: '16px',
							background: 'linear-gradient(135deg, #1e3a5f 0%, #0a1628 100%)',
							color: 'white',
							position: 'relative',
							overflow: 'hidden',
							borderRadius: '8px',
							boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
						}}
					>
						{/* Watermark */}
						<div
							style={{
								position: 'absolute',
								top: '50%',
								left: '50%',
								transform: 'translate(-50%, -50%) rotate(-30deg)',
								fontSize: '48px',
								fontWeight: 900,
								color: 'rgba(255,255,255,0.03)',
								textTransform: 'uppercase',
								letterSpacing: '5px',
								pointerEvents: 'none',
							}}
						>
							FAAN
						</div>

						{/* Header */}
						<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
							<div>
								<div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}>
									Access Permit
								</div>
								<div style={{ fontSize: '12px', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase' }}>
									{permit.permitType.replace(/_/g, ' ')}
								</div>
							</div>
							<div style={{ textAlign: 'right' }}>
								<img src="/tanstack-circle-logo.png" alt="Logo" style={{ height: '24px' }} />
							</div>
						</div>

						{/* Person Section */}
						<div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
							<div
								style={{
									width: '60px',
									height: '72px',
									background: '#334155',
									borderRadius: '4px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									overflow: 'hidden',
								}}
							>
								{permit.personPhoto ? (
									<img
										src={permit.personPhoto}
										alt={permit.personName}
										style={{ width: '100%', height: '100%', objectFit: 'cover' }}
									/>
								) : (
									<span style={{ fontSize: '24px', color: '#64748b' }}>👤</span>
								)}
							</div>
							<div style={{ flex: 1 }}>
								<div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>
									{permit.personName}
								</div>
								{permit.personDesignation && (
									<div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
										{permit.personDesignation}
									</div>
								)}
								<div style={{ fontSize: '10px', fontWeight: 600, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px' }}>
									<Building2 size={10} />
									{orgName}
								</div>
								<div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#94a3b8', marginTop: '4px' }}>
									{permit.permitNumber}
								</div>
							</div>
						</div>

						{/* Footer */}
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'flex-end',
								position: 'absolute',
								bottom: '16px',
								left: '16px',
								right: '16px',
							}}
						>
							<div>
								<div style={{ fontSize: '8px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
									<Calendar size={8} />
									Valid Period
								</div>
								<div style={{ fontSize: '10px', fontWeight: 600, color: 'white' }}>
									{format(new Date(permit.validFrom), 'dd/MM/yy')} - {format(new Date(permit.validUntil), 'dd/MM/yy')}
								</div>
								{permit.accessAreas && permit.accessAreas.length > 0 && (
									<div style={{ fontSize: '7px', color: '#94a3b8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
										<MapPin size={7} />
										{permit.accessAreas.slice(0, 3).join(', ')}
										{permit.accessAreas.length > 3 && ` +${permit.accessAreas.length - 3}`}
									</div>
								)}
							</div>
							<div
								style={{
									width: '48px',
									height: '48px',
									background: 'white',
									padding: '4px',
									borderRadius: '4px',
								}}
							>
								<QRCodeSVG
									value={qrData}
									size={40}
									level="M"
									includeMargin={false}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Actions */}
				<div className="flex justify-end gap-2">
					<Button variant="outline" onClick={() => onOpenChange?.(false)}>
						Cancel
					</Button>
					<Button onClick={handlePrint}>
						<Printer className="h-4 w-4 mr-2" />
						Print Badge
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

// Hook for managing badge printing
export function usePrintBadge() {
	const printRef = useRef<HTMLDivElement>(null);

	const printBadge = (permit: StakeholderPermit | GlobalPermit, orgName?: string) => {
		// Create a temporary container
		const container = document.createElement('div');
		container.style.position = 'fixed';
		container.style.left = '-9999px';
		document.body.appendChild(container);

		// This would need React rendering, so we'll use the dialog approach instead
		// For now, return the permit data that can be used with the PermitBadge component
		document.body.removeChild(container);
		return { permit, orgName };
	};

	return { printBadge, printRef };
}
