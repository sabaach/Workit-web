import ProjectModel from '../models/ProjectModel';

class ProjectController {
  static async loadProjects(userId) {
    return await ProjectModel.getProjects(userId);
  }

  static async addProject(projectData) {
    // Validate required fields
    if (!projectData.client_name || !projectData.project_title) {
      throw new Error("Nama client dan judul proyek wajib diisi");
    }

    return await ProjectModel.createProject(projectData);
  }

  static async updateProject(projectId, updates) {
    return await ProjectModel.updateProject(projectId, updates);
  }

  static async deleteProject(projectId) {
    await ProjectModel.deleteProject(projectId);
  }

  static calculateProjectTotal(projectForm) {
    if (projectForm.rateType === 'feature') {
      return (projectForm.features || []).reduce(
        (sum, feature) => sum + (Number(feature.price) || 0),
        0
      );
    } else {
      return (Number(projectForm.hourlyRate) || 0) *
        (Number(projectForm.estimatedHours) || 0);
    }
  }

  static prepareProjectData(currentUserId, projectForm) {
    const totalAmount = this.calculateProjectTotal(projectForm);

    return {
      user_id: currentUserId,
      client_name: projectForm.clientName.trim(),
      project_title: projectForm.projectTitle.trim(),
      features: projectForm.features.map(f => ({
        name: f.name.trim(),
        price: Number(f.price)
      })),
      hourly_rate: projectForm.rateType === 'hourly' ? Number(projectForm.hourlyRate) : null,
      estimated_hours: projectForm.rateType === 'hourly' ? Number(projectForm.estimatedHours) : null,
      deadline: projectForm.deadline || null,
      rate_type: projectForm.rateType,
      total_amount: totalAmount,
      is_paid: false
    };
  }

  static async generateProjectPDF(project) {
    try {
      // Dynamically import the libraries to avoid SSR issues
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

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
      throw error;
    }
  }
}

export default ProjectController;