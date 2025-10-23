import { supabase } from '../services/supabaseClient';

class MessageModel {
  static async getMessages(currentUserId, otherUserId) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async sendMessage(messageData) {
    const { data, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static setupRealtimeMessages(currentUserId, callback) {
    const subscription = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(receiver_id.eq.${currentUserId},sender_id.eq.${currentUserId})`
        },
        (payload) => callback('INSERT', payload)
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `or(receiver_id.eq.${currentUserId},sender_id.eq.${currentUserId})`
        },
        (payload) => callback('UPDATE', payload)
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }
}

export default MessageModel;