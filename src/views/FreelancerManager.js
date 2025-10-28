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

  // Sample posts for initial display
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

  const loadGlobalPosts = useCallback(async () => {
    try {
      if (!currentUser) {
        setGlobalPosts(samplePosts);
        return;
      }
      
      const posts = await PostController.loadPosts();
      setGlobalPosts(posts);
    } catch (error) {
      console.error('Error loading posts:', error);
      setGlobalPosts(samplePosts);
    }
  }, [currentUser]);

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
  }, [loadProjects, loadUsers, loadGlobalPosts]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Real-time subscriptions
  const setupRealtimeSubscriptions = useCallback(() => {
    let unsubscribeMessages;
    let unsubscribePosts;

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
                  likes: payload.new.likes,
                  comments: payload.new.comments,
                  shares: payload.new.shares,
                  created_at: payload.new.created_at
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
        }
      );

      // Setup online presence
      MessageController.setupOnlinePresence(
        currentUser,
        (onlineUserIds) => setOnlineUsers(onlineUserIds)
      );
    }

    return () => {
      if (unsubscribeMessages) unsubscribeMessages();
      if (unsubscribePosts) unsubscribePosts();
    };
  }, [currentUser, selectedUser, scrollToBottom]);

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