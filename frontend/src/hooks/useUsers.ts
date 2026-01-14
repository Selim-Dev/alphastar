import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { User } from '@/types';

interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: 'Admin' | 'Editor' | 'Viewer';
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get<User[]>('/auth/users');
      return data;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userData: CreateUserData) => {
      const { data } = await api.post<User>('/auth/register', userData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
