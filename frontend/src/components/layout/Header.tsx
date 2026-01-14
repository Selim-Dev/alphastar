import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { MobileMenu } from './MobileMenu';

export function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="lg:hidden flex items-center gap-2">
          <MobileMenu />
          <h1 className="text-lg font-bold text-foreground">Alpha Star</h1>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>

            <button
              onClick={logout}
              className="px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
