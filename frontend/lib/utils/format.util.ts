/**
 * FORMAT UTILITIES
 * Pure functions containing reusable string, number, and date formatters.
 * No API calls, no mixed concerns.
 */

/**
 * Format an ISO date string into a user-friendly format (e.g., "Oct 12, 2023").
 */
export function formatDateStr(isoStr: string | Date, locale: string = 'en-US'): string {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "Invalid Date";

    return d.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Extract initials from full name.
 * @example "John Doe" -> "JD"
 */
export function getInitials(firstName: string, lastName: string): string {
    const first = firstName ? firstName.charAt(0) : '';
    const last = lastName ? lastName.charAt(0) : '';
    return (first + last).toUpperCase();
}

/**
 * Format currency strings.
 */
export function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2
    }).format(amount);
}
