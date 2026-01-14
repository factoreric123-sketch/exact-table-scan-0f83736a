import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Theme, UserTheme } from '@/lib/types/theme';
import { toast } from 'sonner';

export const useUserThemes = () => {
  return useQuery({
    queryKey: ['user-themes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_themes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        theme_data: item.theme_data as unknown as Theme,
      })) as UserTheme[];
    },
  });
};

export const useCreateUserTheme = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, theme }: { name: string; theme: Theme }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_themes')
        .insert([{
          user_id: user.id,
          name,
          theme_data: theme as any,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-themes'] });
      toast.success('Theme saved successfully!');
    },
    onError: () => {
      toast.error("Couldn't save theme. Please try again.");
    },
  });
};

export const useUpdateUserTheme = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, theme }: { id: string; name?: string; theme?: Theme }) => {
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (theme !== undefined) updates.theme_data = theme as any;

      const { data, error } = await supabase
        .from('user_themes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-themes'] });
      toast.success('Theme updated!');
    },
    onError: () => {
      toast.error("Couldn't update theme. Please try again.");
    },
  });
};

export const useDeleteUserTheme = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_themes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-themes'] });
      toast.success('Theme deleted!');
    },
    onError: () => {
      toast.error("Couldn't delete theme. Please try again.");
    },
  });
};
