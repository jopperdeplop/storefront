import { Suspense } from "react";
import { Summary, SummarySkeleton } from "@/checkout/sections/Summary";
import { OrderInfo } from "@/checkout/sections/OrderInfo";
import { useOrder } from "@/checkout/hooks/useOrder";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

export const OrderConfirmation = () => {
	// FIX: Hooks must be called unconditionally at the top level
	const { order } = useOrder();

	// 1. Check for "Static Success" mode
	const isGenericSuccess =
		typeof window !== "undefined" && new URLSearchParams(window.location.search).get("paymentSuccess");

	// 2. Render Generic Branded Page (No API calls needed here)
	if (isGenericSuccess) {
		return (
			<main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 p-8 text-carbon">
				<div className="max-w-2xl space-y-6 text-center">
					{/* Icon Area */}
					<div className="mb-6 flex justify-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-16 w-16 text-terracotta"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
					</div>

					{/* Editorial Typography: Serif Heading */}
					<h1 className="font-serif text-4xl text-carbon md:text-5xl">Order Confirmed</h1>

					{/* Sans-serif Body Text */}
					<p className="font-sans text-lg text-stone-600 md:text-xl">
						Thank you for your purchase. Your payment has been processed successfully.
					</p>

					<p className="font-mono text-sm text-stone-500">
						A confirmation email with your order details is on its way.
					</p>

					{/* Button with Terracotta hover state */}
					<div className="pt-8">
						<LinkWithChannel
							href="/"
							className="inline-block rounded bg-terracotta px-8 py-3 font-sans font-medium text-white transition-colors duration-200 hover:bg-terracotta-dark"
						>
							Continue Shopping
						</LinkWithChannel>
					</div>
				</div>
			</main>
		);
	}

	// 3. Legacy Logic (Only renders if we have specific order data and NO success flag)
	if (!order) return null;

	return (
		<main className="grid grid-cols-1 gap-x-16 lg:grid-cols-2">
			<div>
				<header>
					<p className="mb-2 text-lg font-bold" data-testid="orderConfrmationTitle">
						Order #{order.number} confirmed
					</p>
					<p className="text-base">
						Thank you for placing your order. We&apos;ve received it and we will contact you as soon as your
						package is shipped. A confirmation email has been sent to {order.userEmail}.
					</p>
				</header>
				<OrderInfo />
			</div>
			<Suspense fallback={<SummarySkeleton />}>
				<Summary
					{...order}
					// for now there can only be one voucher per order in the api
					discount={order?.discounts?.find(({ type }) => type === "VOUCHER")?.amount}
					voucherCode={order?.voucher?.code}
					totalPrice={order?.total}
					subtotalPrice={order?.subtotal}
					editable={false}
				/>
			</Suspense>
		</main>
	);
};
