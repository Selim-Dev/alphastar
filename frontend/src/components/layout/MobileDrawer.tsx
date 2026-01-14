import { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// ============================================
// MobileDrawer Component
// ============================================

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function MobileDrawer({ open, onClose, children }: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Handle escape key to close drawer
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && open) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Handle click outside to close
  function handleBackdropClick(event: React.MouseEvent) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className="fixed inset-y-0 left-0 w-[280px] max-w-[85vw] bg-sidebar border-r border-sidebar-border shadow-theme-lg
                   animate-in slide-in-from-left duration-300 ease-out"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center
                     text-sidebar-muted hover:text-sidebar hover:bg-sidebar-muted/50
                     transition-colors duration-150 z-10"
          aria-label="Close navigation menu"
        >
          <X size={20} />
        </button>

        {/* Drawer content */}
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default MobileDrawer;
