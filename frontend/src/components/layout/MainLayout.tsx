import { AppShell } from './AppShell';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function MainLayout() {
  return (
    <AppShell
      sidebar={<Sidebar />}
      topbar={<Topbar />}
    />
  );
}
