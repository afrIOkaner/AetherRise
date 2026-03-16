import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    // Flat config for Next.js 15+ 
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    {
        // Custom ignores (Replacing globalIgnores for better compatibility)
        ignores: [
            ".next/**",
            "out/**",
            "build/**",
            "next-env.d.ts",
            "node_modules/**",
            "public/sw.js", // Ignore generated service worker
        ],
    },
];

export default eslintConfig;