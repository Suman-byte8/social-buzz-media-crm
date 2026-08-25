/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.{js,jsx,ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: "#fff8f7",
        "surface-dim": "#f4d3cf",
        "surface-bright": "#fff8f7",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#fff0ef",
        "surface-container": "#ffe9e6",
        "surface-container-high": "#ffe2de",
        "surface-container-highest": "#fcdbd7",
        "on-surface": "#291715",
        "on-surface-variant": "#5d3f3c",
        "inverse-surface": "#402b29",
        "inverse-on-surface": "#ffedea",
        outline: "#926f6b",
        "outline-variant": "#e7bdb8",
        "surface-tint": "#c00016",
        primary: "#bb0015",
        "on-primary": "#ffffff",
        "primary-container": "#e32227",
        "on-primary-container": "#fffbff",
        "inverse-primary": "#ffb4ac",
        secondary: "#5f5e5e",
        "on-secondary": "#ffffff",
        "secondary-container": "#e2dfde",
        "on-secondary-container": "#636262",
        tertiary: "#5b5c5c",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#747475",
        "on-tertiary-container": "#fefcfc",
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "primary-fixed": "#ffdad6",
        "primary-fixed-dim": "#ffb4ac",
        "on-primary-fixed": "#410003",
        "on-primary-fixed-variant": "#93000e",
        "secondary-fixed": "#e5e2e1",
        "secondary-fixed-dim": "#c8c6c5",
        "on-secondary-fixed": "#1c1b1b",
        "on-secondary-fixed-variant": "#474746",
        "tertiary-fixed": "#e3e2e2",
        "tertiary-fixed-dim": "#c7c6c6",
        "on-tertiary-fixed": "#1b1c1c",
        "on-tertiary-fixed-variant": "#464747",
        background: "#fff8f7",
        "on-background": "#291715",
        "surface-variant": "#fcdbd7",
        // Added — used throughout the invoice generator (bg-ink, text-ink,
        // border-ink). Without this, those classes generate no CSS at all,
        // which is why the toolbar showed no background and washed-out text.
        ink: "#1A1A1A",
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        full: "9999px",
      },
      spacing: {
        unit: "4px",
        "container-margin": "24px",
        gutter: "16px",
        "card-padding": "20px",
        "sidebar-width": "260px",
        "stack-sm": "8px",
        "stack-md": "16px",
        "stack-lg": "24px",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        // Added — used as font-display / font-body throughout the invoice.
        // Aliased to the same Inter stack so nothing looks mismatched; swap
        // these for a different stack later if you want the invoice to use
        // a distinct typeface from the rest of the app.
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-lg": [
          "36px",
          { lineHeight: "44px", letterSpacing: "-0.02em" },
        ],
        "headline-md": [
          "24px",
          { lineHeight: "32px", letterSpacing: "-0.01em" },
        ],
        "headline-sm": ["20px", { lineHeight: "28px" }],
        "title-lg": ["18px", { lineHeight: "24px" }],
        "body-md": ["16px", { lineHeight: "24px" }],
        "body-sm": ["14px", { lineHeight: "20px" }],
        "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.02em" }],
        "label-sm": ["11px", { lineHeight: "14px" }],
        "headline-lg-mobile": ["28px", { lineHeight: "34px" }],
      },
      // Added — the invoice uses font-600 / font-700 / font-800, which
      // aren't valid default Tailwind weight names (those are semibold /
      // bold / extrabold). Adding numeric keys makes those classes work.
      fontWeight: {
        600: "600",
        700: "700",
        800: "800",
      },
      boxShadow: {
        card: "0 2px 4px rgba(0, 0, 0, 0.05)",
        overlay: "0 10px 20px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};

module.exports = config;
