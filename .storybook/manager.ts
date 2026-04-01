import { addons } from "@storybook/manager-api";
import { create } from "@storybook/theming/create";

const theme = create({
  base: "light",
  brandTitle: "MarkOS UI Coverage & Security",
  brandUrl: "https://markos.esteban.marketing",
  brandImage: undefined,
  brandTarget: "_blank",

  colorPrimary: "#0d9488",
  colorSecondary: "#06b6d4",

  // UI
  appBg: "#f5f7fa",
  appContentBg: "#ffffff",
  appBorderColor: "#e5e7eb",
  appBorderRadius: 10,

  // Text colors
  textColor: "#0f172a",
  textInverseColor: "#ffffff",

  // Toolbar default and active colors
  barTextColor: "#475569",
  barSelectedColor: "#0d9488",
  barBg: "#ffffff",

  // Form colors
  inputBg: "#ffffff",
  inputBorder: "#d1d5db",
  inputTextColor: "#0f172a",
  inputBorderRadius: 4,

  fontBase: "'Space Grotesk', sans-serif",
  fontCode: "'Courier New', monospace",
});

addons.setConfig({
  theme: theme,
  isFullscreen: false,
  showNav: true,
  showPanel: true,
  panelPosition: "right",
  enableShortcuts: true,
  showToolbar: true,
  initialActive: "canvas",
  sidebar: {
    showRoots: true,
    collapsedRoots: [],
  },
  toolbar: {
    title: { hidden: false },
    zoom: { hidden: false },
    eject: { hidden: false },
    copy: { hidden: true },
    fullscreen: { hidden: false },
  },
});
