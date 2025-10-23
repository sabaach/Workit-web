import UserModel from '../models/UserModel';

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
    await UserModel.updateOnlineStatus(userId, isOnline);
  }
}

export default AuthController;