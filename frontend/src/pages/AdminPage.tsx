import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { FormField, Input, Select, Button } from '@/components/ui/Form';
import { ExportButton } from '@/components/ui/ExportButton';
import { HealthCheckPanel } from '@/components/ui/HealthCheckPanel';
import { useUsers, useCreateUser } from '@/hooks/useUsers';
import { useAircraft, useCreateAircraft, useUpdateAircraft, useDeleteAircraft } from '@/hooks/useAircraft';
import type { User, Aircraft } from '@/types';

// User form schema
const userSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['Admin', 'Editor', 'Viewer']),
});

type UserFormData = z.infer<typeof userSchema>;

// Aircraft form schema
const aircraftSchema = z.object({
  registration: z.string().min(1, 'Registration is required'),
  fleetGroup: z.string().min(1, 'Fleet group is required'),
  aircraftType: z.string().min(1, 'Aircraft type is required'),
  msn: z.string().min(1, 'MSN is required'),
  owner: z.string().min(1, 'Owner is required'),
  manufactureDate: z.string().min(1, 'Manufacture date is required'),
  inServiceDate: z.string().optional(),
  enginesCount: z.number().min(1, 'Engines count must be at least 1').max(4, 'Engines count must be at most 4'),
  status: z.enum(['active', 'parked', 'leased']),
});

type AircraftFormData = z.infer<typeof aircraftSchema>;

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'aircraft' | 'health'>('users');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Admin Settings</h1>
      
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'users'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          User Management
        </button>
        <button
          onClick={() => setActiveTab('aircraft')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'aircraft'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Aircraft Master
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'health'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Data Health
        </button>
      </div>

      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'aircraft' && <AircraftManagement />}
      {activeTab === 'health' && <HealthCheckPanel />}
    </div>
  );
}


// Role descriptions for help section
const ROLE_DESCRIPTIONS = [
  {
    role: 'Admin',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    permissions: [
      'Full read access to all data',
      'Create, update, and delete all records',
      'Manage users (create, edit, delete)',
      'Access admin settings and health check',
      'Run seed scripts and data imports',
    ],
  },
  {
    role: 'Editor',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    permissions: [
      'Full read access to all data',
      'Create and update operational records',
      'Cannot delete records',
      'Cannot manage users',
      'Cannot access admin-only features',
    ],
  },
  {
    role: 'Viewer',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    permissions: [
      'Read-only access to all data',
      'View dashboards and reports',
      'Export data to Excel',
      'Cannot create, update, or delete records',
      'Cannot access admin settings',
    ],
  },
];

// User Management Component
function UserManagement() {
  const [showForm, setShowForm] = useState(false);
  const [showRoleHelp, setShowRoleHelp] = useState(false);
  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  const onSubmit = async (data: UserFormData) => {
    try {
      await createUser.mutateAsync(data);
      reset();
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const userColumns: ColumnDef<User, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.original.role === 'Admin'
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              : row.original.role === 'Editor'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          {row.original.role}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return <div className="text-muted-foreground">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Role Descriptions Help Section */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setShowRoleHelp(!showRoleHelp)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium text-foreground">Role Permissions Guide</span>
          </div>
          <svg
            className={`w-5 h-5 text-muted-foreground transition-transform ${showRoleHelp ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showRoleHelp && (
          <div className="px-4 pb-4 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {ROLE_DESCRIPTIONS.map((roleInfo) => (
                <div key={roleInfo.role} className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
                      {roleInfo.role}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {roleInfo.permissions.map((permission, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{permission}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Users</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Add User'}
        </Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-md font-medium text-foreground mb-4">Create New User</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Name" error={errors.name} required>
                <Input {...register('name')} error={!!errors.name} placeholder="John Doe" />
              </FormField>
              <FormField label="Email" error={errors.email} required>
                <Input {...register('email')} type="email" error={!!errors.email} placeholder="user@example.com" />
              </FormField>
              <FormField label="Password" error={errors.password} required>
                <Input {...register('password')} type="password" error={!!errors.password} placeholder="••••••" />
              </FormField>
              <FormField label="Role" error={errors.role} required>
                <Select
                  {...register('role')}
                  error={!!errors.role}
                  options={[
                    { value: 'Admin', label: 'Admin' },
                    { value: 'Editor', label: 'Editor' },
                    { value: 'Viewer', label: 'Viewer' },
                  ]}
                />
              </FormField>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { reset(); setShowForm(false); }}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createUser.isPending}>
                Create User
              </Button>
            </div>
          </form>
        </div>
      )}

      <DataTable data={users || []} columns={userColumns} searchColumn="name" searchPlaceholder="Search users..." />
    </div>
  );
}


// Aircraft Management Component
function AircraftManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingAircraft, setEditingAircraft] = useState<Aircraft | null>(null);
  const { data: aircraftData, isLoading } = useAircraft({ limit: 100 });
  const createAircraft = useCreateAircraft();
  const updateAircraft = useUpdateAircraft();
  const deleteAircraft = useDeleteAircraft();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AircraftFormData>({
    resolver: zodResolver(aircraftSchema),
    defaultValues: {
      enginesCount: 2,
    },
  });

  const openEditForm = (aircraft: Aircraft) => {
    setEditingAircraft(aircraft);
    setValue('registration', aircraft.registration);
    setValue('fleetGroup', aircraft.fleetGroup);
    setValue('aircraftType', aircraft.aircraftType);
    setValue('msn', aircraft.msn);
    setValue('owner', aircraft.owner);
    setValue('manufactureDate', aircraft.manufactureDate.split('T')[0]);
    if (aircraft.inServiceDate) {
      setValue('inServiceDate', aircraft.inServiceDate.split('T')[0]);
    }
    setValue('enginesCount', aircraft.enginesCount);
    setValue('status', aircraft.status);
    setShowForm(true);
  };

  const closeForm = () => {
    setEditingAircraft(null);
    reset();
    setShowForm(false);
  };

  const onSubmit = async (data: AircraftFormData) => {
    try {
      if (editingAircraft) {
        const aircraftId = editingAircraft.id || editingAircraft._id;
        await updateAircraft.mutateAsync({ id: aircraftId, ...data });
      } else {
        await createAircraft.mutateAsync(data);
      }
      closeForm();
    } catch (error) {
      console.error('Failed to save aircraft:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this aircraft?')) {
      try {
        await deleteAircraft.mutateAsync(id);
      } catch (error) {
        console.error('Failed to delete aircraft:', error);
      }
    }
  };

  const aircraftColumns: ColumnDef<Aircraft, unknown>[] = [
    {
      accessorKey: 'registration',
      header: 'Registration',
      cell: ({ row }) => (
        <span className="font-medium text-primary">{row.original.registration}</span>
      ),
    },
    {
      accessorKey: 'fleetGroup',
      header: 'Fleet Group',
    },
    {
      accessorKey: 'aircraftType',
      header: 'Type',
    },
    {
      accessorKey: 'msn',
      header: 'MSN',
    },
    {
      accessorKey: 'owner',
      header: 'Owner',
    },
    {
      accessorKey: 'manufactureDate',
      header: 'Manufacture Date',
      cell: ({ row }) => {
        if (!row.original.manufactureDate) return '-';
        return new Date(row.original.manufactureDate).toLocaleDateString();
      },
    },
    {
      accessorKey: 'inServiceDate',
      header: 'In Service Date',
      cell: ({ row }) => {
        if (!row.original.inServiceDate) return '-';
        return new Date(row.original.inServiceDate).toLocaleDateString();
      },
    },
    {
      accessorKey: 'enginesCount',
      header: 'Engines',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.original.status === 'active'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : row.original.status === 'parked'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          }`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditForm(row.original)}
            className="text-sm text-primary hover:underline"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(row.original.id || row.original._id)}
            className="text-sm text-destructive hover:underline"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <div className="text-muted-foreground">Loading aircraft...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Aircraft</h2>
        <div className="flex items-center gap-2">
          <ExportButton
            exportType="aircraft"
            filename="aircraft-master.xlsx"
            label="Export"
          />
          <Button onClick={() => { setEditingAircraft(null); reset(); setShowForm(!showForm); }}>
            {showForm ? 'Cancel' : 'Add Aircraft'}
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-md font-medium text-foreground mb-4">
            {editingAircraft ? 'Edit Aircraft' : 'Create New Aircraft'}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField label="Registration" error={errors.registration} required>
                <Input
                  {...register('registration')}
                  error={!!errors.registration}
                  placeholder="HZ-A42"
                  disabled={!!editingAircraft}
                />
              </FormField>
              <FormField label="Fleet Group" error={errors.fleetGroup} required>
                <Input {...register('fleetGroup')} error={!!errors.fleetGroup} placeholder="A330" />
              </FormField>
              <FormField label="Aircraft Type" error={errors.aircraftType} required>
                <Input {...register('aircraftType')} error={!!errors.aircraftType} placeholder="A340-642" />
              </FormField>
              <FormField label="MSN" error={errors.msn} required>
                <Input {...register('msn')} error={!!errors.msn} placeholder="12345" />
              </FormField>
              <FormField label="Owner" error={errors.owner} required>
                <Input {...register('owner')} error={!!errors.owner} placeholder="Alpha Star Aviation" />
              </FormField>
              <FormField label="Manufacture Date" error={errors.manufactureDate} required>
                <Input {...register('manufactureDate')} type="date" error={!!errors.manufactureDate} />
              </FormField>
              <FormField label="In Service Date" error={errors.inServiceDate}>
                <Input {...register('inServiceDate')} type="date" error={!!errors.inServiceDate} />
              </FormField>
              <FormField label="Engines Count" error={errors.enginesCount} required>
                <Input {...register('enginesCount')} type="number" min={1} max={4} error={!!errors.enginesCount} />
              </FormField>
              <FormField label="Status" error={errors.status} required>
                <Select
                  {...register('status')}
                  error={!!errors.status}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'parked', label: 'Parked' },
                    { value: 'leased', label: 'Leased' },
                  ]}
                />
              </FormField>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createAircraft.isPending || updateAircraft.isPending}>
                {editingAircraft ? 'Update Aircraft' : 'Create Aircraft'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <DataTable
        data={aircraftData?.data || []}
        columns={aircraftColumns}
        searchColumn="registration"
        searchPlaceholder="Search aircraft..."
      />
    </div>
  );
}
