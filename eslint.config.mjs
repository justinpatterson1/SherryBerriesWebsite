import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Accessibility rules. Added after an audit found missing focus indicators,
  // unlabelled inputs and low-contrast accents — this catches the structural
  // half of that class of bug before it ships again.
  //
  // Rules only, not the whole flat config: eslint-config-next already registers
  // the jsx-a11y plugin, and re-registering it is a hard config error.
  //
  // Set to `warn` rather than `error` because the rules were added to an
  // existing codebase: they flagged 28 pre-existing issues, 21 of them in the
  // admin area. Customer-facing ones are fixed; the admin backlog is tracked in
  // context/open-issues.md. Promote to `error` once that backlog is cleared.
  {
    rules: Object.fromEntries(
      Object.entries(jsxA11y.flatConfigs.recommended.rules).map(([rule, level]) => [
        rule,
        // Keep rules the recommended set disables switched off; only soften the
        // ones it enables from error to warn.
        level === "off" || level === 0 ? "off" : "warn",
      ]),
    ),
  },
  {
    rules: {
      // Fires on inputs that DO have a correctly associated `<label htmlFor>`,
      // because it only looks for a label nested inside the control. It flagged
      // 47 such false positives here. label-has-associated-control covers the
      // real cases.
      "jsx-a11y/control-has-associated-label": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
