import { createClient } from '@supabase/supabase-js';
import React, { useState, useEffect } from 'react';
import { PlusCircle, User, DollarSign, Calendar, FileText, CheckCircle, XCircle, BarChart3, Eye, Edit, Trash2, TrendingUp, Wallet } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import bcrypt from 'bcryptjs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log("Supabase Config:", { supabaseUrl, supabaseAnonKey });

const FreelancerManager = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [expenses, setExpenses] = useState(0);
  const [showLogin, setShowLogin] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showProjectDetail, setShowProjectDetail] = useState(null);
  const [editingProject, setEditingProject] = useState(null);

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

  // Load projects when user changes
  useEffect(() => {
    if (currentUser) {
      loadProjects();
    }
  }, [currentUser]);

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
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
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
                  onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password</label>
                <input
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
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
                    onChange={(e) => setProjectForm({...projectForm, clientName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Judul Proyek</label>
                  <input
                    type="text"
                    value={projectForm.projectTitle}
                    onChange={(e) => setProjectForm({...projectForm, projectTitle: e.target.value})}
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
                  onChange={(e) => setProjectForm({...projectForm, deadline: e.target.value})}
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
                      onChange={(e) => setProjectForm({...projectForm, rateType: e.target.value})}
                      className="mr-2"
                    />
                    Per Fitur
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="hourly"
                      checked={projectForm.rateType === 'hourly'}
                      onChange={(e) => setProjectForm({...projectForm, rateType: e.target.value})}
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
                      onChange={(e) => setProjectForm({...projectForm, hourlyRate: parseFloat(e.target.value) || 0})}
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
                      onChange={(e) => setProjectForm({...projectForm, estimatedHours: parseFloat(e.target.value) || 0})}
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
                className={`flex items-center px-4 py-2 rounded-lg ${
                  showProjectDetail.is_paid 
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
                <span>Selamat datang, {currentUser.username}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
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
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            project.is_paid 
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
                          className={`p-2 transition duration-150 ${
                            project.isPaid 
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