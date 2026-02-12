# AOG Event Delete Feature

## Overview

Added the ability to delete AOG events from the AOG list page. This feature is restricted to Admin users only for data integrity and security.

## Implementation Details

### Backend Changes

**File:** `backend/src/aog-events/aog-events.controller.ts`

- Added `@Roles(UserRole.Admin)` decorator to the delete endpoint
- Ensures only Admin users can delete AOG events
- Returns HTTP 204 (No Content) on successful deletion

```typescript
@Delete(':id')
@Roles(UserRole.Admin)
@HttpCode(HttpStatus.NO_CONTENT)
async delete(@Param('id') id: string) {
  await this.aogEventsService.delete(id);
}
```

### Frontend Changes

#### 1. Hook Addition

**File:** `frontend/src/hooks/useAOGEvents.ts`

Added `useDeleteAOGEvent` mutation hook:

```typescript
export function useDeleteAOGEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/aog-events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aog-events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
```

#### 2. UI Implementation

**File:** `frontend/src/pages/aog/AOGListPageEnhanced.tsx`

- Added delete button column to the AOG events table
- Delete button only visible to Admin users
- Confirmation dialog before deletion
- Visual feedback during deletion (disabled state)
- Prevents row click navigation when delete button is clicked

**Key Features:**
- Trash icon button in the Actions column
- Confirmation prompt with event details
- Loading state while deleting
- Automatic table refresh after deletion
- Role-based visibility (Admin only)

## User Experience

### For Admin Users

1. Navigate to AOG Events List page (`/aog/list`)
2. See an "Actions" column with a trash icon for each event
3. Click the trash icon to delete an event
4. Confirm deletion in the dialog showing:
   - Aircraft registration
   - Defect description
   - Warning that action cannot be undone
5. Event is deleted and table refreshes automatically

### For Non-Admin Users (Editor/Viewer)

- No "Actions" column visible
- Cannot delete AOG events
- Backend will reject any delete attempts with 403 Forbidden

## Security

- **Backend:** `@Roles(UserRole.Admin)` decorator enforces role-based access
- **Frontend:** Delete button only rendered for Admin users
- **Confirmation:** User must confirm deletion before action is executed
- **Audit Trail:** Deletion is logged in the backend (via NestJS logging)

## Data Integrity

- Deleting an AOG event will:
  - Remove the event from the database
  - Invalidate related queries (AOG events list, dashboard KPIs)
  - Update analytics automatically
  - Not affect related aircraft or other data

## Testing Checklist

- [ ] Admin user can see delete button
- [ ] Editor user cannot see delete button
- [ ] Viewer user cannot see delete button
- [ ] Confirmation dialog appears with correct event details
- [ ] Deletion succeeds and table refreshes
- [ ] Dashboard KPIs update after deletion
- [ ] Backend rejects non-admin delete attempts
- [ ] Error handling works if deletion fails

## Related Files

- `backend/src/aog-events/aog-events.controller.ts` - Delete endpoint
- `backend/src/aog-events/services/aog-events.service.ts` - Delete service method
- `frontend/src/hooks/useAOGEvents.ts` - Delete mutation hook
- `frontend/src/pages/aog/AOGListPageEnhanced.tsx` - UI implementation
- `frontend/src/contexts/AuthContext.tsx` - User role access

## Notes

- Delete is a destructive operation and cannot be undone
- Consider implementing soft delete (marking as deleted) if audit requirements change
- Currently no bulk delete functionality (can be added if needed)
- Delete button uses red color scheme to indicate destructive action
