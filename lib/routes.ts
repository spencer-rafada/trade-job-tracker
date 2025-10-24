/**
 * Application route constants
 * Centralized route definitions to avoid hardcoded strings
 */

export const ROUTES = {
  // Public routes
  HOME: "/",

  // Auth routes
  AUTH: {
    LOGIN: "/auth/login",
    SIGNUP: "/auth/sign-up",
    FORGOT_PASSWORD: "/auth/forgot-password",
    UPDATE_PASSWORD: "/auth/update-password",
    CONFIRM: "/auth/confirm",
    ERROR: "/auth/error",
    SIGNUP_SUCCESS: "/auth/sign-up-success",
  },

  // Admin routes
  ADMIN: {
    USERS: "/admin/users",
    CREWS: "/admin/crews",
    TRADES: "/admin/trades",
    JOBS: "/admin/jobs",
  },
} as const;

// Type for route values
export type Route = typeof ROUTES[keyof typeof ROUTES] | typeof ROUTES.AUTH[keyof typeof ROUTES.AUTH] | typeof ROUTES.ADMIN[keyof typeof ROUTES.ADMIN];
