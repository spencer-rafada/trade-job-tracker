/**
 * Formatting utilities
 */

/**
 * Get display name in format "First L." (first name + last initial)
 */
export function formatUserGreeting(
  firstName: string,
  lastName: string
): string {
  if (!firstName || !lastName) {
    return "User";
  }

  const lastInitial = lastName.charAt(0).toUpperCase();
  return `${firstName} ${lastInitial}.`;
}
