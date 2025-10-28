// controllers/AuthController.js
import UserModel from '../models/UserModel';
import { supabase } from '../services/supabaseClient';

class AuthController {
  static async login(username, password) {
    return await UserModel.login(username, password);
  }

  static async register(username, password, confirmPassword) {
    if (password !== confirmPassword) {
      throw new Error("Password dan konfirmasi tidak cocok");
    }
    return await UserModel.register(username, password);
  }

  static async setOnlineStatus(userId, isOnline) {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error setting online status:', error);
      throw error;
    }
  }
}

export default AuthController;