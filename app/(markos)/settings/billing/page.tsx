import { reviewBillingDetails, reviewCurrentInvoice } from "./actions";
import { BillingSettingsPageShell, type BillingSettingsPageProps } from "./page-shell";

export default function BillingSettingsPage({
  variant = "healthy",
  reviewCurrentInvoiceAction = reviewCurrentInvoice,
  reviewBillingDetailsAction = reviewBillingDetails,
}: BillingSettingsPageProps) {
  return (
    <BillingSettingsPageShell
      variant={variant}
      reviewCurrentInvoiceAction={reviewCurrentInvoiceAction}
      reviewBillingDetailsAction={reviewBillingDetailsAction}
    />
  );
}