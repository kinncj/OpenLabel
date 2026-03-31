import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    files: ["common/domain/**/*", "common/application/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react-dom", "next/*"],
              message: "Domain and application layers must not import React or Next.js.",
            },
            {
              group: ["zustand", "zustand/*"],
              message: "Domain and application layers must not import Zustand.",
            },
            {
              group: ["dexie", "dexie/*"],
              message: "Domain and application layers must not import Dexie directly.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
