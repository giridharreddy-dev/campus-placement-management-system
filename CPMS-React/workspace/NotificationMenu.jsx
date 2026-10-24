import { useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon';

export default function NotificationMenu({ notices, actions, onViewAll }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef(null);
  const trigger = useRef(null);
  const id = useId();
  const panelId = `${id}-notifications`;
  const titleId = `${id}-notifications-title`;
  const unread = notices.filter((notice) => !notice.read).length;

  useEffect(() => {
    if (!open) return undefined;

    const dismissOutside = (event) => {
      if (!wrapper.current?.contains(event.target)) setOpen(false);
    };
    const dismissWithEscape = (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    };

    document.addEventListener('pointerdown', dismissOutside);
    document.addEventListener('keydown', dismissWithEscape);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
      document.removeEventListener('keydown', dismissWithEscape);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  return (
    <div className="ws-notice-wrapper" ref={wrapper}>
      <button
        ref={trigger}
        type="button"
        className="ws-icon-button ws-bell"
        aria-label={`Notifications, ${unread} unread`}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <Icon name="bell" />
        {unread > 0 && <span>{unread}</span>}
      </button>
      {open && (
        <section
          id={panelId}
          className="ws-notice-popover"
          role="region"
          aria-labelledby={titleId}
        >
          <header>
            <strong id={titleId}>Notifications</strong>
            <div className="ws-notice-actions">
              <button
                type="button"
                className="ws-text-button"
                onClick={actions.readAll}
              >
                Mark all read
              </button>
              <button
                type="button"
                className="ws-icon-button"
                aria-label="Close notifications"
                onClick={close}
              >
                <Icon name="close" size={17} />
              </button>
            </div>
          </header>
          {notices.slice(0, 4).map((notice) => (
            <button
              type="button"
              key={notice.id}
              className={notice.read ? '' : 'unread'}
              onClick={() => actions.readNotice(notice.id)}
            >
              <strong>{notice.title}</strong>
              <small>{notice.detail}</small>
            </button>
          ))}
          {!notices.length && <p className="ws-muted">You’re all caught up.</p>}
          <button
            type="button"
            className="ws-text-button"
            onClick={() => {
              setOpen(false);
              onViewAll();
            }}
          >
            View all updates
            <Icon name="arrow" size={15} />
          </button>
        </section>
      )}
    </div>
  );
}
