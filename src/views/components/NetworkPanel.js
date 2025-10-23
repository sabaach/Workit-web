import React, { useEffect, useRef } from 'react';
import {
  MessageCircle,
  Send,
  Search,
  MoreVertical,
  Video,
  Home,
  ThumbsUp,
  MessageSquare,
  Share
} from 'lucide-react';

const NetworkPanel = ({
  currentUser,
  users,
  selectedUser,
  messages,
  newMessage,
  setNewMessage,
  onlineUsers,
  searchTerm,
  setSearchTerm,
  globalPosts,
  newPost,
  setNewPost,
  setSelectedUser,
  loadMessages,
  sendMessage,
  setShowNetwork,
  addGlobalPost,
  loadUsers,
  loadGlobalPosts
}) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Filter users berdasarkan search
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    await loadMessages(user.id);
  };

  const handleSendMessage = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const handleAddPost = (e) => {
    if (e.key === 'Enter') {
      addGlobalPost();
    }
  };

  const MessageBubble = ({ message, currentUser }) => {
    const isOwnMessage = message.sender_id === currentUser.id;

    return (
      <div
        className={`message-bubble max-w-xs lg:max-w-md ${isOwnMessage
          ? 'ml-auto bg-blue-500 text-white rounded-br-none'
          : 'mr-auto bg-white text-gray-900 rounded-bl-none shadow-sm'
          } rounded-2xl px-4 py-3 transition-colors`}
      >
        <div className="message-content text-sm">
          {message.content}
        </div>
        <div className={`message-time text-xs mt-2 ${isOwnMessage ? 'text-blue-200' : 'text-gray-500'
          }`}>
          {new Date(message.created_at).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="network-container min-h-screen bg-gray-100 flex">
      {/* Sidebar Kiri - Menu Navigasi */}
      <div className="left-sidebar w-80 bg-white border-r border-gray-200">
        <div className="p-6">
          <div className="user-profile-section mb-8">
            <div className="user-profile-card flex items-center space-x-4">
              <div className="user-avatar large w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {currentUser?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <h3 className="user-name font-semibold text-gray-900">{currentUser?.username}</h3>
                <span className="online-status text-green-600 text-sm">Online</span>
              </div>
            </div>
          </div>

          <div className="navigation-section mb-8">
            <h4 className="section-header text-gray-500 text-sm font-medium mb-4">Menu</h4>
            <div className="nav-items space-y-2">
              <button className="nav-item active w-full flex items-center space-x-3 p-3 rounded-lg bg-blue-50 text-blue-600 transition-colors">
                <MessageCircle className="nav-icon w-5 h-5" />
                <span className="text-sm">Perasaan/Aktivitas</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Area Tengah - Forum Global */}
      <div className="main-content flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6">
          <div className="main-header mb-6">
            <h2 className="forum-title text-2xl font-bold text-gray-900 mb-2">Forum Global</h2>
            <p className="forum-subtitle text-gray-600">Diskusi terbuka untuk semua anggota</p>
          </div>

          <div className="feed-container space-y-6">
            {/* Create Post */}
            <div className="create-post-card bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="create-post-header flex items-center space-x-4 mb-4">
                <div className="user-avatar medium w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {currentUser?.username?.charAt(0).toUpperCase()}
                </div>
                <input
                  type="text"
                  placeholder="Apa yang Anda pikirkan?"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  onKeyPress={handleAddPost}
                  className="post-input flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            {/* Posts Feed */}
            <div className="posts-feed space-y-6">
              {globalPosts.map((post) => (
                <div key={post.id} className="post-card bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="post-header flex justify-between items-start mb-4">
                    <div className="post-author flex items-center space-x-3">
                      <div className="user-avatar medium w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {post.user.avatar}
                      </div>
                      <div className="author-info">
                        <h3 className="author-name font-semibold text-gray-900">{post.user.name}</h3>
                        <p className="post-time text-gray-500 text-sm">{post.timestamp}</p>
                      </div>
                    </div>
                    <button className="post-menu text-gray-400 hover:text-gray-600 transition-colors">
                      <MoreVertical className="menu-icon w-5 h-5" />
                    </button>
                  </div>

                  <div className="post-content mb-4">
                    <p className="post-text text-gray-800 leading-relaxed">{post.content}</p>
                  </div>

                  <div className="post-stats mb-4">
                    <div className="stats-info flex space-x-4 text-gray-500 text-sm">
                      <span className="stat-item">{post.likes} suka</span>
                      <span className="stat-item">{post.comments} komentar</span>
                      <span className="stat-item">{post.shares} bagikan</span>
                    </div>
                  </div>

                  <div className="post-actions flex border-t border-gray-200 pt-4">
                    <button className="post-action like flex-1 flex items-center justify-center space-x-2 text-gray-600 hover:text-blue-600 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                      <ThumbsUp className="action-icon w-5 h-5" />
                      <span className="text-sm">Suka</span>
                    </button>
                    <button className="post-action comment flex-1 flex items-center justify-center space-x-2 text-gray-600 hover:text-blue-600 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                      <MessageSquare className="action-icon w-5 h-5" />
                      <span className="text-sm">Komentar</span>
                    </button>
                    <button className="post-action share flex-1 flex items-center justify-center space-x-2 text-gray-600 hover:text-blue-600 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                      <Share className="action-icon w-5 h-5" />
                      <span className="text-sm">Bagikan</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Kanan - Chat */}
      <div className="right-sidebar w-96 bg-white border-l border-gray-200 flex flex-col">
        <div className="chat-header border-b border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="chat-title font-semibold text-gray-900 text-lg">Obrolan</h3>
              <div className="online-indicator flex items-center space-x-2 mt-1">
                <div className="online-dot w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="online-count text-gray-500 text-sm">
                  {Array.from(onlineUsers).length} user online
                </span>
              </div>
              <div className="total-users text-xs text-gray-400 mt-1">
                Total: {users.length + 1} users terdaftar
              </div>
            </div>

            <div className="chat-actions flex space-x-1">
              <button className="chat-action-btn p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <Video className="chat-action-icon w-5 h-5" />
              </button>
              <button
                onClick={() => setShowNetwork(false)}
                className="chat-action-btn p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Home className="chat-action-icon w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="search-section border-b border-gray-200 p-4">
          <div className="search-container relative">
            <Search className="search-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="    Cari percakapan"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        <div className="contacts-list flex-1 overflow-y-auto">
          {filteredUsers.map(user => (
            <div
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className={`contact-item p-3 border-b border-gray-100 cursor-pointer transition-colors ${selectedUser?.id === user.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}
            >
              <div className="contact-info flex items-center space-x-3">
                <div className="contact-avatar-container relative">
                  <div className="user-avatar small w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  {onlineUsers.has(user.id) && (
                    <div className="online-badge absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="contact-details flex-1">
                  <h4 className="contact-name font-medium text-gray-900 text-sm">{user.username}</h4>
                  <p className="contact-status text-gray-500 text-xs">
                    {onlineUsers.has(user.id) ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Window */}
        {selectedUser && (
          <div className="chat-window absolute right-0 top-0 bottom-0 w-96 bg-white border-l border-gray-200 shadow-lg flex flex-col">
            <div className="chat-window-header border-b border-gray-200 p-4 bg-white">
              <div className="flex items-center justify-between">
                <div className="chat-user-info flex items-center space-x-3">
                  <div className="user-avatar small w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="chat-user-details">
                    <h4 className="chat-user-name font-semibold text-gray-900 text-sm">{selectedUser.username}</h4>
                    <p className="chat-user-status text-gray-500 text-xs">
                      {onlineUsers.has(selectedUser.id) ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="close-chat text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="messages-container flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  currentUser={currentUser}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input-section border-t border-gray-200 p-4 bg-white">
              <div className="message-input-container flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleSendMessage}
                  placeholder="Ketik pesan..."
                  className="message-input flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className={`send-button p-3 rounded-lg transition-colors ${newMessage.trim()
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  <Send className="send-icon w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkPanel;