/**
 * Property-Based Tests for RBAC (Role-Based Access Control)
 * 
 * These tests verify the correctness properties of the role-based access control
 * using fast-check for property-based testing.
 * 
 * Run with: npm test -- roles.guard.spec.ts
 */

import * as fc from 'fast-check';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../schemas/user.schema';

// Mock ExecutionContext factory
function createMockExecutionContext(userRole: UserRole | null): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user: userRole ? { role: userRole, sub: 'test-user-id', email: 'test@example.com' } : null,
      }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

// Mock Reflector factory
function createMockReflector(requiredRoles: UserRole[] | null): Reflector {
  return {
    getAllAndOverride: () => requiredRoles,
  } as unknown as Reflector;
}

// Write operations that require Admin or Editor role
const WRITE_OPERATIONS = ['create', 'update', 'delete'] as const;

// All user roles
const ALL_ROLES = [UserRole.Admin, UserRole.Editor, UserRole.Viewer] as const;

// Roles that can perform write operations
const WRITE_CAPABLE_ROLES = [UserRole.Admin, UserRole.Editor] as const;

describe('RBAC Property Tests', () => {
  /**
   * **Feature: demo-preparation, Property 10: RBAC Viewer Restriction**
   * **Validates: Requirements 7.3**
   * 
   * For any user with Viewer role attempting a write operation (create, update, delete),
   * the operation should be rejected with an authorization error.
   */
  describe('Property 10: RBAC Viewer Restriction', () => {
    it('**Feature: demo-preparation, Property 10: RBAC Viewer Restriction**', () => {
      fc.assert(
        fc.property(
          // Generate random required roles that include write-capable roles (Admin or Editor)
          fc.constantFrom(...WRITE_CAPABLE_ROLES),
          (requiredRole) => {
            // Create a guard that requires Admin or Editor role
            const reflector = createMockReflector([requiredRole]);
            const guard = new RolesGuard(reflector);
            
            // Create context with Viewer user
            const context = createMockExecutionContext(UserRole.Viewer);
            
            // Viewer should be rejected when Admin or Editor is required
            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Viewer cannot access endpoints requiring Admin role', () => {
      fc.assert(
        fc.property(
          fc.constant(UserRole.Admin),
          () => {
            const reflector = createMockReflector([UserRole.Admin]);
            const guard = new RolesGuard(reflector);
            const context = createMockExecutionContext(UserRole.Viewer);
            
            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Viewer cannot access endpoints requiring Editor role', () => {
      fc.assert(
        fc.property(
          fc.constant(UserRole.Editor),
          () => {
            const reflector = createMockReflector([UserRole.Editor]);
            const guard = new RolesGuard(reflector);
            const context = createMockExecutionContext(UserRole.Viewer);
            
            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Viewer cannot access endpoints requiring Admin or Editor role', () => {
      fc.assert(
        fc.property(
          fc.constant([UserRole.Admin, UserRole.Editor]),
          () => {
            const reflector = createMockReflector([UserRole.Admin, UserRole.Editor]);
            const guard = new RolesGuard(reflector);
            const context = createMockExecutionContext(UserRole.Viewer);
            
            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: demo-preparation, Property 11: RBAC Editor Permission**
   * **Validates: Requirements 7.4**
   * 
   * For any user with Editor role attempting a write operation on operational data,
   * the operation should succeed.
   */
  describe('Property 11: RBAC Editor Permission', () => {
    it('**Feature: demo-preparation, Property 11: RBAC Editor Permission**', () => {
      fc.assert(
        fc.property(
          // Generate scenarios where Editor role is sufficient
          fc.constantFrom(
            [UserRole.Editor] as UserRole[],
            [UserRole.Admin, UserRole.Editor] as UserRole[],
            [UserRole.Editor, UserRole.Viewer] as UserRole[]
          ),
          (requiredRoles) => {
            const reflector = createMockReflector(requiredRoles);
            const guard = new RolesGuard(reflector);
            const context = createMockExecutionContext(UserRole.Editor);
            
            // Editor should be allowed when Editor is in required roles
            expect(guard.canActivate(context)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Editor can access endpoints requiring Editor role', () => {
      fc.assert(
        fc.property(
          fc.constant(UserRole.Editor),
          () => {
            const reflector = createMockReflector([UserRole.Editor]);
            const guard = new RolesGuard(reflector);
            const context = createMockExecutionContext(UserRole.Editor);
            
            expect(guard.canActivate(context)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Editor can access endpoints requiring Admin or Editor role', () => {
      fc.assert(
        fc.property(
          fc.constant([UserRole.Admin, UserRole.Editor]),
          () => {
            const reflector = createMockReflector([UserRole.Admin, UserRole.Editor]);
            const guard = new RolesGuard(reflector);
            const context = createMockExecutionContext(UserRole.Editor);
            
            expect(guard.canActivate(context)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Editor cannot access Admin-only endpoints', () => {
      fc.assert(
        fc.property(
          fc.constant(UserRole.Admin),
          () => {
            const reflector = createMockReflector([UserRole.Admin]);
            const guard = new RolesGuard(reflector);
            const context = createMockExecutionContext(UserRole.Editor);
            
            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional RBAC properties for completeness
   */
  describe('Additional RBAC Properties', () => {
    it('Admin can access any protected endpoint', () => {
      fc.assert(
        fc.property(
          // Generate any combination of required roles
          fc.subarray(ALL_ROLES as unknown as UserRole[], { minLength: 1 }),
          (requiredRoles) => {
            const reflector = createMockReflector(requiredRoles);
            const guard = new RolesGuard(reflector);
            const context = createMockExecutionContext(UserRole.Admin);
            
            // Admin should always be allowed if Admin is in required roles
            if (requiredRoles.includes(UserRole.Admin)) {
              expect(guard.canActivate(context)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Unauthenticated users are rejected', () => {
      fc.assert(
        fc.property(
          fc.subarray(ALL_ROLES as unknown as UserRole[], { minLength: 1 }),
          (requiredRoles) => {
            const reflector = createMockReflector(requiredRoles);
            const guard = new RolesGuard(reflector);
            const context = createMockExecutionContext(null);
            
            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('No role requirement allows all authenticated users', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_ROLES),
          (userRole) => {
            const reflector = createMockReflector(null);
            const guard = new RolesGuard(reflector);
            const context = createMockExecutionContext(userRole);
            
            // No role requirement should allow access
            expect(guard.canActivate(context)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Empty role requirement allows all authenticated users', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_ROLES),
          (userRole) => {
            const reflector = createMockReflector([]);
            const guard = new RolesGuard(reflector);
            const context = createMockExecutionContext(userRole);
            
            // Empty role requirement should allow access
            expect(guard.canActivate(context)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
