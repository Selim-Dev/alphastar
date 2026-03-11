import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { FormField, Input, Select, Button } from '@/components/ui/Form';
import { ExportButton } from '@/components/ui/ExportButton';
import { useUsers, useCreateUser } from '@/hooks/useUsers';
import { useAircraft, useCreateAircraft, useUpdateAircraft, useDeleteAircraft } from '@/hooks/useAircraft';
import type { User, Aircraft } from '@/types';

// User form schema
const userSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['SuperAdmin', 'Admin', 'Editor', 'Viewer']),
});

type UserFormData = z.infer<typeof userSchema>;

// Aircraft form schema
const aircraftSchema = z.object({
  registration: z.string().min(1, 'Registration is required'),
  fleetGroup: z.string().min(1, 'Fleet group is required'),
  aircraftType: z.string().min(1, 'Aircraft type is required'),
  msn: z.string().min(1, 'MSN is required'),
  owner: z.string().min(1, 'Owner is required'),
  manufactureDate: z.string().optional(),
  certificationDate: z.string().optional(),
  inServiceDate: z.string().optional(),
  enginesCount: z.coerce.number().min(1, 'Engines count must be at least 1').max(4, 'Engines count must be at most 4'),
  status: z.enum(['active', 'parked', 'leased']),
});

type AircraftFormData = z.infer<typeof aircraftSchema>;

// Tab config
const TABS = [
  {
    id: 'users' as const,
    label: 'User Management',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    id: 'aircraft' as const,
    label: 'Aircraft Master',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'aircraft'>('users');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage users and aircraft fleet data</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === tab.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'aircraft' && <AircraftManagement />}
      </div>
    </div>
  );
}


// Role descriptions for help section
const ROLE_DESCRIPTIONS = [
  {
    role: 'SuperAdmin',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    permissions: [
      'All Admin permissions',
      'Delete AOG events',
      'Full system control',
    ],
  },
  {
    role: 'Admin',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    permissions: [
      'Full read access to all data',
      'Create, update, and delete records',
      'Manage users',
      'Access settings and data import',
    ],
  },
  {
    role: 'Editor',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    permissions: [
      'Full read access to all data',
      'Create and update operational records',
      'Cannot delete records or manage users',
    ],
  },
  {
    role: 'Viewer',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    permissions: [
      'Read-only access to all data',
      'View dashboards and export reports',
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

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'SuperAdmin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Editor': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const userColumns: ColumnDef<User, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.email}</span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(row.original.role)}`}>
          {row.original.role}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return <div className="text-muted-foreground py-8 text-center">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Role Descriptions Help Section */}
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setShowRoleHelp(!showRoleHelp)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-foreground">Role Permissions Guide</span>
          </div>
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform ${showRoleHelp ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showRoleHelp && (
          <div className="px-4 pb-4 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              {ROLE_DESCRIPTIONS.map((roleInfo) => (
                <div key={roleInfo.role} className="bg-muted/30 rounded-lg p-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${roleInfo.color}`}>
                    {roleInfo.role}
                  </span>
                  <ul className="space-y-1">
                    {roleInfo.permissions.map((permission, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-primary mt-0.5 text-[10px]">●</span>
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
        <div className="border border-border rounded-lg p-6 bg-muted/20">
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
                    { value: 'SuperAdmin', label: 'Super Admin' },
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
    formState: { errors },
  } = useForm<AircraftFormData>({
    resolver: zodResolver(aircraftSchema) as never,
    defaultValues: {
      enginesCount: 2,
    },
  });

  const openEditForm = (aircraft: Aircraft) => {
    setEditingAircraft(aircraft);
    reset({
      registration: aircraft.registration,
      fleetGroup: aircraft.fleetGroup,
      aircraftType: aircraft.aircraftType || '',
      msn: aircraft.msn || '',
      owner: aircraft.owner,
      manufactureDate: aircraft.manufactureDate ? aircraft.manufactureDate.split('T')[0] : '',
      certificationDate: aircraft.certificationDate ? aircraft.certificationDate.split('T')[0] : '',
      inServiceDate: aircraft.inServiceDate ? aircraft.inServiceDate.split('T')[0] : '',
      enginesCount: aircraft.enginesCount,
      status: aircraft.status,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setEditingAircraft(null);
    reset();
    setShowForm(false);
  };

  const onSubmit = async (data: AircraftFormData) => {
    try {
      const payload = {
        ...data,
        manufactureDate: data.manufactureDate || undefined,
        certificationDate: data.certificationDate || undefined,
        inServiceDate: data.inServiceDate || undefined,
      };

      if (editingAircraft) {
        const aircraftId = editingAircraft.id || editingAircraft._id;
        const { registration: _reg, ...updatePayload } = payload;
        await updateAircraft.mutateAsync({ id: aircraftId, ...updatePayload });
      } else {
        await createAircraft.mutateAsync(payload);
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
    { accessorKey: 'fleetGroup', header: 'Fleet Group' },
    { accessorKey: 'aircraftType', header: 'Type' },
    { accessorKey: 'msn', header: 'MSN' },
    { accessorKey: 'owner', header: 'Owner' },
    {
      accessorKey: 'manufactureDate',
      header: 'Manufacture Date',
      cell: ({ row }) => row.original.manufactureDate ? new Date(row.original.manufactureDate).toLocaleDateString() : '-',
    },
    {
      accessorKey: 'certificationDate',
      header: 'Certification Date',
      cell: ({ row }) => row.original.certificationDate ? new Date(row.original.certificationDate).toLocaleDateString() : '-',
    },
    {
      accessorKey: 'inServiceDate',
      header: 'In Service Date',
      cell: ({ row }) => row.original.inServiceDate ? new Date(row.original.inServiceDate).toLocaleDateString() : '-',
    },
    { accessorKey: 'enginesCount', header: 'Engines' },
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
    return <div className="text-muted-foreground py-8 text-center">Loading aircraft...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Aircraft Fleet</h2>
          <p className="text-sm text-muted-foreground">{aircraftData?.data?.length || 0} aircraft registered</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton exportType="aircraft" filename="aircraft-master.xlsx" label="Export" />
          <Button onClick={() => { setEditingAircraft(null); reset(); setShowForm(!showForm); }}>
            {showForm && !editingAircraft ? 'Cancel' : 'Add Aircraft'}
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="border border-border rounded-lg p-6 bg-muted/20">
          <h3 className="text-md font-medium text-foreground mb-4">
            {editingAircraft ? `Edit ${editingAircraft.registration}` : 'Register New Aircraft'}
          </h3>
          <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField label="Registration" error={errors.registration} required>
                <Input {...register('registration')} error={!!errors.registration} placeholder="HZ-A42" disabled={!!editingAircraft} />
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
              <FormField label="Manufacture Date" error={errors.manufactureDate}>
                <Input {...register('manufactureDate')} type="date" error={!!errors.manufactureDate} />
              </FormField>
              <FormField label="Certification Date" error={errors.certificationDate}>
                <Input {...register('certificationDate')} type="date" error={!!errors.certificationDate} />
              </FormField>
              <FormField label="In Service Date" error={errors.inServiceDate}>
                <Input {...register('inServiceDate')} type="date" error={!!errors.inServiceDate} />
              </FormField>
              <FormField label="Engines Count" error={errors.enginesCount} required>
                <Input {...register('enginesCount', { valueAsNumber: true })} type="number" min={1} max={4} error={!!errors.enginesCount} />
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
              <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
              <Button type="submit" isLoading={createAircraft.isPending || updateAircraft.isPending}>
                {editingAircraft ? 'Update Aircraft' : 'Register Aircraft'}
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
