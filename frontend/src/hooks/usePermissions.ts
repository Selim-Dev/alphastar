import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to check user permissions based on role
 * 
 * Role Permissions:
 * - Viewer: Read only
 * - Editor: Read + Create/Update
 * - Admin: Read + Create/Update + Delete + User Management
 * - SuperAdmin: All Admin permissions + Delete AOG Events
 */
export function usePermissions() {
  const { user } = useAuth();
  
  const role = user?.role;
  
  return {
    // Can view data (all roles)
    canRead: !!role,
    
    // Can create and update data (Editor, Admin, SuperAdmin)
    canWrite: role === 'Editor' || role === 'Admin' || role === 'SuperAdmin',
    
    // Can delete data (Admin, SuperAdmin)
    canDelete: role === 'Admin' || role === 'SuperAdmin',
    
    // Can delete AOG events (SuperAdmin only)
    canDeleteAOG: role === 'SuperAdmin',
    
    // Can manage users (Admin, SuperAdmin)
    canManageUsers: role === 'Admin' || role === 'SuperAdmin',
    
    // Can import data (Admin, SuperAdmin)
    canImport: role === 'Admin' || role === 'SuperAdmin',
    
    // Check if user is a specific role
    isViewer: role === 'Viewer',
    isEditor: role === 'Editor',
    isAdmin: role === 'Admin',
    isSuperAdmin: role === 'SuperAdmin',
    
    // Current role
    role,
  };
}
