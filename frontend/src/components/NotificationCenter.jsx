import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import notificationService, { formatNotificationTime } from '../services/notificationService';

function NotificationCenter() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const containerRef = useRef(null);

  // Fetch real notification data
  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    try {
      const items = await notificationService.getNotifications(user);
      setNotifications(items);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Refresh when opening popover
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (e, notifId) => {
    e.stopPropagation();
    if (!user) return;
    notificationService.markAsRead(user.id, notifId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = (e) => {
    e.stopPropagation();
    if (!user) return;
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    notificationService.markAllAsRead(user.id, unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (notif) => {
    if (!notif.isRead && user) {
      notificationService.markAsRead(user.id, notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const displayedNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  if (!isAuthenticated) return null;

  return (
    <div className="notification-trigger-wrap" ref={containerRef}>
      {/* 1. Bell Trigger Button */}
      <button
        type="button"
        className={`notification-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`View notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
        title="Notifications"
      >
        <span className="bell-icon" aria-hidden="true">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge" aria-label={`${unreadCount} unread notifications`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 2. Notification Popover Panel */}
      {isOpen && (
        <div
          className="notification-popover academic-notif-popover"
          role="dialog"
          aria-label="Library Notifications Panel"
        >
          {/* Header */}
          <div className="notif-popover-header">
            <div className="notif-header-title">
              <h4 className="notif-title">Notifications</h4>
              {unreadCount > 0 ? (
                <span className="badge badge-in-stock notif-unread-count">
                  {unreadCount} Unread
                </span>
              ) : (
                <span className="text-secondary text-xs">All Caught Up</span>
              )}
            </div>

            <div className="notif-header-actions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="btn-text-action"
                  onClick={handleMarkAllAsRead}
                  title="Mark all notifications as read"
                >
                  ✓ Mark all as read
                </button>
              )}
              <button
                type="button"
                className="notif-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close notification panel"
              >
                &times;
              </button>
            </div>
          </div>

          {/* Sub-filter Tabs */}
          <div className="notif-filter-tabs">
            <button
              type="button"
              className={`notif-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              className={`notif-tab ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="notif-body-list" role="feed">
            {displayedNotifications.length === 0 ? (
              <div className="notif-empty-state">
                <span className="notif-empty-icon" aria-hidden="true">📭</span>
                <p className="notif-empty-title">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </p>
                <p className="notif-empty-sub">
                  Your reservation holds and circulation reminders will appear here in real time.
                </p>
              </div>
            ) : (
              displayedNotifications.map((notif) => {
                const categoryClass = `notif-cat-${notif.category || 'info'}`;
                return (
                  <div
                    key={notif.id}
                    className={`notif-card ${notif.isRead ? 'read' : 'unread'} ${categoryClass}`}
                    onClick={() => handleNotificationClick(notif)}
                    role="article"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNotificationClick(notif);
                    }}
                  >
                    {/* Category Icon Badge */}
                    <div className={`notif-icon-box ${categoryClass}`} aria-hidden="true">
                      <span>{notif.icon || 'ℹ️'}</span>
                    </div>

                    {/* Content */}
                    <div className="notif-content-area">
                      <div className="notif-top-row">
                        <span className={`notif-type-tag tag-${notif.category || 'info'}`}>
                          {notif.type}
                        </span>
                        <span className="notif-time">
                          {formatNotificationTime(notif.timestamp)}
                        </span>
                      </div>

                      <h5 className="notif-card-title">{notif.title}</h5>
                      <p className="notif-message-text">{notif.message}</p>
                    </div>

                    {/* Right Action: Mark as read indicator or button */}
                    <div className="notif-action-column">
                      {!notif.isRead ? (
                        <button
                          type="button"
                          className="btn-mark-read"
                          onClick={(e) => handleMarkAsRead(e, notif.id)}
                          title="Mark as read"
                          aria-label="Mark as read"
                        >
                          <span className="unread-dot" />
                        </button>
                      ) : (
                        <span className="read-check" title="Read">✓</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Quick Links */}
          <div className="notif-popover-footer">
            <button
              type="button"
              className="notif-footer-link"
              onClick={() => {
                setIsOpen(false);
                navigate('/dashboard');
              }}
            >
              Go to My Library &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
