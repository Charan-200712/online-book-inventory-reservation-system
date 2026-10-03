import reservationService from './reservationService.js';
import transactionService from './transactionService.js';
import bookService from './bookService.js';

const STORAGE_PREFIX = 'library_read_notifs_';

function getReadIds(userId) {
  if (typeof window === 'undefined' || !window.localStorage || !userId) {
    return new Set();
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveReadIds(userId, readSet) {
  if (typeof window === 'undefined' || !window.localStorage || !userId) return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(Array.from(readSet)));
  } catch (err) {
    console.error('Failed to persist read notifications:', err);
  }
}

/**
 * Format relative / calendar timestamp
 */
export function formatNotificationTime(dateInput) {
  if (!dateInput) return 'Just now';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Recently';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24 && now.getDate() === date.getDate()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export const notificationService = {
  /**
   * Derive real notifications from backend reservations, transactions, and catalog
   * @param {object} user - Current user object
   * @returns {Promise<Array>} List of notification items
   */
  async getNotifications(user) {
    if (!user || !user.id) {
      return [];
    }

    const readSet = getReadIds(user.id);
    const notifications = [];

    // 1. Fetch real user reservations and circulation transactions
    const [reservationsRes, transactionsRes, booksRes] = await Promise.allSettled([
      reservationService.getMyReservations(),
      transactionService.getMyTransactions(),
      bookService.getBooks({ available: 'true', limit: 6 }),
    ]);

    const reservations = reservationsRes.status === 'fulfilled' ? (reservationsRes.value || []) : [];
    const transactions = transactionsRes.status === 'fulfilled' ? (transactionsRes.value || []) : [];
    const availableBooks = booksRes.status === 'fulfilled' ? (booksRes.value?.books || []) : [];

    const now = new Date();

    // 2. Process Reservations (Confirmed / Approved / Cancelled)
    for (const res of reservations) {
      const resDate = res.reservation_date ? new Date(res.reservation_date) : new Date();

      if (res.status === 'APPROVED') {
        const id = `res-approved-${res.id}`;
        notifications.push({
          id,
          type: 'Reservation confirmed',
          title: 'Reservation Approved',
          message: `Your hold on "${res.book_title || 'requested title'}" is approved and ready for pickup at the circulation desk.`,
          timestamp: resDate,
          category: 'success',
          icon: '✅',
          isRead: readSet.has(id),
          link: '/dashboard?tab=reservations',
        });
      } else if (res.status === 'PENDING') {
        const id = `res-pending-${res.id}`;
        notifications.push({
          id,
          type: 'Reservation confirmed',
          title: 'Hold Reservation Placed',
          message: `Your hold request for "${res.book_title || 'requested title'}" was submitted and is pending desk verification.`,
          timestamp: resDate,
          category: 'info',
          icon: '📑',
          isRead: readSet.has(id),
          link: '/dashboard?tab=reservations',
        });
      } else if (res.status === 'CANCELLED') {
        const id = `res-cancelled-${res.id}`;
        notifications.push({
          id,
          type: 'Reservation cancelled',
          title: 'Reservation Cancelled',
          message: `Your reservation for "${res.book_title || 'requested title'}" was cancelled. The copy has been returned to shelves.`,
          timestamp: resDate,
          category: 'warning',
          icon: '🚫',
          isRead: readSet.has(id),
          link: '/dashboard?tab=reservations',
        });
      }
    }

    // 3. Process Transactions (Due soon / Overdue)
    for (const tx of transactions) {
      if (tx.status === 'RETURNED') continue;

      const dueDate = new Date(tx.due_date);
      const isPastDue = now > dueDate || tx.status === 'OVERDUE';
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const formattedDueDate = dueDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

      if (isPastDue) {
        const id = `tx-overdue-${tx.id}`;
        notifications.push({
          id,
          type: 'Overdue',
          title: 'Overdue Loan Notice',
          message: `Physical copy of "${tx.book_title || 'borrowed book'}" was due on ${formattedDueDate}. Please return it to avoid holds.`,
          timestamp: dueDate,
          category: 'error',
          icon: '⚠️',
          isRead: readSet.has(id),
          link: '/dashboard?tab=loans',
        });
      } else if (diffDays <= 3 && diffDays >= 0) {
        const id = `tx-due-soon-${tx.id}`;
        const daysText = diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : `in ${diffDays} days`;
        notifications.push({
          id,
          type: 'Due soon',
          title: 'Book Due Soon',
          message: `Loan for "${tx.book_title || 'borrowed book'}" is due ${daysText} (${formattedDueDate}).`,
          timestamp: new Date(tx.issue_date || now),
          category: 'warning',
          icon: '⏰',
          isRead: readSet.has(id),
          link: '/dashboard?tab=loans',
        });
      }
    }

    // 4. Process Book Availability
    // Display available copies for books recently interacted with or top in-stock titles
    const userBookIds = new Set([
      ...reservations.map((r) => r.book_id),
      ...transactions.map((t) => t.book_id),
    ]);

    for (const book of availableBooks) {
      if (userBookIds.has(book.id) && book.available_copies > 0) {
        const id = `book-avail-${book.id}`;
        notifications.push({
          id,
          type: 'Book available',
          title: 'Book In Stock',
          message: `"${book.title}" is currently available with ${book.available_copies} copies on the shelf.`,
          timestamp: new Date(book.created_at || now),
          category: 'info',
          icon: '📘',
          isRead: readSet.has(id),
          link: `/books/${book.id}`,
        });
      }
    }

    // 5. System Information Notice
    const sysId = 'system-info-library-policy';
    notifications.push({
      id: sysId,
      type: 'System information',
      title: 'Circulation Desk Hours',
      message: 'The departmental circulation desk is open Mon–Fri 8:30 AM – 5:30 PM. Standard loan period is 14 days.',
      timestamp: new Date(user.created_at || '2026-09-01'),
      category: 'info',
      icon: 'ℹ️',
      isRead: readSet.has(sysId),
      link: '/dashboard',
    });

    // Sort notifications: unread first, then newest timestamp first
    notifications.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime() || 0;
      const timeB = new Date(b.timestamp).getTime() || 0;
      return timeB - timeA;
    });

    return notifications;
  },

  /**
   * Mark a single notification as read
   */
  markAsRead(userId, notifId) {
    if (!userId || !notifId) return;
    const readSet = getReadIds(userId);
    readSet.add(notifId);
    saveReadIds(userId, readSet);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead(userId, notifIds) {
    if (!userId || !Array.isArray(notifIds)) return;
    const readSet = getReadIds(userId);
    for (const id of notifIds) {
      readSet.add(id);
    }
    saveReadIds(userId, readSet);
  },
};

export default notificationService;
