import { useEffect, useId, useRef } from 'react';
import Icon from './Icon';

export default function Dialog({ title, children, onClose, wide = false }) {
  const panel = useRef(null);
  const close = useRef(onClose);
  const titleId = useId();
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => [
      ...panel.current.querySelectorAll(
        'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]',
      ),
    ];
    focusable()[0]?.focus();
    const keyboard = (event) => {
      if (event.key === 'Escape') close.current();
      if (event.key !== 'Tab') return;
      const elements = focusable();
      const first = elements[0];
      const last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', keyboard);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="ws-dialog-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`ws-dialog ${wide ? 'ws-dialog-wide' : ''}`}
      >
        <header>
          <h2 id={titleId}>{title}</h2>
          <button
            className="ws-icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <Icon name="close" />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
