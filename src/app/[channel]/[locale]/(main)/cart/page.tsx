import Image from "next/image";
import { CheckoutLink } from "./CheckoutLink";
import { DeleteLineButton } from "./DeleteLineButton";
import * as Checkout from "@/lib/checkout";
import { formatMoney, getHrefForVariant } from "@/lib/utils";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { CheckoutFindDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";

export const metadata = {
	title: "Cart | Euro-Standard",
};

export default async function Page(props: { params: Promise<{ channel: string; locale: string }> }) {
	// FIX 1: Unwrap the entire props.params promise immediately
	const params = await props.params;
	const { channel, locale } = params;

	// Use the unwrapped channel
	const checkoutId = await Checkout.getIdFromCookies(channel);

	let checkout = null;
	if (checkoutId) {
		try {
			const { checkout: data } = await executeGraphQL(CheckoutFindDocument, {
				variables: {
					id: checkoutId,
				},
				cache: "no-cache",
			});
			checkout = data;
		} catch (e) {
			console.error("Failed to fetch checkout data for cart page:", e);
			// We catch the GraphQL error here but don't rethrow it, allowing the page to render empty state.
			checkout = null;
		}
	}

	// --- EMPTY STATE: Editorial Style ---
	if (!checkout || checkout.lines.length < 1) {
		return (
			<section className="flex min-h-[70vh] flex-col items-center justify-center bg-stone-50 p-8 text-gray-900">
				<div className="max-w-md space-y-6 text-center">
					<h1 className="font-serif text-4xl font-medium text-gray-900">Your Selection is Empty</h1>
					<p className="font-mono text-sm text-gray-500">
						Discover authentic European craftsmanship to fill this space.
					</p>
					<LinkWithChannel
						href="/products"
						className="inline-block w-full bg-terracotta px-8 py-4 font-bold uppercase tracking-widest text-white transition-colors hover:bg-terracotta-dark"
					>
						Start Exploring
					</LinkWithChannel>
				</div>
			</section>
		);
	}

	// --- ACTIVE CART STATE ---
	return (
		<section className="min-h-screen bg-stone-50 text-gray-900">
			<div className="mx-auto max-w-[1920px] p-4 md:p-8">
				{/* Header: Editorial Style */}
				<div className="mb-12 border-b border-gray-200 pb-6">
					<span className="mb-2 block font-mono text-xs uppercase tracking-widest text-gray-400">
						Order Review
					</span>
					<h1 className="font-serif text-3xl font-medium md:text-5xl">
						Your Selection{" "}
						<span className="ml-2 align-top text-xl text-terracotta md:text-2xl">
							({checkout.lines.length})
						</span>
					</h1>
				</div>

				<div className="md:grid md:grid-cols-12 md:gap-12 lg:gap-24">
					{/* --- LEFT COLUMN: Line Items (Span 8) --- */}
					<div className="md:col-span-8">
						<ul
							data-testid="CartProductList"
							role="list"
							className="divide-y divide-gray-200 border-t border-gray-200"
						>
							{checkout.lines.map((item) => (
								<li key={item.id} className="flex gap-6 py-8 md:gap-8">
									{/* Image: Editorial Aspect Ratio */}
									<div className="relative aspect-[3/4] h-32 w-24 flex-shrink-0 overflow-hidden bg-white sm:h-48 sm:w-36">
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
													<h2 className="font-serif text-xl font-medium text-gray-900 transition-colors group-hover:text-terracotta md:text-2xl">
														{item.variant?.product?.name}
													</h2>
												</LinkWithChannel>

												<div className="flex flex-col gap-1 font-mono text-xs uppercase tracking-wider text-gray-500">
													<span>{item.variant?.product?.category?.name}</span>
													{item.variant.name !== item.variant.id && Boolean(item.variant.name) && (
														<span>Spec: {item.variant.name}</span>
													)}
												</div>
											</div>

											{/* Price */}
											<p className="font-mono text-sm text-gray-900 md:text-base">
												{formatMoney(item.totalPrice.gross.amount, item.totalPrice.gross.currency)}
											</p>
										</div>

										{/* Bottom Row: Qty & Delete */}
										<div className="mt-4 flex items-center justify-between">
											<div className="border border-gray-300 bg-white px-4 py-2 font-mono text-sm">
												QTY: {item.quantity}
											</div>
											<div className="cursor-pointer text-xs font-bold uppercase tracking-widest text-gray-400 transition-colors hover:text-red-600">
												<DeleteLineButton checkoutId={checkoutId} lineId={item.id} />
											</div>
										</div>
									</div>
								</li>
							))}
						</ul>
					</div>

					{/* --- RIGHT COLUMN: Summary (Span 4) --- */}
					<div className="mt-16 md:col-span-4 md:mt-0">
						<div className="sticky top-8 bg-white p-8 shadow-sm ring-1 ring-gray-900/5">
							<h2 className="mb-6 border-b border-gray-100 pb-4 font-serif text-xl font-medium">
								Order Summary
							</h2>

							<div className="mb-8 space-y-4">
								<div className="flex items-center justify-between">
									<span className="font-mono text-xs uppercase text-gray-500">Subtotal</span>
									<span className="font-mono text-sm font-bold text-gray-900">
										{formatMoney(checkout.totalPrice.gross.amount, checkout.totalPrice.gross.currency)}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="font-mono text-xs uppercase text-gray-500">Shipping</span>
									<span className="font-mono text-xs text-gray-400">Calculated at Checkout</span>
								</div>
							</div>

							<div className="mb-8 flex items-center justify-between border-t border-gray-200 pt-6">
								<span className="font-serif text-lg font-medium">Total</span>
								<span className="font-serif text-xl font-medium text-terracotta md:text-2xl">
									{formatMoney(checkout.totalPrice.gross.amount, checkout.totalPrice.gross.currency)}
								</span>
							</div>

							{/* Checkout Button: Terracotta Block */}
							<div className="w-full">
								<CheckoutLink
									checkoutId={checkoutId}
									// FIX: Pass the condition directly without needing the inner property access
									disabled={!checkout.lines || checkout.lines.length === 0}
									className="block w-full bg-terracotta py-4 text-center font-bold uppercase tracking-widest text-white transition-colors hover:bg-terracotta-dark disabled:opacity-50"
									channel={channel}
									locale={locale}
								/>
							</div>

							<div className="mt-6 space-y-2 text-center">
								<p className="font-mono text-[10px] uppercase text-gray-400">Secure SSL Encryption</p>
								<div className="flex justify-center gap-2 opacity-50 grayscale">
									<div className="h-4 w-6 rounded bg-gray-300"></div>
									<div className="h-4 w-6 rounded bg-gray-300"></div>
									<div className="h-4 w-6 rounded bg-gray-300"></div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
