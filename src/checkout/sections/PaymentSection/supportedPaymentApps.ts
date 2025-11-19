import { AdyenDropIn } from "./AdyenDropIn/AdyenDropIn";
import { adyenGatewayId } from "./AdyenDropIn/types";
import { DummyComponent } from "./DummyDropIn/dummyComponent";
import { dummyGatewayId } from "./DummyDropIn/types";
import { StripeComponent } from "./StripeElements/stripeComponent";
import { stripeGatewayId } from "./StripeElements/types";

export const paymentMethodToComponent = {
	[adyenGatewayId]: AdyenDropIn,
	[stripeGatewayId]: StripeComponent,
	// Add your ID here, pointing to the SAME component:
	"saleor.app.payment.stripe": StripeComponent,
	[dummyGatewayId]: DummyComponent,
};
