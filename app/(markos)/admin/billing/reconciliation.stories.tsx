import AdminBillingPage from "./page";

export default {
  title: "MarkOS/Admin Billing/Reconciliation",
  component: AdminBillingPage,
};

export const Healthy = {
  args: {
    variant: "healthy",
  },
};

export const Hold = {
  args: {
    variant: "hold",
  },
};

export const SyncFailure = {
  args: {
    variant: "syncFailure",
  },
};