import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./PageTopbar.css";

function PageTopbar({ user, onOpenProfile }) {
  const firstName = user.name?.split(" ")[0] || "Donor";
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const loadNotifications = async () => {
    try {
      const response = await axios.get("/api/auth/notifications", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      setNotifications(response.data.notifications || []);
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => {
    loadNotifications();
    const timerId = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    const closeDropdown = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", closeDropdown);
    return () => document.removeEventListener("mousedown", closeDropdown);
  }, []);

  const openNotifications = async () => {
    setIsOpen((current) => !current);
    if (notifications.some((notification) => !notification.is_read)) {
      await axios.put("/api/auth/notifications/read", {}, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      setNotifications((current) => current.map((notification) => ({
        ...notification,
        is_read: 1,
      })));
    }
  };

  return (
    <div className="page-topbar">
      <div className="notification-container" ref={containerRef}>
        <button
          aria-label="Open notifications"
          className="notification-button"
          onClick={openNotifications}
          type="button"
        >
          <BellIcon />
          {notifications.some((notification) => !notification.is_read) && (
            <span className="notification-badge">
              {notifications.filter((notification) => !notification.is_read).length}
            </span>
          )}
        </button>
        {isOpen && (
          <div className="notification-dropdown">
            <div className="notification-heading">
              <strong>Notifications</strong>
              <span>{notifications.length}</span>
            </div>
            {notifications.length ? notifications.map((notification) => (
              <article className="notification-item" key={notification.id}>
                <strong>{notification.title}</strong>
                <p>{notification.message}</p>
                <small>{formatNotificationDate(notification.created_at)}</small>
              </article>
            )) : <p className="notification-empty">No notifications yet.</p>}
          </div>
        )}
      </div>
      <button
        aria-label="Open profile"
        className="page-profile-button"
        onClick={onOpenProfile}
        type="button"
      >
        <div className="dashboard-avatar">
          {user.profilePicture ? (
            <img alt="" src={user.profilePicture} />
          ) : (
            firstName.charAt(0).toUpperCase()
          )}
        </div>
      </button>
      <span className="page-user-role">{user.role || "donor"}</span>
    </div>
  );
}

function BellIcon() {
  return (
    <svg className="dashboard-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function formatNotificationDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en", {
    day: "2-digit", month: "short", year: "numeric",
  }).format(date);
}

export default PageTopbar;
