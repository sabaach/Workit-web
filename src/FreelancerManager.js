import { createClient } from '@supabase/supabase-js';
import React, { useState, useEffect, useRef } from 'react';
import {
  PlusCircle, User, DollarSign, Calendar, FileText, CheckCircle, XCircle,
  BarChart3, Eye, Edit, Trash2, TrendingUp, Wallet, MessageCircle,
  Send, Users, Search, MoreVertical, Phone, Video, Info, Smile,
  Image, Camera, Mic, ThumbsUp, Globe, Heart, Share, MessageSquare, Home
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import bcrypt from 'bcryptjs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log("Supabase Config:", { supabaseUrl, supabaseAnonKey });

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
  setGlobalPosts,
  addGlobalPost,
  loadUsers,
  loadGlobalPosts
}) => {
  const messagesEndRef = useRef(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  useEffect(() => {
    console.log('🚀 NetworkPanel mounted, forcing initial refresh...');

    const initialRefresh = async () => {
      try {
        if (loadUsers) {
          console.log('🔄 Initial users refresh...');
          await loadUsers();
        }
        if (loadGlobalPosts) {
          console.log('🔄 Initial posts refresh...');
          await loadGlobalPosts();
        }
      } catch (error) {
        console.error('Error in initial refresh:', error);
      }
    };

    initialRefresh();
  }, [loadUsers, loadGlobalPosts]);

  // Auto refresh setiap 30 detik
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing network data...');
      setLastRefresh(Date.now());
      // Trigger parent to refresh data
      loadUsers();
      loadGlobalPosts();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Refresh data ketika component mount atau ketika kembali ke network panel
  useEffect(() => {
    console.log('🔃 Refreshing network panel data...');

    const refreshData = async () => {
      try {
        if (loadUsers) await loadUsers();
        if (loadGlobalPosts) await loadGlobalPosts();
        if (selectedUser && loadMessages) {
          await loadMessages(selectedUser.id);
        }
      } catch (error) {
        console.error('Error refreshing network data:', error);
      }
    };

    refreshData();
  }, [lastRefresh, selectedUser, loadUsers, loadGlobalPosts, loadMessages]);

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
                <div
                  key={message.id}
                  className={`message-bubble max-w-xs lg:max-w-md ${message.sender_id === currentUser.id
                    ? 'ml-auto bg-blue-500 text-white rounded-br-none'
                    : 'mr-auto bg-white text-gray-900 rounded-bl-none shadow-sm'
                    } rounded-2xl px-4 py-3 transition-colors`}
                >
                  <div className="message-content text-sm">
                    {message.content}
                  </div>
                  <div className={`message-time text-xs mt-2 ${message.sender_id === currentUser.id ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                    {new Date(message.created_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
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

const FreelancerManager = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [expenses, setExpenses] = useState(0);
  const [showLogin, setShowLogin] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showProjectDetail, setShowProjectDetail] = useState(null);
  const [editingProject, setEditingProject] = useState(null);

  const [showNetwork, setShowNetwork] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [globalPosts, setGlobalPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const messagesEndRef = useRef(null);

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [projectForm, setProjectForm] = useState({
    clientName: '',
    projectTitle: '',
    features: [{ name: '', price: 0 }],
    hourlyRate: 0,
    estimatedHours: 0,
    deadline: '',
    rateType: 'feature'
  });

  const samplePosts = [
    {
      id: 1,
      user: { name: "Ahmad Freelancer", avatar: "A" },
      content: "Baru saja menyelesaikan project website e-commerce untuk client dari Singapore. Hasilnya memuaskan! 🎉",
      timestamp: "2 jam yang lalu",
      likes: 15,
      comments: 3,
      shares: 1
    },
    {
      id: 2,
      user: { name: "Siti Developer", avatar: "S" },
      content: "Ada yang punya pengalaman menggunakan React Native untuk aplikasi mobile? Butuh saran untuk optimasi performance.",
      timestamp: "5 jam yang lalu",
      likes: 8,
      comments: 7,
      shares: 0
    },
    {
      id: 3,
      user: { name: "Budi Designer", avatar: "B" },
      content: "Share portfolio terbaru saya: budidesigner.dribbble.com. Open for collaboration! ✨",
      timestamp: "1 hari yang lalu",
      likes: 25,
      comments: 5,
      shares: 2
    }
  ];

  // Tambahkan fungsi untuk menyimpan post ke database
  const addGlobalPost = async () => {
    if (!newPost.trim() || !currentUser) return;

    try {
      const postData = {
        user_id: currentUser.id,
        content: newPost.trim(),
        likes: 0,
        comments: 0,
        shares: 0,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('global_posts')
        .insert([postData])
        .select(`
        *,
        user:users(username)
      `)
        .single();

      if (error) throw error;

      // Format post untuk ditampilkan
      const formattedPost = {
        id: data.id,
        user: {
          name: data.user.username,
          avatar: data.user.username.charAt(0).toUpperCase()
        },
        content: data.content,
        timestamp: "Baru saja",
        likes: data.likes,
        comments: data.comments,
        shares: data.shares,
        created_at: data.created_at
      };

      setGlobalPosts(prev => [formattedPost, ...prev]);
      setNewPost('');

    } catch (err) {
      console.error('Error adding post:', err);
      alert('Gagal memposting: ' + err.message);
    }
  };

  // Fungsi untuk load global posts dari database
  const loadGlobalPosts = async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('global_posts')
        .select(`
        *,
        user:users(username)
      `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPosts = data.map(post => ({
        id: post.id,
        user: {
          name: post.user.username,
          avatar: post.user.username.charAt(0).toUpperCase()
        },
        content: post.content,
        timestamp: formatTimeAgo(post.created_at),
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        created_at: post.created_at
      }));

      setGlobalPosts(formattedPosts);
    } catch (err) {
      console.error('Error loading posts:', err);
    }
  };

  // Helper function untuk format waktu
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
  };

  // GANTI fungsi setupRealtimePosts dengan yang ini:
  const setupRealtimePosts = () => {
    if (!currentUser) return;

    console.log('📝 Setting up real-time posts');

    const subscription = supabase
      .channel('public:global_posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'global_posts',
        },
        async (payload) => {
          console.log('🆕 New post received via real-time:', payload);

          // Skip jika post dari user sendiri (karena sudah ditambahkan via addGlobalPost)
          if (payload.new.user_id === currentUser.id) {
            console.log('⏭️ Skipping own post');
            return;
          }

          try {
            // Load user data untuk post baru
            const { data: userData } = await supabase
              .from('users')
              .select('username')
              .eq('id', payload.new.user_id)
              .single();

            if (userData) {
              const newPost = {
                id: payload.new.id,
                user: {
                  name: userData.username,
                  avatar: userData.username.charAt(0).toUpperCase()
                },
                content: payload.new.content,
                timestamp: formatTimeAgo(payload.new.created_at),
                likes: payload.new.likes,
                comments: payload.new.comments,
                shares: payload.new.shares,
                created_at: payload.new.created_at
              };

              console.log('➕ Adding new post to global posts:', newPost);

              // Tambahkan post baru di awal array
              setGlobalPosts(prev => {
                // Cek duplikat
                const exists = prev.some(post => post.id === newPost.id);
                if (!exists) {
                  return [newPost, ...prev];
                }
                return prev;
              });
            }
          } catch (err) {
            console.error('❌ Error processing new post:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'global_posts',
        },
        (payload) => {
          console.log('✏️ Post updated:', payload);
          // Update post jika ada perubahan (likes, comments, dll)
          setGlobalPosts(prev =>
            prev.map(post =>
              post.id === payload.new.id
                ? {
                  ...post,
                  likes: payload.new.likes,
                  comments: payload.new.comments,
                  shares: payload.new.shares
                }
                : post
            )
          );
        }
      )
      .subscribe((status) => {
        console.log('📡 Posts real-time subscription status:', status);

        // Force reload posts setelah subscribe berhasil
        if (status === 'SUBSCRIBED') {
          setTimeout(() => {
            console.log('🔄 Force reloading posts after subscription...');
            loadGlobalPosts();
          }, 1000);
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  };

  // GANTI useEffect utama dengan yang ini:
  // PERBAIKI useEffect utama untuk sequential initialization yang lebih baik
  useEffect(() => {
    if (currentUser) {
      console.log('🚀 Initializing real-time features for user:', currentUser.username);

      let unsubscribeMessages;
      let unsubscribeOnlineUsers;
      let unsubscribePosts;
      let unsubscribeUserUpdates;

      const initializeRealtime = async () => {
        try {
          console.log('📥 Loading initial data...');
          // Load initial data terlebih dahulu
          await loadProjects();
          await loadUsers();
          await loadGlobalPosts();

          console.log('🔧 Setting up real-time subscriptions...');
          // Setup real-time features dengan delay bertahap
          unsubscribeMessages = setupRealtimeMessages();

          // Beri jeda untuk menghindari race condition
          await new Promise(resolve => setTimeout(resolve, 1000));

          unsubscribeOnlineUsers = await setupOnlineUsers();

          await new Promise(resolve => setTimeout(resolve, 1000));

          unsubscribePosts = setupRealtimePosts();

          console.log('✅ All real-time features initialized successfully');

          // Setup periodic refresh
          const periodicRefresh = setInterval(() => {
            console.log('🔄 Periodic data refresh...');
            loadUsers().catch(console.error);
            loadGlobalPosts().catch(console.error);
          }, 45000); // Refresh setiap 45 detik

          return () => {
            clearInterval(periodicRefresh);
          };

        } catch (err) {
          console.error('❌ Error initializing real-time features:', err);

          // Retry dengan exponential backoff
          setTimeout(initializeRealtime, 10000);
        }
      };

      const cleanupPeriodic = initializeRealtime();

      // Cleanup function
      return () => {
        console.log('🧹 Cleaning up all real-time subscriptions');
        if (unsubscribeMessages) unsubscribeMessages();
        if (unsubscribeOnlineUsers) unsubscribeOnlineUsers();
        if (unsubscribePosts) unsubscribePosts();
        if (unsubscribeUserUpdates) unsubscribeUserUpdates();
        if (cleanupPeriodic) cleanupPeriodic();
      };
    }
  }, [currentUser]);

  // Tambahkan heartbeat untuk maintain online status
  // Tambahkan heartbeat untuk maintain online status - DIPERBAIKI
  // GANTI heartbeat useEffect dengan yang ini:
  // PERBAIKI heartbeat untuk lebih reliable
  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;

    const heartbeat = async () => {
      if (!isMounted) return;

      try {
        const { error } = await supabase
          .from('users')
          .update({
            last_seen: new Date().toISOString(),
            is_online: true
          })
          .eq('id', currentUser.id);

        if (error) {
          console.error('❌ Heartbeat update error:', error);
        } else {
          console.log('💓 Heartbeat updated for user:', currentUser.username);
        }
      } catch (err) {
        console.error('❌ Heartbeat failed:', err);
      }
    };

    // Jalankan segera setelah mount
    heartbeat();

    // Setup interval
    const heartbeatInterval = setInterval(heartbeat, 15000); // Every 15 seconds

    return () => {
      isMounted = false;
      clearInterval(heartbeatInterval);

      // Set offline ketika unmount
      if (currentUser) {
        console.log('🚪 Setting user offline on unmount:', currentUser.username);
        supabase
          .from('users')
          .update({
            is_online: false,
            last_seen: new Date().toISOString()
          })
          .eq('id', currentUser.id)
          .then(() => console.log('✅ User set to offline'))
          .catch(err => console.error('❌ Error setting offline:', err));
      }
    };
  }, [currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // GANTI fungsi setupRealtimeMessages dengan yang ini:
  const setupRealtimeMessages = () => {
    if (!currentUser) return;

    console.log('💬 Setting up real-time messages for user:', currentUser.id);

    const subscription = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(receiver_id.eq.${currentUser.id},sender_id.eq.${currentUser.id})`
        },
        async (payload) => {
          console.log('💌 New message received via real-time:', payload);

          // Jika message baru dan belum ada di state, tambahkan
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === payload.new.id);
            if (!exists) {
              console.log('➕ Adding new message to state');
              return [...prev, payload.new];
            }
            return prev;
          });

          // Jika message terkait dengan user yang sedang dipilih, scroll ke bawah
          if (selectedUser &&
            (payload.new.sender_id === selectedUser.id ||
              payload.new.receiver_id === selectedUser.id)) {
            setTimeout(scrollToBottom, 100);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `or(receiver_id.eq.${currentUser.id},sender_id.eq.${currentUser.id})`
        },
        (payload) => {
          console.log('✏️ Message updated:', payload);
          // Update message jika ada perubahan (misalnya status read)
          setMessages(prev =>
            prev.map(msg =>
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            )
          );
        }
      )
      .subscribe((status) => {
        console.log('📡 Messages real-time subscription status:', status);
      });

    return () => {
      subscription.unsubscribe();
    };
  };

  // Setup online users tracking dengan presence channel yang benar
  // GANTI fungsi setupOnlineUsers dengan yang ini:
  // GANTI fungsi setupOnlineUsers dengan yang ini:
  const setupOnlineUsers = async () => {
    if (!currentUser) return;

    try {
      console.log('🟢 Setting up online presence for:', currentUser.username);

      // 1. Set current user sebagai online di database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          is_online: true,
          last_seen: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (updateError) {
        console.error('Error setting online status:', updateError);
      }

      // 2. Create presence channel dengan config yang benar
      const presenceChannel = supabase.channel('online_users_global', {
        config: {
          presence: {
            key: currentUser.id,
          },
          broadcast: { self: true } // Penting: enable self broadcast
        },
      });

      // 3. Subscribe to presence events
      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          console.log('🔄 Presence sync event triggered');
          const state = presenceChannel.presenceState();
          const onlineUserIds = new Set();

          console.log('📊 Current presence state:', state);

          Object.values(state).forEach((presences) => {
            presences.forEach((presence) => {
              onlineUserIds.add(presence.key);
              console.log('   👤 Online user found:', presence.key, presence.username);
            });
          });

          console.log('✅ Final online users count:', onlineUserIds.size);
          setOnlineUsers(onlineUserIds);
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          console.log('🎉 User JOINED presence:', newPresences);
          newPresences.forEach(presence => {
            console.log('   ➕ Adding user to online:', presence.key, presence.username);
            setOnlineUsers(prev => {
              const newSet = new Set(prev);
              newSet.add(presence.key);
              console.log('   📈 Online users after join:', Array.from(newSet));
              return newSet;
            });
          });
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          console.log('👋 User LEFT presence:', leftPresences);
          leftPresences.forEach(presence => {
            console.log('   ➖ Removing user from online:', presence.key);
            setOnlineUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(presence.key);
              console.log('   📉 Online users after leave:', Array.from(newSet));
              return newSet;
            });
          });
        })
        .subscribe(async (status) => {
          console.log('📡 Presence subscription status:', status);

          if (status === 'SUBSCRIBED') {
            console.log('✅ Presence channel subscribed successfully');

            // Track presence dengan data yang lengkap
            const trackData = {
              user_id: currentUser.id,
              username: currentUser.username,
              online_at: new Date().toISOString(),
              avatar: currentUser.username.charAt(0).toUpperCase(),
              // Tambahkan timestamp untuk debugging
              tracked_at: new Date().toISOString()
            };

            console.log('📍 Tracking presence with data:', trackData);

            const trackStatus = await presenceChannel.track(trackData);
            console.log('📍 Presence track status:', trackStatus);

            // Force re-sync setelah 3 detik untuk memastikan data terbaru
            setTimeout(async () => {
              console.log('🔄 Force re-syncing presence data...');
              // Untrack dan track ulang untuk memastikan sync
              await presenceChannel.untrack();
              await presenceChannel.track({
                ...trackData,
                re_synced_at: new Date().toISOString()
              });
            }, 3000);
          }
        });

      return () => {
        console.log('🧹 Cleaning up presence channel for:', currentUser.username);
        presenceChannel.untrack();
        presenceChannel.unsubscribe();
      };

    } catch (err) {
      console.error('❌ Error in setupOnlineUsers:', err);
    }
  };
  // Load semua users (kecuali current user)
  // Load semua users dengan real-time updates - DIPERBAIKI
  // GANTI fungsi loadUsers dengan yang ini:
  // PERBAIKI fungsi loadUsers dengan menambahkan real-time untuk user baru
  const loadUsers = async () => {
    if (!currentUser) return;

    try {
      console.log('👥 Loading users...');

      const { data, error } = await supabase
        .from('users')
        .select('id, username, created_at, is_online, last_seen')
        .neq('id', currentUser.id)
        .order('username');

      if (error) {
        console.error('❌ Error loading users:', error);
        return;
      }

      console.log('✅ Loaded users:', data.length);
      setUsers(data);

      // Update onlineUsers set berdasarkan data dari database juga
      const onlineFromDB = data.filter(user => user.is_online).map(user => user.id);
      console.log('💾 Online users from database:', onlineFromDB);

      setOnlineUsers(prev => {
        const newSet = new Set([...prev, ...onlineFromDB]);
        console.log('🔄 Combined online users:', Array.from(newSet));
        return newSet;
      });

      // Setup real-time untuk user updates - LEBIH SIMPLE
      const userUpdatesChannel = supabase
        .channel('user_updates_global')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen untuk semua event
            schema: 'public',
            table: 'users',
          },
          async (payload) => {
            console.log('🔄 User database update:', payload.eventType, payload.new?.username);

            if (payload.eventType === 'INSERT') {
              // User baru terdaftar - reload users list
              console.log('🆕 New user detected, reloading users list...');
              const { data: freshUsers } = await supabase
                .from('users')
                .select('id, username, created_at, is_online, last_seen')
                .neq('id', currentUser.id)
                .order('username');

              if (freshUsers) {
                setUsers(freshUsers);
                console.log('✅ Users list updated with new user');
              }
            }

            if (payload.eventType === 'UPDATE') {
              // Update status online user
              console.log('🔄 User status update:', payload.new.username, 'online:', payload.new.is_online);

              // Update users list
              setUsers(prev =>
                prev.map(user =>
                  user.id === payload.new.id
                    ? { ...user, ...payload.new }
                    : user
                )
              );

              // Update onlineUsers set
              if (payload.new.is_online) {
                console.log('➕ Adding user to online set:', payload.new.id);
                setOnlineUsers(prev => {
                  const newSet = new Set(prev);
                  newSet.add(payload.new.id);
                  return newSet;
                });
              } else {
                console.log('➖ Removing user from online set:', payload.new.id);
                setOnlineUsers(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(payload.new.id);
                  return newSet;
                });
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 User updates subscription status:', status);
        });

      return () => {
        userUpdatesChannel.unsubscribe();
      };

    } catch (err) {
      console.error('❌ Error in loadUsers:', err);
    }
  };

  // Load messages dengan user tertentu - diperbaiki
  const loadMessages = async (otherUserId) => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      console.log('Loaded messages:', data);
      setMessages(data || []);
    } catch (err) {
      console.error('Error in loadMessages:', err);
    }
  };

  // Kirim message - diperbaiki
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUser) return;

    const tempMessage = newMessage;
    setNewMessage(''); // Clear immediately

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender_id: currentUser.id,
          receiver_id: selectedUser.id,
          content: tempMessage.trim(),
          is_read: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('Message sent:', data);

      // Update messages state
      setMessages(prev => [...prev, data]);

      // Scroll to bottom
      setTimeout(() => {
        scrollToBottom();
      }, 100);

    } catch (err) {
      console.error('Error sending message:', err);
      setNewMessage(tempMessage); // Restore message if failed
      alert('Gagal mengirim pesan: ' + err.message);
    }
  };

  const loadProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading projects:', error);
      return;
    }

    setProjects(data);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // 1. Ambil user dari database
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("username", loginForm.username)
        .single();

      if (error || !user) throw new Error("User tidak ditemukan");

      // 2. Bandingkan password hashed
      const isPasswordValid = await bcrypt.compare(
        loginForm.password,
        user.password
      );

      if (!isPasswordValid) throw new Error("Password salah");

      // 3. Login sukses
      setCurrentUser(user);
      setShowLogin(false);

    } catch (err) {
      alert(`Login gagal: ${err.message}`);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      // 1. Validasi input
      if (registerForm.password !== registerForm.confirmPassword) {
        throw new Error("Password dan konfirmasi tidak cocok");
      }

      // 2. Cek username sudah ada
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('username')
        .eq('username', registerForm.username)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existingUser) throw new Error("Username sudah terdaftar");

      // 3. Hash password
      const hashedPassword = await bcrypt.hash(registerForm.password, 10);

      // 4. Registrasi user
      const { data: newUser, error: registerError } = await supabase
        .from('users')
        .insert([{
          username: registerForm.username,
          password: hashedPassword
        }])
        .select()
        .single();

      if (registerError) throw registerError;

      // Sukses
      setCurrentUser(newUser);
      setShowRegister(false);

    } catch (err) {
      console.error("Detail error:", err); // Lihat di browser console
      alert(`Registrasi gagal: ${err.message || "Silakan coba lagi"}`);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowLogin(true);
    setShowAddProject(false);
    setShowProjectDetail(null);
    setShowNetwork(false);
  };

  const addFeature = () => {
    setProjectForm({
      ...projectForm,
      features: [...projectForm.features, { name: '', price: 0 }]
    });
  };

  const removeFeature = (index) => {
    const newFeatures = projectForm.features.filter((_, i) => i !== index);
    setProjectForm({ ...projectForm, features: newFeatures });
  };

  const updateFeature = (index, field, value) => {
    const newFeatures = [...projectForm.features];
    newFeatures[index][field] = value;
    setProjectForm({ ...projectForm, features: newFeatures });
  };

  const calculateTotal = () => {
    if (projectForm.rateType === 'feature') {
      return (projectForm.features || []).reduce(
        (sum, feature) => sum + (Number(feature.price) || 0),
        0
      );
    } else {
      return (Number(projectForm.hourlyRate) || 0) *
        (Number(projectForm.estimatedHours) || 0);
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();

    try {
      // 1. Validasi form
      if (!projectForm.clientName || !projectForm.projectTitle) {
        throw new Error("Nama client dan judul proyek wajib diisi");
      }

      // 2. Hitung total amount
      const totalAmount = calculateTotal();

      // 3. Siapkan data untuk Supabase
      const projectData = {
        user_id: currentUser.id,
        client_name: projectForm.clientName.trim(),
        project_title: projectForm.projectTitle.trim(),
        features: projectForm.features.map(f => ({
          name: f.name.trim(),
          price: Number(f.price)
        })),
        hourly_rate: projectForm.rateType === 'hourly' ?
          Number(projectForm.hourlyRate) :
          null, // atau 0 jika kolom tidak nullable
        estimated_hours: projectForm.rateType === 'hourly' ?
          Number(projectForm.estimatedHours) :
          null,
        deadline: projectForm.deadline || null,
        rate_type: projectForm.rateType,
        total_amount: calculateTotal(),
        is_paid: false
      };

      console.log("Mengirim data:", projectData); // Debugging

      // 4. Simpan ke database
      const { data: savedProject, error } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single();

      if (error) {
        console.error("Error dari Supabase:", error);
        throw new Error(error.message || "Gagal menyimpan ke database");
      }

      // 5. Update state dan UI
      setProjects(prev => [savedProject, ...prev]);

      // 6. Reset form dan tutup modal
      setProjectForm({
        clientName: '',
        projectTitle: '',
        features: [{ name: '', price: 0 }],
        hourlyRate: 0,
        estimatedHours: 0,
        deadline: '',
        rateType: 'feature'
      });

      setShowAddProject(false);

      // 7. Beri feedback ke user
      alert("Proyek berhasil disimpan!");

      // 8. Optional: Force reload data dari server
      const { data: freshProjects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (freshProjects) setProjects(freshProjects);

    } catch (err) {
      console.error("Error menyimpan proyek:", err);
      alert(`Gagal menyimpan proyek: ${err.message}`);
    }
  };

  const togglePaymentStatus = async (projectId) => {
    try {
      const project = projects.find(p => p.id === projectId);
      const { data, error } = await supabase
        .from('projects')
        .update({ is_paid: !project.is_paid })
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;

      setProjects(prevProjects =>
        prevProjects.map(p =>
          p.id === projectId ? data : p
        )
      );

      if (showProjectDetail && showProjectDetail.id === projectId) {
        setShowProjectDetail(data);
      }
    } catch (err) {
      console.error('Error updating payment status:', err);
      alert('Terjadi kesalahan saat mengupdate status pembayaran');
    }
  };

  const deleteProject = async (projectId) => {
    if (!window.confirm('Yakin ingin menghapus proyek ini?')) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(projects.filter(p => p.id !== projectId));
      setShowProjectDetail(null);
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Terjadi kesalahan saat menghapus proyek');
    }
  };

  const editProject = (project) => {
    setProjectForm({
      clientName: project.client_name,
      projectTitle: project.project_title,
      features: project.features,
      hourlyRate: project.hourly_rate,
      estimatedHours: project.estimated_hours,
      deadline: project.deadline,
      rateType: project.rate_type
    });
    setEditingProject(project);
    setShowAddProject(true);
    setShowProjectDetail(null);
  };

  const generateProjectPDF = async (project) => {
    try {
      // Buat elemen HTML untuk invoice
      const invoiceElement = document.createElement('div');
      invoiceElement.style.padding = '20px';
      invoiceElement.style.fontFamily = 'Arial, sans-serif';
      invoiceElement.style.maxWidth = '800px';

      invoiceElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #3B82F6; margin-bottom: 5px;">WorkIt! Invoice</h1>
          <p style="color: #6B7280;">Freelance Project Management</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <h3 style="margin-bottom: 10px; color: #374151;">Project Details</h3>
            <p><strong>Client:</strong> ${project.client_name}</p>
            <p><strong>Project:</strong> ${project.project_title}</p>
            <p><strong>Deadline:</strong> ${new Date(project.deadline).toLocaleDateString('id-ID')}</p>
            <p><strong>Created:</strong> ${new Date(project.created_at).toLocaleDateString('id-ID')}</p>
          </div>
          
          <div style="text-align: right;">
            <h3 style="margin-bottom: 10px; color: #374151;">Payment Status</h3>
            <p style="background-color: ${project.is_paid ? '#10B981' : '#F59E0B'}; 
                      color: white; 
                      padding: 5px 10px; 
                      border-radius: 20px;
                      display: inline-block;">
              ${project.is_paid ? 'PAID' : 'PENDING'}
            </p>
            <p style="margin-top: 10px; font-size: 18px; font-weight: bold;">
              Total: Rp ${project.total_amount.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #374151; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px;">
            ${project.rate_type === 'feature' ? 'Project Features' : 'Work Details'}
          </h3>
          
          ${project.rate_type === 'feature' ? `
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <thead>
                <tr style="background-color: #F9FAFB;">
                  <th style="text-align: left; padding: 12px; border-bottom: 1px solid #E5E7EB;">Feature</th>
                  <th style="text-align: right; padding: 12px; border-bottom: 1px solid #E5E7EB;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${project.features.map((feature, index) => `
                  <tr key="${index}">
                    <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">${feature.name}</td>
                    <td style="text-align: right; padding: 12px; border-bottom: 1px solid #E5E7EB;">
                      Rp ${feature.price.toLocaleString('id-ID')}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td style="padding: 12px; text-align: right; font-weight: bold;" colspan="2">
                    Total: Rp ${project.total_amount.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tfoot>
            </table>
          ` : `
            <div style="margin-top: 15px;">
              <p><strong>Hourly Rate:</strong> Rp ${project.hourly_rate.toLocaleString('id-ID')}</p>
              <p><strong>Estimated Hours:</strong> ${project.estimated_hours} hours</p>
              <p><strong>Total Amount:</strong> Rp ${project.total_amount.toLocaleString('id-ID')}</p>
            </div>
          `}
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center; color: #6B7280;">
          <p>Thank you for your business!</p>
          <p>Generated on ${new Date().toLocaleDateString('id-ID')}</p>
        </div>
      `;

      // Sembunyikan sementara dari view
      invoiceElement.style.position = 'absolute';
      invoiceElement.style.left = '-9999px';
      document.body.appendChild(invoiceElement);

      // Konversi ke canvas lalu ke PDF
      const canvas = await html2canvas(invoiceElement);
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / imgHeight;
      const pdfImgWidth = pageWidth;
      const pdfImgHeight = pageWidth / ratio;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfImgWidth, pdfImgHeight);

      // Hapus elemen sementara
      document.body.removeChild(invoiceElement);

      // Simpan PDF
      pdf.save(`Invoice-${project.client_name}-${project.project_title}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal menghasilkan PDF. Silakan coba lagi.');
    }
  };

  const userProjects = projects.filter(p => p.user_id === currentUser?.id);
  const totalEarnings = userProjects.filter(p => p.is_paid).reduce((sum, p) => sum + p.total_amount, 0);
  const pendingEarnings = userProjects.filter(p => !p.is_paid).reduce((sum, p) => sum + p.total_amount, 0);
  const remainingBalance = totalEarnings - expenses;

  const chartData = userProjects.map((project) => ({
    name: (project.project_title || '').substring(0, 15) +
      ((project.project_title || '').length > 15 ? '...' : ''),
    pendapatan: project.is_paid ? project.total_amount : 0,
    pending: !project.is_paid ? project.total_amount : 0,
    total: project.total_amount
  }));

  const monthlyData = [
    { month: 'Jan', pendapatan: 0 },
    { month: 'Feb', pendapatan: 0 },
    { month: 'Mar', pendapatan: 0 },
    { month: 'Apr', pendapatan: 0 },
    { month: 'May', pendapatan: 0 },
    { month: 'Jun', pendapatan: totalEarnings * 0.3 },
    { month: 'Jul', pendapatan: totalEarnings * 0.7 }
  ];

  // Komponen Message Bubble yang terpisah
  const MessageBubble = ({ message, currentUser }) => {
    const isOwnMessage = message.sender_id === currentUser.id;

    return (
      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${isOwnMessage
          ? 'bg-blue-500 text-white rounded-br-none'
          : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
          }`}>
          <p className="text-sm">{message.content}</p>
          <div className={`flex items-center justify-end space-x-1 mt-1 ${isOwnMessage ? 'text-blue-200' : 'text-gray-400'
            }`}>
            <span className="text-xs">
              {new Date(message.created_at).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            {isOwnMessage && (
              <CheckCircle className="w-3 h-3" />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Jika sedang menampilkan network panel
  if (showNetwork) {
    return (
      <NetworkPanel
        currentUser={currentUser}
        users={users}
        selectedUser={selectedUser}
        messages={messages}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        onlineUsers={onlineUsers}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        globalPosts={globalPosts}
        newPost={newPost}
        setNewPost={setNewPost}
        setSelectedUser={setSelectedUser}
        loadMessages={loadMessages}
        sendMessage={sendMessage}
        setShowNetwork={setShowNetwork}
        setGlobalPosts={setGlobalPosts}
        addGlobalPost={addGlobalPost}
        loadUsers={loadUsers}
        loadGlobalPosts={loadGlobalPosts}
      />
    );
  }

  // Login/Register Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">WorkIt!</h1>
            <p className="text-gray-600">Kelola proyek freelance Anda dengan mudah</p>
          </div>

          {showLogin && !showRegister ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <h2 className="text-2xl font-semibold text-center text-gray-800">Masuk</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
              >
                Masuk
              </button>
              <p className="text-center text-sm text-gray-600">
                Belum punya akun?{' '}
                <button
                  type="button"
                  onClick={() => setShowRegister(true)}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Daftar di sini
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              <h2 className="text-2xl font-semibold text-center text-gray-800">Daftar</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password</label>
                <input
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
              >
                Daftar
              </button>
              <p className="text-center text-sm text-gray-600">
                Sudah punya akun?{' '}
                <button
                  type="button"
                  onClick={() => setShowRegister(false)}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Masuk di sini
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Add Project Modal
  if (showAddProject) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">
                {editingProject ? 'Edit Proyek' : 'Tambah Proyek Baru'}
              </h2>
              <button
                onClick={() => {
                  setShowAddProject(false);
                  setEditingProject(null);
                  setProjectForm({
                    clientName: '',
                    projectTitle: '',
                    features: [{ name: '', price: 0 }],
                    hourlyRate: 0,
                    estimatedHours: 0,
                    deadline: '',
                    rateType: 'feature'
                  });
                }}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProject} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama Client</label>
                  <input
                    type="text"
                    value={projectForm.clientName}
                    onChange={(e) => setProjectForm({ ...projectForm, clientName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Judul Proyek</label>
                  <input
                    type="text"
                    value={projectForm.projectTitle}
                    onChange={(e) => setProjectForm({ ...projectForm, projectTitle: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                <input
                  type="date"
                  value={projectForm.deadline}
                  onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Tipe Penghitungan</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="feature"
                      checked={projectForm.rateType === 'feature'}
                      onChange={(e) => setProjectForm({ ...projectForm, rateType: e.target.value })}
                      className="mr-2"
                    />
                    Per Fitur
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="hourly"
                      checked={projectForm.rateType === 'hourly'}
                      onChange={(e) => setProjectForm({ ...projectForm, rateType: e.target.value })}
                      className="mr-2"
                    />
                    Per Jam
                  </label>
                </div>
              </div>

              {projectForm.rateType === 'feature' ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">Fitur Proyek</label>
                    <button
                      type="button"
                      onClick={addFeature}
                      className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <PlusCircle className="w-5 h-5 mr-1" />
                      Tambah Fitur
                    </button>
                  </div>
                  {projectForm.features.map((feature, index) => (
                    <div key={index} className="flex gap-4 mb-4 items-end">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Nama fitur"
                          value={feature.name}
                          onChange={(e) => updateFeature(index, 'name', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          required
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          placeholder="Harga"
                          value={feature.price}
                          onChange={(e) => updateFeature(index, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      {projectForm.features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rate per Jam (Rp)</label>
                    <input
                      type="number"
                      value={projectForm.hourlyRate}
                      onChange={(e) => setProjectForm({ ...projectForm, hourlyRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimasi Jam</label>
                    <input
                      type="number"
                      value={projectForm.estimatedHours}
                      onChange={(e) => setProjectForm({ ...projectForm, estimatedHours: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      min="0"
                      step="0.1"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-lg font-semibold text-gray-800">
                  Total Estimasi: Rp {calculateTotal().toLocaleString('id-ID')}
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProject(false);
                    setEditingProject(null);
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingProject ? 'Update Proyek' : 'Simpan Proyek'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Project Detail Modal
  // Project Detail Modal
  if (showProjectDetail) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">Detail Proyek</h2>
              <button
                onClick={() => setShowProjectDetail(null)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center"
              >
                x
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Informasi Proyek</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Client:</span> {showProjectDetail.client_name}</p>
                    <p><span className="font-medium">Judul:</span> {showProjectDetail.project_title}</p>
                    <p><span className="font-medium">Deadline:</span> {new Date(showProjectDetail.deadline).toLocaleDateString('id-ID')}</p>
                    <p><span className="font-medium">Dibuat:</span> {new Date(showProjectDetail.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Keuangan</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Total:</span> Rp {(showProjectDetail?.total_amount || 0).toLocaleString('id-ID')}</p>
                    <p><span className="font-medium">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-sm ${showProjectDetail.is_paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {showProjectDetail.is_paid ? 'Sudah Dibayar' : 'Belum Dibayar'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {showProjectDetail.rate_type === 'feature' ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Daftar Fitur</h3>
                  <div className="space-y-2">
                    {showProjectDetail.features.map((feature, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span>{feature.name}</span>
                        <span className="font-medium">Rp {feature.price.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Detail Jam Kerja</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p><span className="font-medium">Rate per Jam:</span> Rp {showProjectDetail.hourly_rate.toLocaleString('id-ID')}</p>
                    <p><span className="font-medium">Estimasi Jam:</span> {showProjectDetail.estimated_hours} jam</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => editProject(showProjectDetail)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => togglePaymentStatus(showProjectDetail.id)}
                  className={`flex items-center px-4 py-2 rounded-lg ${showProjectDetail.is_paid
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                >
                  {showProjectDetail.is_paid ? <XCircle className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  {showProjectDetail.is_paid ? 'Tandai Belum Dibayar' : 'Tandai Sudah Dibayar'}
                </button>
                <button
                  onClick={() => generateProjectPDF(showProjectDetail)}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Save to PDF
                </button>
                <button
                  onClick={() => deleteProject(showProjectDetail.id)}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">WorkIt!</h1>
              <div className="flex items-center text-gray-600">
                <User className="w-5 h-5 mr-2" />
                <span>Selamat datang, {currentUser?.username}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowNetwork(true)}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition duration-200 shadow-sm"
              >
                <Globe className="w-5 h-5 mr-2" />
                Forum Network
              </button>
              <button
                onClick={() => setShowAddProject(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Tambah Proyek
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Pendapatan</p>
                <p className="text-2xl font-bold text-gray-900">Rp {totalEarnings.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Menunggu Pembayaran</p>
                <p className="text-2xl font-bold text-gray-900">Rp {pendingEarnings.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sisa Keuangan</p>
                <p className={`text-2xl font-bold ${remainingBalance >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                  Rp {remainingBalance.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Proyek</p>
                <p className="text-2xl font-bold text-gray-900">{userProjects.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Trend Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <TrendingUp className="w-6 h-6 text-gray-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Tren Pendapatan Bulanan</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']} />
                <Line type="monotone" dataKey="pendapatan" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Project Status Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <BarChart3 className="w-6 h-6 text-gray-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Status Pembayaran Proyek</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, '']} />
                <Bar dataKey="pendapatan" stackId="a" fill="#10B981" name="Sudah Dibayar" />
                <Bar dataKey="pending" stackId="a" fill="#F59E0B" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Manajemen Pengeluaran</h2>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Pengeluaran/Biaya Operasional:</label>
              <input
                type="number"
                value={expenses}
                onChange={(e) => setExpenses(parseFloat(e.target.value) || 0)}
                className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0"
                min="0"
                step="1000"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border">
              <p className="text-sm text-green-600 font-medium">Total Pendapatan</p>
              <p className="text-xl font-bold text-green-800">Rp {totalEarnings.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border">
              <p className="text-sm text-red-600 font-medium">Total Pengeluaran</p>
              <p className="text-xl font-bold text-red-800">Rp {expenses.toLocaleString('id-ID')}</p>
            </div>
            <div className={`p-4 rounded-lg border ${remainingBalance >= 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
              <p className={`text-sm font-medium ${remainingBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                Sisa Keuangan
              </p>
              <p className={`text-xl font-bold ${remainingBalance >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                Rp {remainingBalance.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        {/* Projects List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Daftar Proyek</h2>
          </div>

          {userProjects.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada proyek</h3>
              <p className="text-gray-600 mb-6">Mulai dengan menambahkan proyek pertama Anda</p>
              <button
                onClick={() => setShowAddProject(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Tambah Proyek
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {userProjects.map((project) => (
                <div key={project.id} className="p-6 hover:bg-gray-50 transition duration-150">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{project.project_title}</h3>
                          <p className="text-sm text-gray-600">Client: {project.client_name}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${project.is_paid
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {project.is_paid ? 'Paid' : 'Unpaid'}
                          </span>
                          <span className="text-xs text-gray-500">
                            Deadline: {new Date(project.deadline).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          Rp {(project.total_amount || 0).toLocaleString('id-ID')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {project.rateType === 'feature'
                            ? `${project.features.length} fitur`
                            : `${project.estimated_hours} jam`
                          }
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowProjectDetail(project)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition duration-150"
                          title="Lihat Detail"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => editProject(project)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition duration-150"
                          title="Edit Proyek"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => togglePaymentStatus(project.id)}
                          className={`p-2 transition duration-150 ${project.isPaid
                            ? 'text-green-600 hover:text-green-700'
                            : 'text-gray-400 hover:text-green-600'
                            }`}
                          title={project.isPaid ? 'Tandai Belum Dibayar' : 'Tandai Sudah Dibayar'}
                        >
                          {project.isPaid ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition duration-150"
                          title="Hapus Proyek"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FreelancerManager;