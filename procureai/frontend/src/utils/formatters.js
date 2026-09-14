/**
 * ProcureAI - Indian Currency & Number Formatters
 * Formats values consistently using ₹ (INR), Crore (Cr), and Lakh.
 */

/**
 * Formats a number or string into Indian Rupee format.
 * Examples:
 *   formatIndianCurrency(24800000)  => '₹2.48 Cr'
 *   formatIndianCurrency(84000000)  => '₹8.4 Cr'
 *   formatIndianCurrency(8500000)   => '₹85 Lakh'
 *   formatIndianCurrency('$24.8M')  => '₹24.8 Cr'
 *   formatIndianCurrency('$8.4M')   => '₹8.4 Cr'
 */
export const formatIndianCurrency = (amount) => {
  if (amount === undefined || amount === null) return '';

  if (typeof amount === 'string') {
    const trimmed = amount.trim();
    if (trimmed.startsWith('₹')) return trimmed;

    if (trimmed.startsWith('$')) {
      const clean = trimmed.replace('$', '').trim();
      if (clean.endsWith('M')) {
        const val = parseFloat(clean.slice(0, -1));
        return `₹${val} Cr`;
      }
      if (clean.endsWith('K')) {
        const val = parseFloat(clean.slice(0, -1));
        return `₹${parseFloat((val / 100).toFixed(1))} Lakh`;
      }
      const num = parseFloat(clean.replace(/,/g, ''));
      if (!isNaN(num)) {
        return formatIndianCurrency(num);
      }
    }
    return trimmed;
  }

  if (typeof amount === 'number') {
    if (amount >= 10000000) {
      const cr = amount / 10000000;
      return `₹${cr % 1 === 0 ? cr : parseFloat(cr.toFixed(2))} Cr`;
    }
    if (amount >= 100000) {
      const lakh = amount / 100000;
      return `₹${lakh % 1 === 0 ? lakh : parseFloat(lakh.toFixed(2))} Lakh`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return String(amount);
};
