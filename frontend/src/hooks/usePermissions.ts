import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to check user permissions based on role
 * 
 * Role Permissions:
 * - Viewer: Read only
 * - Editor: Read + Create/Update
 * - Admin: Read + Create/Update + Delete + User Management
 */
export function usePermissions() {
  const { user } = useAuth();
  
  const role = user?.role;
  
  return {
    // Can view data (all roles)
    canRead: !!role,
    
    // Can create and update data (Editor, Admin)
    canWrite: role === 'Editor' || role === 'Admin',
    
    // Can delete data (Admin only)
    canDelete: role === 'Admin',
    
    // Can manage users (Admin only)
    canManageUsers: role === 'Admin',
    
    // Can import data (Admin only)
    canImport: role === 'Admin',
    
    // Check if user is a specific role
    isViewer: role === 'Viewer',
    isEditor: role === 'Editor',
    isAdmin: role === 'Admin',
    
    // Current role
    role,
  };
}
