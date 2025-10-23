import PostModel from '../models/PostModel';

class PostController {
  static async loadPosts() {
    const posts = await PostModel.getPosts();
    return posts.map(post => this.formatPost(post));
  }

  static async createPost(userId, content) {
    const postData = {
      user_id: userId,
      content: content.trim(),
      likes: 0,
      comments: 0,
      shares: 0,
      created_at: new Date().toISOString()
    };

    const newPost = await PostModel.createPost(postData);
    return this.formatPost(newPost);
  }

  static formatPost(post) {
    return {
      id: post.id,
      user: {
        name: post.user.username,
        avatar: post.user.username.charAt(0).toUpperCase()
      },
      content: post.content,
      timestamp: this.formatTimeAgo(post.created_at),
      likes: post.likes,
      comments: post.comments,
      shares: post.shares,
      created_at: post.created_at
    };
  }

  static formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
  }

  static setupRealtimePosts(onPostUpdate) {
    return PostModel.setupRealtimePosts(onPostUpdate);
  }
}

export default PostController;