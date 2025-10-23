import React from 'react';
import { Edit, CheckCircle, XCircle, FileText, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ProjectDetail = ({
  project,
  onClose,
  onEdit,
  onTogglePayment,
  onDelete,
  onGeneratePDF
}) => {
  const handleGeneratePDF = async () => {
    if (onGeneratePDF) {
      await onGeneratePDF(project);
    } else {
      // Fallback PDF generation
      await generateProjectPDF(project);
    }
  };

  const generateProjectPDF = async (project) => {
    try {
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

      invoiceElement.style.position = 'absolute';
      invoiceElement.style.left = '-9999px';
      document.body.appendChild(invoiceElement);

      const canvas = await html2canvas(invoiceElement);
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / imgHeight;
      const pdfImgWidth = pageWidth;
      const pdfImgHeight = pageWidth / ratio; 

      pdf.addImage(imgData, 'PNG', 0, 0, pdfImgWidth, pdfImgHeight);
      document.body.removeChild(invoiceElement);

      pdf.save(`Invoice-${project.client_name}-${project.project_title}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal menghasilkan PDF. Silakan coba lagi.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Detail Proyek</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold w-8 h-8 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Informasi Proyek</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Client:</span> {project.client_name}</p>
                  <p><span className="font-medium">Judul:</span> {project.project_title}</p>
                  <p><span className="font-medium">Deadline:</span> {new Date(project.deadline).toLocaleDateString('id-ID')}</p>
                  <p><span className="font-medium">Dibuat:</span> {new Date(project.created_at).toLocaleDateString('id-ID')}</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Keuangan</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Total:</span> Rp {(project?.total_amount || 0).toLocaleString('id-ID')}</p>
                  <p><span className="font-medium">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-sm ${project.is_paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {project.is_paid ? 'Sudah Dibayar' : 'Belum Dibayar'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {project.rate_type === 'feature' ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Daftar Fitur</h3>
                <div className="space-y-2">
                  {project.features.map((feature, index) => (
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
                  <p><span className="font-medium">Rate per Jam:</span> Rp {project.hourly_rate.toLocaleString('id-ID')}</p>
                  <p><span className="font-medium">Estimasi Jam:</span> {project.estimated_hours} jam</p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => onEdit(project)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                onClick={() => onTogglePayment(project.id)}
                className={`flex items-center px-4 py-2 rounded-lg ${project.is_paid
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
              >
                {project.is_paid ? <XCircle className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                {project.is_paid ? 'Tandai Belum Dibayar' : 'Tandai Sudah Dibayar'}
              </button>
              <button
                onClick={handleGeneratePDF}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                Save to PDF
              </button>
              <button
                onClick={() => onDelete(project.id)}
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
};

export default ProjectDetail;