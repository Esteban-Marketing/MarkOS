import type { Meta, StoryObj } from '@storybook/react';
import { DangerPageView } from './page';

const meta = {
  title: 'Settings/Danger',
  component: DangerPageView,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof DangerPageView>;

export default meta;

type Story = StoryObj<typeof meta>;

const noop = () => undefined;
const noopAsync = async () => undefined;

const baseArgs = {
  workspaceSlug: 'acme-prod',
  offboardingStatus: null,
  showDeleteConfirm: false,
  confirmSlug: '',
  busy: false,
  toast: null,
  exportInProgress: false,
  onOpenDeleteConfirm: noop,
  onCloseDeleteConfirm: noop,
  onConfirmSlugChange: (_val: string) => undefined,
  onStartDeletion: noopAsync,
  onCancelDeletion: noopAsync,
};

/** Default: idle state — danger zone with Delete workspace row (.c-button--destructive) */
export const Default: Story = {
  args: {
    ...baseArgs,
  },
};

/** DeleteConfirm: modal open — .c-modal + .c-backdrop + .c-notice c-notice--error consequence above + .c-input confirm field (AC DZ-2/DZ-3) */
export const DeleteConfirm: Story = {
  args: {
    ...baseArgs,
    showDeleteConfirm: true,
    confirmSlug: '',
  },
  parameters: {
    docs: {
      description: {
        story: '`.c-modal` + `.c-backdrop` confirm with `.c-notice c-notice--error` consequence above + `.c-input` + `.c-field__error` validation per UI-SPEC AC DZ-2/DZ-3.',
      },
    },
  },
};

/** ExportInProgress: .c-notice c-notice--info "Export in progress" banner */
export const ExportInProgress: Story = {
  args: {
    ...baseArgs,
    exportInProgress: true,
  },
  parameters: {
    docs: {
      description: {
        story: '`.c-notice c-notice--info` "Export in progress. A download link will be sent to your email." banner per UI-SPEC.',
      },
    },
  },
};
