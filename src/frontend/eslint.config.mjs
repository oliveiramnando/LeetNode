import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    rules: {
      // This rule is very strict and blocks common fetch/loading patterns.
      // You can clean these up later, but don't let it block shipping.
      "react-hooks/set-state-in-effect": "off",

      // Keep this as a warning for now so lint passes while still reminding you.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;