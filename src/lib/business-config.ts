/**
 * @file business-config.ts
 * @description Centralized business logic, branding, and payment configuration.
 * Tailored for Begum Rokeya University, Rangpur.
 */

export const AETHER_CONFIG = {
  // Brand Identity
  BRAND: {
    NAME: "AetherRise",
    FULL_NAME: "AetherRise Aura Core",
    SLOGAN: "Advanced AI Academic Assistant",
    ORGANIZATION: "DasOrbital Technologies",
    INSTITUTION: "Begum Rokeya University, Rangpur",
    TAGLINE: "Precision Analytics for Modern Science",
  },

  // Database & Storage Mapping (Added for consistency)
  STORAGE: {
    TABLE_NAME: "aether_notes",
    VAULT_FOLDER: "notes",
  },

  // Payment Gateway Information
  PAYMENT_GATEWAY: {
    METHODS: {
      bkash: {
        id: "bkash",
        name: "bKash",
        number: "01718843589",
        type: "Personal (Send Money)",
        color: "#E3106E",
      },
      nagad: {
        id: "nagad",
        name: "Nagad",
        number: "01718843589",
        type: "Personal (Send Money)",
        color: "#F7941D",
      },
      rocket: {
        id: "rocket",
        name: "Rocket",
        number: "01718843589",
        type: "Personal (Send Money)",
        color: "#8C3494",
      },
    },
    INSTRUCTIONS: "Please send the exact amount and provide the transaction ID in the next step.",
  },

  // Pricing Strategy
  PRICING: {
    CURRENCY: "BDT",
    PREMIUM_SALE_PRICE: 149,
    ORIGINAL_PRICE: 500,
    DISCOUNT_PERCENTAGE: "70%",
    SALE_TAGLINE: "BRUR Student Special Offer",
    ACCESS_DURATION: "Lifetime Access",
  },

  // Dynamic Usage Limits
  LIMITS: {
    FREE_NOTES_PER_DAY: 5,
    FREE_IMAGES_PER_DAY: 5,
    PRO_NOTES_PER_DAY: 1000, // Increased for Pro users
    PRO_IMAGES_PER_DAY: 100,
  },

  // SEO & PWA Metadata
  METADATA: {
    TITLE: "AetherRise | BRUR Statistics AI Core",
    DESCRIPTION: "The ultimate AI assistant for students and researchers. Get precise analytics, instant notes, and more.",
    THEME_COLOR: "#2563eb",
    BACKGROUND_COLOR: "#ffffff",
  }
};
// Alias for backward compatibility with upgradeModal.tsx
export const PAYMENT_METHODS = AETHER_CONFIG.PAYMENT_GATEWAY.METHODS;
export type AetherConfig = typeof AETHER_CONFIG;