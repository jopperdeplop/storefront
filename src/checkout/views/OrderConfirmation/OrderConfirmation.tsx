import { Suspense } from "react";
import { Summary, SummarySkeleton } from "@/checkout/sections/Summary";
import { OrderInfo } from "@/checkout/sections/OrderInfo";
import { useOrder } from "@/checkout/hooks/useOrder";

export const OrderConfirmation = () => {
	const { order, loading } = useOrder();

	// Robust Loading State:
	// If we are loading OR if the order is null (still polling), show the finalizing screen.
	// This prevents the component from accessing properties of 'undefined'.
	if (loading || !order) {
		return (
			<main className="grid grid-cols-1 gap-x-16 lg:grid-cols-2">
				<div className="flex h-screen items-center justify-center lg:col-span-2">
					<div className="text-center">
						<h2 className="mb-2 text-xl font-bold">Finalizing your order...</h2>
						<p className="text-base text-gray-500">
							Please do not close this page or click back.
							<br />
							We are confirming your payment details.
						</p>
					</div>
				</div>
			</main>
		);
	}

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
