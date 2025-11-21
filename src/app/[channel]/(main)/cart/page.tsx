import Image from "next/image";
import { CheckoutLink } from "./CheckoutLink";
import { DeleteLineButton } from "./DeleteLineButton";
import * as Checkout from "@/lib/checkout";
import { formatMoney, getHrefForVariant } from "@/lib/utils";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

export const metadata = {
	title: "Cart | Salp Industrial Utility",
};

export default async function Page(props: { params: Promise<{ channel: string }> }) {
	const params = await props.params;
	const checkoutId = await Checkout.getIdFromCookies(params.channel);

	const checkout = await Checkout.find(checkoutId);

	// --- EMPTY STATE ---
	if (!checkout || checkout.lines.length < 1) {
		return (
			<section className="flex min-h-[70vh] flex-col items-center justify-center bg-vapor p-8 text-carbon">
				<div className="max-w-md space-y-6 text-center">
					<h1 className="text-4xl font-bold uppercase tracking-tighter">System Idle</h1>
					<p className="font-mono text-sm text-gray-500">Inventory buffer is empty. Awaiting input.</p>
					<LinkWithChannel
						href="/products"
						className="inline-block w-full bg-cobalt px-8 py-4 font-bold uppercase tracking-wide text-white transition-colors hover:bg-blue-700"
					>
						Initialize Order
					</LinkWithChannel>
				</div>
			</section>
		);
	}

	// --- ACTIVE CART STATE ---
	return (
		<section className="min-h-screen bg-vapor text-carbon">
			<div className="mx-auto max-w-[1920px] p-4 md:p-8">
				{/* Header */}
				<div className="mb-8 border-b border-gray-300 pb-6 md:mb-12">
					<h1 className="text-3xl font-bold uppercase tracking-tighter md:text-6xl">
						Manifest{" "}
						<span className="ml-2 align-top text-2xl text-cobalt md:text-4xl">({checkout.lines.length})</span>
					</h1>
				</div>

				<form className="md:grid md:grid-cols-12 md:gap-12 lg:gap-24">
					{/* --- LEFT COLUMN: Line Items (Span 8) --- */}
					<div className="md:col-span-8">
						<ul
							data-testid="CartProductList"
							role="list"
							className="divide-y divide-gray-200 border-t border-gray-200"
						>
							{checkout.lines.map((item) => (
								<li key={item.id} className="flex gap-4 py-6 md:py-8">
									{/* Image: Sharp corners, border */}
									<div className="relative aspect-square h-24 w-24 flex-shrink-0 overflow-hidden border border-gray-200 bg-white sm:h-40 sm:w-40">
										{item.variant?.product?.thumbnail?.url && (
											<Image
												src={item.variant.product.thumbnail.url}
												alt={item.variant.product.thumbnail.alt ?? ""}
												fill
												className="object-cover object-center"
											/>
										)}
									</div>

									{/* Item Details */}
									<div className="flex flex-1 flex-col justify-between">
										<div className="flex items-start justify-between gap-4">
											<div className="space-y-1">
												<LinkWithChannel
													href={getHrefForVariant({
														productSlug: item.variant.product.slug,
														variantId: item.variant.id,
													})}
													className="group"
												>
													<h2 className="text-lg font-bold uppercase tracking-tight text-carbon transition-colors group-hover:text-cobalt md:text-xl">
														{item.variant?.product?.name}
													</h2>
												</LinkWithChannel>

												<div className="flex flex-col gap-1 font-mono text-xs uppercase tracking-wider text-gray-500">
													<span>Category: {item.variant?.product?.category?.name}</span>
													{item.variant.name !== item.variant.id && Boolean(item.variant.name) && (
														<span>Spec: {item.variant.name}</span>
													)}
												</div>
											</div>

											{/* Price */}
											<p className="font-mono text-sm font-medium text-carbon md:text-base">
												{formatMoney(item.totalPrice.gross.amount, item.totalPrice.gross.currency)}
											</p>
										</div>

										{/* Bottom Row: Qty & Delete */}
										<div className="mt-4 flex items-center justify-between">
											<div className="border border-gray-300 bg-white px-3 py-1 font-mono text-sm">
												QTY: {item.quantity}
											</div>
											<div className="text-xs font-bold uppercase tracking-widest text-red-600 hover:text-red-800">
												<DeleteLineButton checkoutId={checkoutId} lineId={item.id} />
											</div>
										</div>
									</div>
								</li>
							))}
						</ul>
					</div>

					{/* --- RIGHT COLUMN: Summary (Span 4) --- */}
					<div className="mt-12 md:col-span-4 md:mt-0">
						<div className="sticky top-8 border border-gray-200 bg-white p-6 md:p-8">
							<h2 className="mb-6 border-b border-gray-100 pb-4 text-lg font-bold uppercase tracking-wider">
								Requisition Summary
							</h2>

							<div className="mb-8 space-y-4">
								<div className="flex items-center justify-between">
									<span className="text-sm uppercase text-gray-500">Subtotal</span>
									<span className="font-mono font-bold">
										{formatMoney(checkout.totalPrice.gross.amount, checkout.totalPrice.gross.currency)}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-sm uppercase text-gray-500">Shipping</span>
									<span className="font-mono text-xs text-gray-400">CALCULATED NEXT</span>
								</div>
							</div>

							<div className="mb-8 flex items-center justify-between border-t border-gray-200 pt-6">
								<span className="font-bold uppercase">Total Estimate</span>
								<span className="font-mono text-xl font-bold text-cobalt md:text-2xl">
									{formatMoney(checkout.totalPrice.gross.amount, checkout.totalPrice.gross.currency)}
								</span>
							</div>

							{/* Checkout Button: Full Width Cobalt Block */}
							<div className="w-full">
								<CheckoutLink
									checkoutId={checkoutId}
									disabled={!checkout.lines.length}
									className="block w-full bg-cobalt py-4 text-center font-bold uppercase text-white transition-colors hover:bg-blue-700"
								/>
							</div>

							<p className="mt-4 text-center font-mono text-[10px] uppercase text-gray-400">
								Secure Transaction Layer v1.0
							</p>
						</div>
					</div>
				</form>
			</div>
		</section>
	);
}
