import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Mail, Clock, ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/stakeholder/registration-success")({
	component: RegistrationSuccessPage,
});

function RegistrationSuccessPage() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
			<div className="w-full max-w-lg">
				{/* Success Card */}
				<div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
					{/* Success Icon */}
					<div className="relative inline-flex mb-6">
						<div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
						<div className="relative w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
							<CheckCircle2 className="h-12 w-12 text-white" />
						</div>
					</div>

					{/* Title */}
					<h1 className="text-3xl font-bold text-white mb-2">
						Registration Submitted!
					</h1>
					<p className="text-slate-400 mb-8">
						Your stakeholder registration has been successfully submitted.
					</p>

					{/* Info Cards */}
					<div className="space-y-4 mb-8">
						<div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-start gap-4 text-left">
							<div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
								<Mail className="h-5 w-5 text-blue-400" />
							</div>
							<div>
								<h3 className="text-white font-medium mb-1">
									Check Your Email
								</h3>
								<p className="text-sm text-slate-400">
									We've sent a confirmation email to your registered address.
									Please verify your email to proceed.
								</p>
							</div>
						</div>

						<div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-start gap-4 text-left">
							<div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
								<Clock className="h-5 w-5 text-amber-400" />
							</div>
							<div>
								<h3 className="text-white font-medium mb-1">
									Verification In Progress
								</h3>
								<p className="text-sm text-slate-400">
									Our team will review your application within 2-3 business
									days. You'll receive an email once approved.
								</p>
							</div>
						</div>

						<div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-start gap-4 text-left">
							<div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
								<FileText className="h-5 w-5 text-purple-400" />
							</div>
							<div>
								<h3 className="text-white font-medium mb-1">
									Keep Your Documents Ready
								</h3>
								<p className="text-sm text-slate-400">
									You may be contacted for additional documentation to complete
									the verification process.
								</p>
							</div>
						</div>
					</div>

					{/* What's Next Section */}
					<div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-xl p-4 mb-8">
						<h3 className="text-white font-medium mb-2">What happens next?</h3>
						<ol className="text-sm text-slate-400 text-left space-y-2">
							<li className="flex gap-2">
								<span className="text-emerald-400 font-semibold">1.</span>
								Document verification by our compliance team
							</li>
							<li className="flex gap-2">
								<span className="text-emerald-400 font-semibold">2.</span>
								Approval notification via email
							</li>
							<li className="flex gap-2">
								<span className="text-emerald-400 font-semibold">3.</span>
								Access to your stakeholder portal dashboard
							</li>
							<li className="flex gap-2">
								<span className="text-emerald-400 font-semibold">4.</span>
								Start submitting activities, permits, and more
							</li>
						</ol>
					</div>

					{/* Actions */}
					<div className="flex flex-col gap-3">
						<Link to="/stakeholder/login">
							<Button className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white border-0 h-12 text-base font-semibold rounded-xl shadow-lg shadow-emerald-500/25">
								Go to Login
							</Button>
						</Link>
						<Link to="/">
							<Button
								variant="outline"
								className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white h-12 rounded-xl"
							>
								<ArrowLeft className="h-4 w-4 mr-2" />
								Back to Home
							</Button>
						</Link>
					</div>
				</div>

				{/* Support Contact */}
				<p className="text-center text-sm text-slate-500 mt-6">
					Need help?{" "}
					<a
						href="mailto:stakeholder.support@faan.gov.ng"
						className="text-blue-400 hover:text-blue-300 transition-colors"
					>
						Contact Support
					</a>
				</p>
			</div>
		</div>
	);
}
