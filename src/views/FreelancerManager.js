// views/FreelancerManager.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import AuthController from '../controllers/AuthController';
import ProjectController from '../controllers/ProjectController';
import MessageController from '../controllers/MessageController';
import PostController from '../controllers/PostController';
import UserModel from '../models/UserModel';
import { supabase } from '../services/supabaseClient';

import LoginView from './components/LoginView';
import Dashboard from './components/Dashboard';
import NetworkPanel from './components/NetworkPanel';
import ProjectForm from './components/ProjectForm';
import ProjectDetail from './components/ProjectDetail';

const FreelancerManager = () => {
  const [currentView, setCurrentView] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [globalPosts, setGlobalPosts] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [newPost, setNewPost] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expenses, setExpenses] = useState(0);
  const [editingProject, setEditingProject] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [userLikes, setUserLikes] = useState(new Set());
  const [postComments, setPostComments] = useState({}); // { postId: [comments] }
  const [expandedComments, setExpandedComments] = useState({}); // { postId: boolean }
  const messagesEndRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);

  const [projectForm, setProjectForm] = useState({
    clientName: '',
    projectTitle: '',
    features: [{ name: '', price: 0 }],
    hourlyRate: 0,
    estimatedHours: 0,
    deadline: '',
    rateType: 'feature'
  });

  // Format time ago helper
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
  };

  // Fungsi untuk load comments untuk sebuah post
  // PERBAIKI: wrap loadComments dengan useCallback
  const loadComments = useCallback(async (postId) => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
        *,
        user:users(username)
      `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedComments = data.map(comment => ({
        id: comment.id,
        user: {
          name: comment.user.username,
          avatar: comment.user.username.charAt(0).toUpperCase()
        },
        content: comment.content,
        timestamp: formatTimeAgo(comment.created_at),
        created_at: comment.created_at
      }));

      setPostComments(prev => ({
        ...prev,
        [postId]: formattedComments
      }));

    } catch (err) {
      console.error('Error loading comments:', err);
    }
  }, [currentUser]); // Tambahkan dependencies

  // Fungsi untuk add comment
  const addComment = async (postId, content) => {
    if (!currentUser || !content.trim()) return;

    try {
      // 1. Insert comment ke database
      const { data: newComment, error: insertError } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: currentUser.id,
          content: content.trim()
        })
        .select(`
        *,
        user:users(username)
      `)
        .single();

      if (insertError) throw insertError;

      // 2. PERBAIKI: Update comments count di global_posts - CARA YANG BENAR
      // Pertama, ambil current comments_count
      const { data: currentPost, error: fetchError } = await supabase
        .from('global_posts')
        .select('comments_count')
        .eq('id', postId)
        .single();

      if (fetchError) throw fetchError;

      // Kemudian update dengan nilai yang di-increment
      const { error: updateError } = await supabase
        .from('global_posts')
        .update({
          comments_count: (currentPost.comments_count || 0) + 1
        })
        .eq('id', postId);

      if (updateError) throw updateError;

      // 3. Format new comment untuk UI
      const formattedComment = {
        id: newComment.id,
        user: {
          name: newComment.user.username,
          avatar: newComment.user.username.charAt(0).toUpperCase()
        },
        content: newComment.content,
        timestamp: formatTimeAgo(newComment.created_at),
        created_at: newComment.created_at
      };

      // 4. Update UI state
      setPostComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), formattedComment]
      }));

      // 5. Update globalPosts untuk comments count
      setGlobalPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? {
              ...post,
              comments: (post.comments || 0) + 1
            }
            : post
        )
      );

      console.log('✅ Comment added successfully');

    } catch (err) {
      console.error('❌ Error adding comment:', err);
      alert('Gagal menambahkan komentar: ' + err.message);
    }
  };

  // Fungsi untuk toggle expanded comments
  const toggleComments = async (postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));

    // Load comments jika belum diload
    if (!postComments[postId]) {
      await loadComments(postId);
    }
  };

  // Data loading functions
  const loadProjects = useCallback(async () => {
    if (!currentUser) return;
    try {
      const projectsData = await ProjectController.loadProjects(currentUser.id);
      setProjects(projectsData);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  }, [currentUser]);

  const loadUsers = useCallback(async () => {
    if (!currentUser) return;
    try {
      const usersData = await UserModel.getAllUsers(currentUser.id);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }, [currentUser]);

  // PERBAIKI: toggleLike function di FreelancerManager.js
  // PERBAIKI: toggleLike function dengan error handling yang proper
  // PERBAIKI: toggleLike tanpa memanggil loadGlobalPosts setelahnya
  const toggleLike = async (postId) => {
    if (!currentUser) return;

    const currentPost = globalPosts.find(p => p.id === postId);
    const isCurrentlyLiked = userLikes.has(postId);
    const currentLikes = currentPost?.likes || 0;

    console.log('🔄 toggleLike started:', { postId, currentLikes, isCurrentlyLiked });

    try {
      // 1. Hitung new likes count
      const newLikesCount = isCurrentlyLiked ?
        Math.max(currentLikes - 1, 0) :
        currentLikes + 1;

      const newLikeStatus = !isCurrentlyLiked;

      // 2. Update UI immediately - OPTIMISTIC UPDATE
      console.log('🎯 Updating UI immediately:', { newLikesCount, newLikeStatus });

      setGlobalPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? {
              ...post,
              likes: newLikesCount,
              user_has_liked: newLikeStatus
            }
            : post
        )
      );

      // Update userLikes state
      setUserLikes(prev => {
        const newSet = new Set(prev);
        if (newLikeStatus) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });

      // 3. Update database - tapi JANGAN panggil loadGlobalPosts setelah ini
      if (isCurrentlyLiked) {
        // UNLIKE
        console.log('🗑️ Removing like from database...');
        const { error: deleteError } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id);

        if (deleteError) throw deleteError;

      } else {
        // LIKE
        console.log('💖 Adding like to database...');
        const { error: insertError } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: currentUser.id
          });

        if (insertError) throw insertError;
      }

      // 4. Update likes count di global_posts
      console.log('📊 Updating likes count in database...');
      const { error: updateError } = await supabase
        .from('global_posts')
        .update({
          likes: newLikesCount
        })
        .eq('id', postId);

      if (updateError) {
        console.error('❌ Error updating likes count:', updateError);
        // Jangan throw error, karena like action sudah berhasil
      }

      console.log('✅ toggleLike completed successfully');

    } catch (err) {
      console.error('❌ Error in toggleLike:', err);

      // ROLLBACK UI hanya jika ada error
      console.log('🔄 Rolling back UI due to error');
      setGlobalPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? {
              ...post,
              likes: currentLikes,
              user_has_liked: isCurrentlyLiked
            }
            : post
        )
      );

      setUserLikes(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });

      alert('Gagal mengupdate like: ' + err.message);
    }
  };

  // PERBAIKI: Fungsi untuk load user likes
  const loadUserLikes = useCallback(async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', currentUser.id);

      if (error) throw error;

      const likedPostIds = new Set(data.map(like => like.post_id));
      setUserLikes(likedPostIds);
      console.log('✅ Loaded user likes:', Array.from(likedPostIds));

    } catch (err) {
      console.error('❌ Error loading user likes:', err);
    }
  }, [currentUser]);

  const isPostLiked = (postId) => {
    return userLikes.has(postId);
  };

  // PERBAIKI: loadGlobalPosts function
  // PERBAIKI: wrap loadGlobalPosts dengan useCallback
  const loadGlobalPosts = useCallback(async () => {
    if (!currentUser) return;

    try {
      console.log('🔄 Loading posts via RPC...');

      const { data, error } = await supabase
        .rpc('get_posts_with_likes', {
          current_user_id: currentUser.id
        });

      if (error) {
        console.error('❌ RPC error:', error);
        return;
      }

      console.log('✅ RPC result:', data);

      // Format data dari RPC
      const formattedPosts = data.map(post => ({
        id: post.id,
        user: {
          name: post.username,
          avatar: post.username.charAt(0).toUpperCase()
        },
        content: post.content,
        timestamp: formatTimeAgo(post.created_at),
        likes: post.likes_count || 0,
        comments: post.comments || 0,
        shares: post.shares || 0,
        created_at: post.created_at,
        user_has_liked: post.user_has_liked || false
      }));

      setGlobalPosts(formattedPosts);
      setUserLikes(new Set(data.filter(p => p.user_has_liked).map(p => p.id)));

    } catch (err) {
      console.error('❌ RPC load error:', err);
    }
  }, [currentUser]); // Tambahkan dependencies

  const loadMessages = useCallback(async (otherUserId) => {
    if (!currentUser) return;
    try {
      const messagesData = await MessageController.loadMessages(currentUser.id, otherUserId);
      setMessages(messagesData);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [currentUser]);

  const loadInitialData = useCallback(async () => {
    await loadProjects();
    await loadUsers();
    await loadGlobalPosts();
    await loadUserLikes();
  }, [loadProjects, loadUsers, loadGlobalPosts, loadUserLikes]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Real-time subscriptions
  // PERBAIKI setupRealtimeSubscriptions dengan dependencies yang benar
  const setupRealtimeSubscriptions = useCallback(() => {
    let unsubscribeMessages;
    let unsubscribePosts;
    let unsubscribeLikes;
    let unsubscribePostUpdates;
    let unsubscribeComments;

    if (currentUser) {
      // Setup real-time messaging
      unsubscribeMessages = MessageController.setupRealtimeMessaging(
        currentUser.id,
        (event, payload) => {
          if (event === 'INSERT') {
            setMessages(prev => {
              const exists = prev.some(msg => msg.id === payload.new.id);
              if (!exists) {
                console.log('➕ Adding new message to state');
                return [...prev, payload.new];
              }
              return prev;
            });

            if (selectedUser &&
              (payload.new.sender_id === selectedUser.id ||
                payload.new.receiver_id === selectedUser.id)) {
              setTimeout(scrollToBottom, 100);
            }
          }
        }
      );

      // Setup real-time posts
      unsubscribePosts = PostController.setupRealtimePosts(
        async (event, payload) => {
          if (event === 'INSERT' && payload.new.user_id !== currentUser.id) {
            // Handle new posts
            try {
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
                  likes: payload.new.likes || 0,
                  comments: payload.new.comments || 0,
                  shares: payload.new.shares || 0,
                  created_at: payload.new.created_at,
                  user_has_liked: false // Default untuk post baru
                };

                setGlobalPosts(prev => {
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

          // Handle post updates (termasuk like count changes)
          if (event === 'UPDATE') {
            console.log('✏️ Post updated via real-time:', payload.new.id, 'likes:', payload.new.likes);
            setGlobalPosts(prev =>
              prev.map(post =>
                post.id === payload.new.id
                  ? {
                    ...post,
                    likes: payload.new.likes || 0,
                    comments: payload.new.comments || 0,
                    shares: payload.new.shares || 0
                  }
                  : post
              )
            );
          }
        }
      );

      // TAMBAHKAN: Real-time untuk post_likes
      unsubscribeLikes = supabase
        .channel('post_likes_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'post_likes',
            filter: `user_id=eq.${currentUser.id}`
          },
          async (payload) => {
            console.log('❤️ Post like update:', payload.eventType, payload.new?.post_id);

            // Refresh user likes ketika ada perubahan
            await loadUserLikes();
          }
        )
        .subscribe((status) => {
          console.log('📡 Post likes subscription status:', status);
        });

      // Real-time untuk komentar baru
      unsubscribeComments = supabase
        .channel('post_comments_updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'post_comments'
          },
          async (payload) => {
            console.log('💬 New comment received:', payload.new);

            // Load comments untuk post yang dikomentari
            await loadComments(payload.new.post_id);

            // Update comments count di globalPosts
            setGlobalPosts(prev =>
              prev.map(post =>
                post.id === payload.new.post_id
                  ? {
                    ...post,
                    comments: (post.comments || 0) + 1
                  }
                  : post
              )
            );
          }
        )
        .subscribe((status) => {
          console.log('📡 Comments subscription status:', status);
        });

      // Setup online presence
      MessageController.setupOnlinePresence(
        currentUser,
        (onlineUserIds) => setOnlineUsers(onlineUserIds)
      );
    }

    return () => {
      if (unsubscribeMessages) unsubscribeMessages();
      if (unsubscribePosts) unsubscribePosts();
      if (unsubscribeLikes) unsubscribeLikes();
      if (unsubscribePostUpdates) unsubscribePostUpdates();
      if (unsubscribeComments) unsubscribeComments();
    };
  }, [currentUser, selectedUser, scrollToBottom, loadComments, loadUserLikes]); // Tambahkan dependencies yang diperlukan

  // Initialize application
  const initializeApp = useCallback(async () => {
    if (currentUser) {
      try {
        console.log('🚀 Initializing real-time features for user:', currentUser.username);
        await loadInitialData();
        setupRealtimeSubscriptions();
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    }
  }, [currentUser, loadInitialData, setupRealtimeSubscriptions]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // Heartbeat for online status - DIPERBAIKI
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
        }
      } catch (err) {
        console.error('❌ Heartbeat failed:', err);
      }
    };

    // Jalankan heartbeat segera
    heartbeat();

    // Setup interval
    heartbeatIntervalRef.current = setInterval(heartbeat, 15000);

    // Cleanup function
    return () => {
      isMounted = false;

      // Clear interval
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      // Set offline status ketika unmount - DIPERBAIKI
      if (currentUser) {
        console.log('🚪 Setting user offline on unmount:', currentUser.username);

        // Gunakan then/catch untuk handle promise
        supabase
          .from('users')
          .update({
            is_online: false,
            last_seen: new Date().toISOString()
          })
          .eq('id', currentUser.id)
          .then(({ error }) => {
            if (error) {
              console.error('❌ Error setting offline status:', error);
            } else {
              console.log('✅ User set to offline successfully');
            }
          })
          .catch(err => {
            console.error('❌ Error in offline status update:', err);
          });
      }
    };
  }, [currentUser]);

  // Auth Handlers
  const handleLogin = async (e) => {
    if (e) e.preventDefault();

    try {
      const user = await AuthController.login(loginForm.username, loginForm.password);
      setCurrentUser(user);
      setCurrentView('dashboard');
      await AuthController.setOnlineStatus(user.id, true);
    } catch (error) {
      throw error;
    }
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();

    try {
      const user = await AuthController.register(
        registerForm.username,
        registerForm.password,
        registerForm.confirmPassword
      );
      setCurrentUser(user);
      setCurrentView('dashboard');
      await AuthController.setOnlineStatus(user.id, true);
    } catch (error) {
      throw error;
    }
  };

  // Logout Handler - DIPERBAIKI
  const handleLogout = async () => {
    try {
      if (currentUser) {
        console.log('🚪 Logging out user:', currentUser.username);

        // Set status offline terlebih dahulu
        const { error } = await supabase
          .from('users')
          .update({
            is_online: false,
            last_seen: new Date().toISOString()
          })
          .eq('id', currentUser.id);

        if (error) {
          console.error('❌ Error setting offline status during logout:', error);
        } else {
          console.log('✅ User offline status updated during logout');
        }
      }
    } catch (err) {
      console.error('❌ Error during logout cleanup:', err);
    } finally {
      // Clear interval heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      // Reset semua state
      setCurrentUser(null);
      setCurrentView('login');
      setProjects([]);
      setUsers([]);
      setMessages([]);
      setGlobalPosts([]);
      setEditingProject(null);
      setSelectedUser(null);
      setNewMessage('');
      setNewPost('');
      setSearchTerm('');
      setExpenses(0);

      // Reset form login
      setLoginForm({ username: '', password: '' });
      setRegisterForm({ username: '', password: '', confirmPassword: '' });
      setProjectForm({
        clientName: '',
        projectTitle: '',
        features: [{ name: '', price: 0 }],
        hourlyRate: 0,
        estimatedHours: 0,
        deadline: '',
        rateType: 'feature'
      });

      console.log('✅ Logout completed successfully');
    }
  };

  // Project Handlers
  const handleAddProject = async (projectFormData) => {
    try {
      const projectData = ProjectController.prepareProjectData(currentUser.id, projectFormData);
      const newProject = await ProjectController.addProject(projectData);
      setProjects(prev => [newProject, ...prev]);

      // Reset form dan kembali ke dashboard
      setProjectForm({
        clientName: '',
        projectTitle: '',
        features: [{ name: '', price: 0 }],
        hourlyRate: 0,
        estimatedHours: 0,
        deadline: '',
        rateType: 'feature'
      });
      setEditingProject(null);

      // Kembali ke dashboard setelah berhasil
      setCurrentView('dashboard');
      alert("Proyek berhasil disimpan!");
    } catch (error) {
      alert(`Gagal menyimpan proyek: ${error.message}`);
    }
  };

  const handleTogglePaymentStatus = async (projectId) => {
    try {
      const project = projects.find(p => p.id === projectId);
      const updatedProject = await ProjectController.updateProject(projectId, {
        is_paid: !project.is_paid
      });

      setProjects(prevProjects =>
        prevProjects.map(p =>
          p.id === projectId ? updatedProject : p
        )
      );
    } catch (err) {
      console.error('Error updating payment status:', err);
      alert('Terjadi kesalahan saat mengupdate status pembayaran');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Yakin ingin menghapus proyek ini?')) return;

    try {
      await ProjectController.deleteProject(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
      // Kembali ke dashboard setelah menghapus
      setCurrentView('dashboard');
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Terjadi kesalahan saat menghapus proyek');
    }
  };

  const handleEditProject = (project) => {
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
    setCurrentView('project-form');
  };

  const handleShowProjectDetail = (project) => {
    setEditingProject(project);
    setCurrentView('project-detail');
  };

  const handleGeneratePDF = async (project) => {
    try {
      await ProjectController.generateProjectPDF(project);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal menghasilkan PDF. Silakan coba lagi.');
    }
  };

  // Message Handlers
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUser) return;

    const tempMessage = newMessage;
    setNewMessage('');

    try {
      const newMessageData = await MessageController.sendMessage(
        currentUser.id,
        selectedUser.id,
        tempMessage
      );

      setMessages(prev => [...prev, newMessageData]);
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (err) {
      console.error('Error sending message:', err);
      setNewMessage(tempMessage);
      alert('Gagal mengirim pesan: ' + err.message);
    }
  };

  // Post Handlers
  const handleAddPost = async () => {
    if (!newPost.trim() || !currentUser) return;

    try {
      const newPostData = await PostController.createPost(currentUser.id, newPost);
      setGlobalPosts(prev => [newPostData, ...prev]);
      setNewPost('');
    } catch (err) {
      console.error('Error adding post:', err);
      alert('Gagal memposting: ' + err.message);
    }
  };

  // Project Form Handlers
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
    return ProjectController.calculateProjectTotal(projectForm);
  };

  // Navigation Handlers
  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
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
  };

  const handleOpenProjectForm = () => {
    setCurrentView('project-form');
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
  };

  // Render appropriate view berdasarkan currentView
  switch (currentView) {
    case 'login':
      return (
        <LoginView
          loginForm={loginForm}
          registerForm={registerForm}
          setLoginForm={setLoginForm}
          setRegisterForm={setRegisterForm}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      );

    case 'network':
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
          sendMessage={handleSendMessage}
          setShowNetwork={() => setCurrentView('dashboard')}
          addGlobalPost={handleAddPost}
          loadUsers={loadUsers}
          loadGlobalPosts={loadGlobalPosts}
          messagesEndRef={messagesEndRef}
          scrollToBottom={scrollToBottom}
          toggleLike={toggleLike}
          isPostLiked={isPostLiked}
          userLikes={userLikes}
          postComments={postComments}
          expandedComments={expandedComments}
          addComment={addComment}
          toggleComments={toggleComments}
        />
      );

    case 'project-form':
      return (
        <ProjectForm
          projectForm={projectForm}
          setProjectForm={setProjectForm}
          editingProject={editingProject}
          onClose={handleBackToDashboard}
          onSubmit={handleAddProject}
          onAddFeature={addFeature}
          onRemoveFeature={removeFeature}
          onUpdateFeature={updateFeature}
          calculateTotal={calculateTotal}
        />
      );

    case 'project-detail':
      return (
        <ProjectDetail
          project={editingProject}
          onClose={handleBackToDashboard}
          onEdit={handleEditProject}
          onTogglePayment={handleTogglePaymentStatus}
          onDelete={handleDeleteProject}
          onGeneratePDF={handleGeneratePDF}
        />
      );

    default:
      return (
        <Dashboard
          currentUser={currentUser}
          projects={projects}
          expenses={expenses}
          onExpensesChange={setExpenses}
          onAddProject={handleOpenProjectForm}
          onLogout={handleLogout}
          onOpenNetwork={() => setCurrentView('network')}
          onLoadProjects={loadProjects}
          onShowProjectDetail={handleShowProjectDetail}
          onEditProject={handleEditProject}
          onTogglePaymentStatus={handleTogglePaymentStatus}
          onDeleteProject={handleDeleteProject}
          onGeneratePDF={handleGeneratePDF}
        />
      );
  }
};

export default FreelancerManager;