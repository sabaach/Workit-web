import { supabase } from '../services/supabaseClient';
import bcrypt from 'bcryptjs';

class UserModel {
  static async login(username, password) {
    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .single();

      if (error || !user) throw new Error("User tidak ditemukan");

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) throw new Error("Password salah");

      return user;
    } catch (error) {
      throw error;
    }
  }

  static async register(username, password) {
    try {
      // Check if username exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (existingUser) throw new Error("Username sudah terdaftar");

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{ username, password: hashedPassword }])
        .select()
        .single();

      if (error) throw error;
      return newUser;
    } catch (error) {
      throw error;
    }
  }

  static async updateOnlineStatus(userId, isOnline) {
    const { error } = await supabase
      .from('users')
      .update({
        is_online: isOnline,
        last_seen: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
  }

  static async getAllUsers(currentUserId) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, created_at, is_online, last_seen')
      .neq('id', currentUserId)
      .order('username');

    if (error) throw error;
    return data || [];
  }
}

export default UserModel;