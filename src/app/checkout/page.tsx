import Link from "next/link";
import { invariant } from "ts-invariant";
import { RootWrapper } from "./pageWrapper";

export const metadata = {
	title: "Secure Checkout | Salp",
};

export default async function CheckoutPage(props: {
	searchParams: Promise<{ checkout?: string; order?: string }>;
}) {
	const searchParams = await props.searchParams;
	invariant(process.env.NEXT_PUBLIC_SALEOR_API_URL, "Missing NEXT_PUBLIC_SALEOR_API_URL env variable");

	if (!searchParams.checkout && !searchParams.order) {
		return null;
	}

	return (
		<div className="min-h-dvh bg-vapor text-carbon selection:bg-cobalt selection:text-white">
			<section className="mx-auto flex min-h-dvh max-w-[1920px] flex-col p-4 md:p-8">
				{/* --- HEADER: Salp Branding --- */}
				<header className="mb-8 flex items-center justify-between border-b border-gray-300 pb-6">
					<Link aria-label="homepage" href="/" className="group">
						<h1 className="text-3xl font-bold uppercase tracking-tighter">
							Salp<span className="text-cobalt">.</span>
						</h1>
					</Link>
					<div className="hidden font-mono text-xs uppercase tracking-widest text-gray-500 md:block">
						Secure Transaction Layer
					</div>
				</header>

				{/* --- PAGE TITLE --- */}
				<h1 className="mb-8 text-2xl font-bold uppercase tracking-tighter text-carbon md:text-4xl">
					Finalize Requisition
				</h1>

				{/* --- CHECKOUT APP WRAPPER --- */}
				<section className="mb-12 flex-1">
					{/* Note: The RootWrapper loads the Saleor Checkout SPA. 
                       It will render inside this container. 
                    */}
					<RootWrapper saleorApiUrl={process.env.NEXT_PUBLIC_SALEOR_API_URL} />
				</section>
			</section>
		</div>
	);
}
