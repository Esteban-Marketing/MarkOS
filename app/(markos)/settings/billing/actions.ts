"use server";

const TENANT_BILLING_ENDPOINT = "/api/billing/tenant-summary";

export async function reviewCurrentInvoice() {
  "use server";

  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}${TENANT_BILLING_ENDPOINT}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Billing data could not be loaded. Last reconciled records stay visible; retry the request or contact a billing admin.");
  }

  return response.json();
}

export async function reviewBillingDetails() {
  "use server";
  return reviewCurrentInvoice();
}