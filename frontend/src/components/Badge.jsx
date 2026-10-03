import React from 'react';

/**
 * Standardized status badge adhering to the Modern Academic Navy color system.
 * 
 * Variants supported:
 * - available: Green
 * - limited: Amber
 * - unavailable: Red
 * - active: Blue / Green
 * - pending: Amber
 * - cancelled: Red
 * - admin: Navy
 */
export default function Badge({ variant = 'default', children, className = '', title }) {
  const variantMap = {
    available: 'badge-in-stock',
    in_stock: 'badge-in-stock',
    completed: 'status-badge status-completed',
    returned: 'status-badge status-returned',
    limited: 'badge-limited',
    approved: 'status-badge status-approved',
    pending: 'status-badge status-pending',
    unavailable: 'badge-out-of-stock',
    out_of_stock: 'badge-out-of-stock',
    cancelled: 'status-badge status-cancelled',
    overdue: 'status-badge status-overdue',
    active: 'status-badge status-issued',
    issued: 'status-badge status-issued',
    admin: 'badge-admin',
    category: 'category-pill',
  };

  const badgeClass = variantMap[variant.toLowerCase()] || 'badge';

  return (
    <span className={`${badgeClass} ${className}`} title={title}>
      {children}
    </span>
  );
}
