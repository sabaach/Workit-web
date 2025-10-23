import MessageModel from '../models/MessageModel';
import { supabase } from '../services/supabaseClient';

class MessageController {
  static async loadMessages(currentUserId, otherUserId) {
    return await MessageModel.getMessages(currentUserId, otherUserId);
  }

  static async sendMessage(currentUserId, selectedUserId, content) {
    const messageData = {
      sender_id: currentUserId,
      receiver_id: selectedUserId,
      content: content.trim(),
      is_read: false,
      created_at: new Date().toISOString()
    };

    return await MessageModel.sendMessage(messageData);
  }

  static setupRealtimeMessaging(currentUserId, onMessageUpdate) {
    return MessageModel.setupRealtimeMessages(currentUserId, onMessageUpdate);
  }

  static async setupOnlinePresence(currentUser, onPresenceUpdate) {
    // Implementation for online presence
    const presenceChannel = supabase.channel('online_users_global', {
      config: {
        presence: { key: currentUser.id },
        broadcast: { self: true }
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const onlineUserIds = new Set();
        
        Object.values(state).forEach((presences) => {
          presences.forEach((presence) => {
            onlineUserIds.add(presence.key);
          });
        });
        
        onPresenceUpdate(onlineUserIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: currentUser.id,
            username: currentUser.username,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      presenceChannel.untrack();
      presenceChannel.unsubscribe();
    };
  }
}

export default MessageController;