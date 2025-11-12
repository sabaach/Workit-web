import React, { useEffect } from 'react';
import { PlusCircle, Trash2, ArrowLeft } from 'lucide-react';

const ProjectForm = ({
  projectForm,
  setProjectForm,
  editingProject,
  onClose,
  onSubmit,
  onAddFeature,
  onRemoveFeature,
  onUpdateFeature,
  calculateTotal
}) => {
  useEffect(() => {
    if (editingProject) {
      setProjectForm({
        clientName: editingProject.client_name,
        projectTitle: editingProject.project_title,
        features: editingProject.features,
        hourlyRate: editingProject.hourly_rate,
        estimatedHours: editingProject.estimated_hours,
        deadline: editingProject.deadline,
        rateType: editingProject.rate_type
      });
    }
  }, [editingProject, setProjectForm]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(projectForm);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header dengan tombol kembali */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="flex items-center text-gray-500 hover:text-gray-700 transition duration-150"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Kembali ke Dashboard
              </button>
            </div>
            <h2 className="text-3xl font-bold text-gray-800">
              {editingProject ? 'Edit Proyek' : 'Tambah Proyek Baru'}
            </h2>
            <div className="w-32"></div> {/* Spacer untuk balance layout */}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                    onClick={onAddFeature}
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
                        onChange={(e) => onUpdateFeature(index, 'name', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        placeholder="Harga"
                        value={feature.price}
                        onChange={(e) => onUpdateFeature(index, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    {projectForm.features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveFeature(index)}
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
                onClick={onClose}
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
};

export default ProjectForm;