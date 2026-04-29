import type { Meta, StoryObj } from '@storybook/react';
import ClaudeDemoSandbox from './page';

const meta = {
  title: '213.5/ClaudeDemoSandbox',
  component: ClaudeDemoSandbox,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Phase 213.5 Plan-02 — Claude in-browser MCP playground redesigned to DESIGN.md v1.1.0 canonical contract. Composes .c-field + .c-field__label + .c-input on 5 form fields (channel/audience/pain/promise/brand), .c-button c-button--primary + .is-loading on submit, .c-notice c-notice--error + [err] for API errors, .c-notice c-notice--warning + [warn] for HTTP 429 rate-limit (NEW state branch in onSubmit), .c-card for result panel. Fetch wiring + DOM IDs + copy preserved verbatim per D-20/D-21.',
      },
    },
  },
} satisfies Meta<typeof ClaudeDemoSandbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Form pre-filled with DEFAULT_BRIEF (channel=email, audience=founder-sam, pain=pipeline_velocity, promise=refill your pipeline with qualified leads this week, brand=markos). No result, no error, no rate-limit. Submit button enabled (idle).',
      },
    },
  },
};

export const Drafting: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Submit clicked — loading=true. Submit button gets .is-loading class (text visually hidden via primitive color: transparent) + aria-busy="true" (accessible state signal). disabled={true} prevents double-submit. Mocked fetch never resolves to keep state pinned for visual review; in production, transitions to Success/Error/RateLimited.',
      },
    },
  },
};

export const Success: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'fetch resolved with payload.result.draft.text + payload.result.audit. Result section appears below form: <h2>Result</h2> + <div class="c-card"> wrapping <article aria-label="Generated draft"> + <article aria-label="Audit report">. Audit status displayed in heading; score in body; issues listed (or "No issues flagged.").',
      },
    },
  },
};

export const RateLimited: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'fetch returned response.status === 429 (RATE_LIMITED). onSubmit 429 branch (NEW per DS-6) sets rateLimited=true, skips setResult/setErrorMessage. Renders <p role="alert" className="c-notice c-notice--warning">[warn] Demo rate limit reached. Try again in 60s.</p>. State signal paired with [warn] glyph (never color-only per DESIGN.md non-negotiable rule 6).',
      },
    },
  },
};

export const Error: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'fetch returned non-429 error (e.g., 500). onSubmit sets errorMessage from payload.error or fallback. Renders <p role="alert" className="c-notice c-notice--error">[err] {errorMessage}</p>. State signal paired with [err] glyph (never color-only).',
      },
    },
  },
};
