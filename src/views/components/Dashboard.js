import React from 'react';
import {
  PlusCircle, User, DollarSign, Calendar, FileText, CheckCircle, XCircle,
  BarChart3, Eye, Edit, Trash2, TrendingUp, Wallet, Globe
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Dashboard = ({
  currentUser,
  projects,
  expenses,
  onExpensesChange,
  onAddProject,
  onLogout,
  onOpenNetwork,
  onLoadProjects,
  onShowProjectDetail,
  onEditProject,
  onTogglePaymentStatus,
  onDeleteProject,
  onGeneratePDF
}) => {
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
                onClick={onOpenNetwork}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition duration-200 shadow-sm"
              >
                <Globe className="w-5 h-5 mr-2" />
                Forum Network
              </button>
              <button
                onClick={onAddProject}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Tambah Proyek
              </button>
              <button
                onClick={onLogout}
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
                onChange={(e) => onExpensesChange(parseFloat(e.target.value) || 0)}
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
                onClick={onAddProject}
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
                          {project.rate_type === 'feature'
                            ? `${project.features?.length || 0} fitur`
                            : `${project.estimated_hours} jam`
                          }
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onShowProjectDetail(project)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition duration-150"
                          title="Lihat Detail"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onEditProject(project)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition duration-150"
                          title="Edit Proyek"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onTogglePaymentStatus(project.id)}
                          className={`p-2 transition duration-150 ${project.is_paid
                            ? 'text-green-600 hover:text-green-700'
                            : 'text-gray-400 hover:text-green-600'
                            }`}
                          title={project.is_paid ? 'Tandai Belum Dibayar' : 'Tandai Sudah Dibayar'}
                        >
                          {project.is_paid ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => onDeleteProject(project.id)}
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

export default Dashboard;