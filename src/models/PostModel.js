import { supabase } from '../services/supabaseClient';

class PostModel {
  static async getPosts() {
    const { data, error } = await supabase
      .from('global_posts')
      .select('*, user:users(username)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createPost(postData) {
    const { data, error } = await supabase
      .from('global_posts')
      .insert([postData])
      .select('*, user:users(username)')
      .single();

    if (error) throw error;
    return data;
  }

  static async updatePost(postId, updates) {
    const { data, error } = await supabase
      .from('global_posts')
      .update(updates)
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static setupRealtimePosts(callback) {
    const subscription = supabase
      .channel('public:global_posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'global_posts',
        },
        (payload) => callback('INSERT', payload)
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'global_posts',
        },
        (payload) => callback('UPDATE', payload)
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }
}

export default PostModel;