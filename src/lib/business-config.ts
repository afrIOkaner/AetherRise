/**
 * @file business-config.ts
 * @description Centralized configuration for AetherRise. 
 * Use this to control branding, payment numbers, and dynamic limits.
 */

export const AETHER_CONFIG = {
  // Brand Identity
  BRAND_NAME: "AetherRise",
  
  // Payment Gateway Information (Replace with your actual numbers)
  PAYMENT_METHODS: {
    bkash: {
      number: "01718843589", // Your Bkash Number
      type: "Send Money"
    },
    rocket: {
      number: "01718843589", // Your Rocket Number
      type: "Send Money"
    },
    nagad: {
      number: "01718843589", // Your Nagad Number
      type: "Send Money"
    }
  },

  // Subscription Details
  PRICING: {
    premium_bdt: 500,
    original_price: 500,
  },

  // Dynamic Usage Limits (For Free Tier)
  LIMITS: {
    FREE_NOTES_PER_DAY: 5,
    FREE_IMAGES_PER_DAY: 5
  }
};