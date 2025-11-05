/**
 * Utility functions for admin access control
 */

/**
 * Check if a user email is a super admin
 * @param email - User email to check
 * @returns true if the user is a super admin
 */
export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  
  const emailLower = email.toLowerCase();
  const superAdminEmails = [
    'luuk@revimpact.nl',
    'admin@revimpact.nl'
  ];
  
  return superAdminEmails.includes(emailLower);
}

/**
 * Get list of super admin emails
 * @returns Array of super admin email addresses
 */
export function getSuperAdminEmails(): string[] {
  return [
    'luuk@revimpact.nl',
    'admin@revimpact.nl'
  ];
}

