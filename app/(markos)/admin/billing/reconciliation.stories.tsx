import AdminBillingPage from "./page";

export default {
  title: "MarkOS/Admin Billing/Reconciliation",
  component: AdminBillingPage,
};

export const Healthy = {
  render: () => <AdminBillingPage />,
};

export const Hold = {
  render: () => <AdminBillingPage />,
};

export const SyncFailure = {
  render: () => <AdminBillingPage />,
};