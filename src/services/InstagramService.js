// services/InstagramService.js
import html2canvas from 'html2canvas';

export class InstagramService {
    // Method utama untuk share screenshot ke Instagram
    static async sharePostToInstagramStory(postElement, post) {
        try {
            console.log('📸 Taking screenshot of post content only...');

            // 1. Ambil screenshot dari post (hanya konten saja)
            const screenshotBlob = await this.capturePostContentOnly(postElement, post);

            // 2. Gunakan method sesuai device
            if (this.isMobileDevice()) {
                return await this.shareToMobileInstagram(screenshotBlob, post);
            } else {
                return await this.shareToDesktopInstagram(screenshotBlob, post);
            }

        } catch (error) {
            console.error('❌ Error sharing to Instagram:', error);
            // Fallback ke instruksi manual
            this.showManualInstructions();
            return false;
        }
    }

    // Capture screenshot hanya konten post (user dan message) - SAMA
    static async capturePostContentOnly(postElement, post) {
        try {
            // Buat container khusus untuk screenshot
            const screenshotContainer = document.createElement('div');
            screenshotContainer.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: 400px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        padding: 0;
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

            // Buat konten post yang disederhanakan (hanya user dan message)
            const postContent = this.createSimplifiedPostContent(post);

            // Buat footer dengan watermark dan link
            const websiteFooter = this.createWorkItFooter();

            // Gabungkan post content dan footer
            screenshotContainer.appendChild(postContent);
            screenshotContainer.appendChild(websiteFooter);

            // Tambahkan ke DOM sementara
            document.body.appendChild(screenshotContainer);

            // Ambil screenshot
            const canvas = await html2canvas(screenshotContainer, {
                backgroundColor: '#ffffff',
                scale: this.isMobileDevice() ? 1.5 : 2,
                useCORS: true,
                allowTaint: false,
                logging: false,
                width: screenshotContainer.scrollWidth,
                height: screenshotContainer.scrollHeight,
                onclone: (document, element) => {
                    // Style tambahan untuk screenshot
                    element.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.15)';
                    element.style.borderRadius = '16px';
                }
            });

            // Cleanup
            document.body.removeChild(screenshotContainer);

            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    if (!blob) {
                        throw new Error('Gagal membuat screenshot');
                    }
                    resolve(blob);
                }, 'image/png', 0.95);
            });

        } catch (error) {
            console.error('❌ Error capturing simplified post:', error);
            throw new Error('Gagal mengambil screenshot konten post');
        }
    }

    // Buat konten post yang disederhanakan (hanya user dan message) - SAMA
    static createSimplifiedPostContent(post) {
        const contentDiv = document.createElement('div');
        contentDiv.style.cssText = `
      padding: 30px 25px 25px 25px;
      background: white;
      border-top-left-radius: 16px;
      border-top-right-radius: 16px;
    `;

        // Header dengan user info
        const headerDiv = document.createElement('div');
        headerDiv.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    `;

        // User avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.style.cssText = `
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 18px;
      margin-right: 15px;
      flex-shrink: 0;
    `;
        avatarDiv.textContent = post.user.avatar;

        // User info
        const userInfoDiv = document.createElement('div');
        userInfoDiv.style.cssText = `
      flex: 1;
    `;

        const userName = document.createElement('div');
        userName.style.cssText = `
      font-weight: 700;
      font-size: 18px;
      color: #1a202c;
      margin-bottom: 4px;
    `;
        userName.textContent = post.user.name;

        const postTime = document.createElement('div');
        postTime.style.cssText = `
      font-size: 14px;
      color: #718096;
    `;
        postTime.textContent = post.timestamp;

        userInfoDiv.appendChild(userName);
        userInfoDiv.appendChild(postTime);

        headerDiv.appendChild(avatarDiv);
        headerDiv.appendChild(userInfoDiv);

        // Post content
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
      font-size: 16px;
      line-height: 1.6;
      color: #2d3748;
      background: #f7fafc;
      padding: 20px;
      border-radius: 12px;
      border-left: 4px solid #667eea;
    `;
        messageDiv.textContent = post.content;

        // Gabungkan semua
        contentDiv.appendChild(headerDiv);
        contentDiv.appendChild(messageDiv);

        return contentDiv;
    }

    // Buat footer dengan watermark WorkIt! dan link - SAMA
    static createWorkItFooter() {
        const footer = document.createElement('div');
        footer.style.cssText = `
      background: #f8f9fa;
      padding: 25px;
      border-bottom-left-radius: 16px;
      border-bottom-right-radius: 16px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    `;

        // Watermark WorkIt!
        const watermark = document.createElement('div');
        watermark.style.cssText = `
      font-size: 24px;
      font-weight: 900;
      color: #000000;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    `;
        watermark.textContent = 'WorkIt!';

        // Link website
        const link = document.createElement('div');
        link.style.cssText = `
      font-size: 14px;
      color: #667eea;
      font-weight: 600;
    `;
        link.textContent = 'https://workitt.vercel.app';

        // Description kecil
        const description = document.createElement('div');
        description.style.cssText = `
      font-size: 12px;
      color: #718096;
      margin-top: 8px;
    `;
        description.textContent = 'Platform Kolaborasi Freelancer Terbaik';

        footer.appendChild(watermark);
        footer.appendChild(link);
        footer.appendChild(description);

        return footer;
    }

    // ==================== MOBILE SHARING ====================
    static async shareToMobileInstagram(screenshotBlob, post) {
        try {
            // Method 1: Web Share API dengan file gambar
            if (navigator.share) {
                const success = await this.shareViaWebShare(screenshotBlob, post);
                if (success) return true;
            }

            // Method 2: Instagram App Direct Share
            const success = await this.shareViaInstagramApp(screenshotBlob);
            if (success) return true;

            // Method 3: Download dengan instruksi khusus mobile
            await this.downloadForMobile(screenshotBlob, post);
            return true;

        } catch (error) {
            console.error('Mobile sharing failed:', error);
            throw error;
        }
    }

    // ==================== DESKTOP SHARING ====================
    static async shareToDesktopInstagram(screenshotBlob, post) {
        try {
            console.log('🖥️ Desktop sharing initiated...');

            // Method 1: Web Share API (beberapa desktop browser support)
            if (navigator.share) {
                const success = await this.shareViaWebShare(screenshotBlob, post);
                if (success) return true;
            }

            // Method 2: Download dengan modal pilihan desktop
            const userChoice = await this.showDesktopOptions(screenshotBlob, post);
            return userChoice;

        } catch (error) {
            console.error('Desktop sharing failed:', error);
            // Fallback ke download sederhana
            await this.downloadForDesktop(screenshotBlob, post);
            return true;
        }
    }

    // Tampilkan opsi sharing untuk desktop
    static async showDesktopOptions(screenshotBlob, post) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      `;

            modal.innerHTML = `
        <div style="
          background: white;
          padding: 30px;
          border-radius: 20px;
          max-width: 500px;
          width: 90%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        ">
          <div style="
            background: #000;
            color: white;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 28px;
            font-weight: bold;
          ">💼</div>
          
          <h3 style="margin: 0 0 15px 0; color: #333; font-size: 24px; font-weight: 700;">
            Bagikan ke Instagram
          </h3>
          
          <p style="margin: 0 0 25px 0; color: #666; line-height: 1.5; font-size: 16px;">
            Pilih cara untuk membagikan post ini ke Instagram:
          </p>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0;">
            <button id="desktop-download" style="
              background: #000;
              color: white;
              border: none;
              padding: 15px;
              border-radius: 12px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 600;
              transition: all 0.3s ease;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 8px;
            ">
              <span style="font-size: 20px;">📥</span>
              Download Gambar
            </button>
            
            <button id="desktop-instagram" style="
              background: linear-gradient(45deg, #E1306C, #F77737, #FCAF45);
              color: white;
              border: none;
              padding: 15px;
              border-radius: 12px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 600;
              transition: all 0.3s ease;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 8px;
            ">
              <span style="font-size: 20px;">📱</span>
              Buka Instagram Web
            </button>
          </div>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 12px; margin: 20px 0; text-align: left;">
            <div style="color: #333; font-size: 14px; margin-bottom: 8px; font-weight: 600;">
              ℹ️ Cara Upload ke Instagram:
            </div>
            <div style="color: #666; font-size: 13px; line-height: 1.4;">
              1. Download gambar terlebih dahulu<br>
              2. Buka <strong>instagram.com</strong> di browser<br>
              3. Klik "+" untuk membuat post baru<br>
              4. Upload gambar yang sudah di-download<br>
              5. Tambahkan caption dan bagikan!
            </div>
          </div>
          
          <button id="desktop-cancel" style="
            background: #e2e8f0;
            color: #4a5568;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            margin-top: 10px;
            transition: all 0.3s ease;
          ">
            Batal
          </button>
        </div>
      `;

            document.body.appendChild(modal);

            // Event handlers untuk tombol desktop
            const downloadBtn = modal.querySelector('#desktop-download');
            const instagramBtn = modal.querySelector('#desktop-instagram');
            const cancelBtn = modal.querySelector('#desktop-cancel');

            // Download gambar
            downloadBtn.addEventListener('click', async () => {
                await this.downloadForDesktop(screenshotBlob, post);
                modal.remove();
                resolve(true);
            });

            // Buka Instagram Web
            instagramBtn.addEventListener('click', () => {
                this.openInstagramWeb();
                modal.remove();
                resolve(true);
            });

            // Batal
            cancelBtn.addEventListener('click', () => {
                modal.remove();
                resolve(false);
            });

            // Close modal ketika klik di luar
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    resolve(false);
                }
            });

            // ESC key to close
            const handleKeyPress = (e) => {
                if (e.key === 'Escape') {
                    modal.remove();
                    document.removeEventListener('keydown', handleKeyPress);
                    resolve(false);
                }
            };
            document.addEventListener('keydown', handleKeyPress);
        });
    }

    // Download untuk desktop
    static async downloadForDesktop(screenshotBlob, post) {
        try {
            const downloadUrl = URL.createObjectURL(screenshotBlob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `workit_post_${post.user.name}_${this.getFormattedTimestamp()}.png`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Cleanup
            setTimeout(() => {
                URL.revokeObjectURL(downloadUrl);
            }, 1000);

            // Tampilkan toast success
            this.showDesktopSuccessMessage();

        } catch (error) {
            console.error('Desktop download failed:', error);
            alert('Gagal mengunduh gambar. Silakan coba lagi.');
        }
    }

    // Buka Instagram Web
    static openInstagramWeb() {
        const instagramUrl = 'https://www.instagram.com/';
        window.open(instagramUrl, '_blank', 'width=1200,height=800');

        // Tampilkan instruksi
        setTimeout(() => {
            this.showInstagramWebInstructions();
        }, 1000);
    }

    // Tampilkan instruksi untuk Instagram Web
    static showInstagramWebInstructions() {
        const modal = document.createElement('div');
        modal.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      z-index: 10001;
      max-width: 300px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      border-left: 4px solid #E1306C;
    `;

        modal.innerHTML = `
      <div style="font-weight: 700; color: #333; margin-bottom: 10px; font-size: 16px;">
        📝 Cara Upload ke Instagram
      </div>
      <div style="color: #666; font-size: 13px; line-height: 1.4; margin-bottom: 15px;">
        1. Klik <strong>"Create"</strong> (icon +)<br>
        2. Pilih <strong>"Post"</strong><br>
        3. Upload gambar yang sudah di-download<br>
        4. Tambahkan caption<br>
        5. Klik <strong>"Share"</strong>
      </div>
      <button onclick="this.parentElement.remove()" style="
        background: #E1306C;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        width: 100%;
      ">
        Mengerti
      </button>
    `;

        document.body.appendChild(modal);

        // Auto remove setelah 10 detik
        setTimeout(() => {
            if (document.body.contains(modal)) {
                modal.remove();
            }
        }, 10000);
    }

    // Tampilkan pesan sukses untuk desktop
    static showDesktopSuccessMessage() {
        const toast = document.createElement('div');
        toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: slideIn 0.3s ease;
    `;

        toast.innerHTML = `
      <span>✅</span>
      <span>Gambar berhasil di-download!</span>
    `;

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
        document.head.appendChild(style);

        document.body.appendChild(toast);

        // Auto remove setelah 3 detik
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.style.animation = 'slideIn 0.3s ease reverse';
                setTimeout(() => {
                    if (document.body.contains(toast)) {
                        toast.remove();
                    }
                }, 300);
            }
            if (document.head.contains(style)) {
                style.remove();
            }
        }, 3000);
    }

    // ==================== SHARED METHODS ====================

    // Web Share API (shared between mobile and desktop)
    static async shareViaWebShare(screenshotBlob, post) {
        try {
            const file = new File([screenshotBlob], `workit_post_${Date.now()}.png`, {
                type: 'image/png'
            });

            const shareData = {
                files: [file],
                title: 'Post dari WorkIt!',
                text: `"${post.content.substring(0, 50)}..." oleh ${post.user.name}\n\nDownload WorkIt!: https://workitt.vercel.app`
            };

            if (navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                console.log('✅ Shared via Web Share API');
                return true;
            } else {
                console.log('❌ File sharing not supported');
                return false;
            }
        } catch (error) {
            console.log('Web Share API failed:', error);
            return false;
        }
    }

    // Instagram App Sharing (mobile only)
    static async shareViaInstagramApp(screenshotBlob) {
        return new Promise((resolve) => {
            try {
                const imageUrl = URL.createObjectURL(screenshotBlob);

                if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                    const instagramUrl = `instagram-stories://share?backgroundImage=${encodeURIComponent(imageUrl)}`;
                    window.location.href = instagramUrl;

                    setTimeout(() => {
                        URL.revokeObjectURL(imageUrl);
                        if (!document.hidden) {
                            resolve(false);
                        } else {
                            resolve(true);
                        }
                    }, 1000);

                } else if (/Android/i.test(navigator.userAgent)) {
                    const intentUrl =
                        `intent://share#Intent;` +
                        `package=com.instagram.android;` +
                        `scheme=instagram;` +
                        `action=android.intent.action.SEND;` +
                        `type=image/png;` +
                        `S.instagram.share.asset=file://${imageUrl};` +
                        `end`;

                    window.location.href = intentUrl;

                    setTimeout(() => {
                        URL.revokeObjectURL(imageUrl);
                        if (!document.hidden) {
                            resolve(false);
                        } else {
                            resolve(true);
                        }
                    }, 1000);

                } else {
                    resolve(false);
                }
            } catch (error) {
                console.error('Instagram app sharing error:', error);
                resolve(false);
            }
        });
    }

    // Download untuk Mobile
    static async downloadForMobile(screenshotBlob, post) {
        try {
            const downloadUrl = URL.createObjectURL(screenshotBlob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `workit_post_${this.getFormattedTimestamp()}.png`;
            link.style.display = 'none';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => {
                URL.revokeObjectURL(downloadUrl);
            }, 1000);

            this.showMobileInstructions();

        } catch (error) {
            console.error('Download failed:', error);
            this.showManualInstructions();
        }
    }

    // Helper methods
    static isMobileDevice() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    static getFormattedTimestamp() {
        const now = new Date();
        return `${now.getDate()}${now.getMonth() + 1}${now.getFullYear().toString().slice(-2)}_${now.getHours()}${now.getMinutes()}`;
    }

    static showManualInstructions() {
        alert('Screenshot post dengan watermark WorkIt! telah diambil. Silakan buka Instagram dan upload gambar dari galeri Anda.');
    }

    // Instruksi mobile yang sederhana
    static showMobileInstructions() {
        const modal = document.createElement('div');
        modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.95);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      padding: 20px;
    `;

        modal.innerHTML = `
      <div style="
        background: white;
        padding: 25px;
        border-radius: 20px;
        max-width: 400px;
        width: 100%;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      ">
        <div style="
          background: #000;
          color: white;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 24px;
          font-weight: bold;
        ">💼</div>
        
        <h3 style="margin: 0 0 15px 0; color: #333; font-size: 22px; font-weight: 700;">
          Post Siap Dibagikan!
        </h3>
        
        <p style="margin: 0 0 20px 0; color: #666; line-height: 1.5; font-size: 16px;">
          Gambar post dengan watermark <strong>WorkIt!</strong> telah tersimpan di galeri.
        </p>
        
        <div style="text-align: left; margin: 20px 0; background: #f8f9fa; padding: 15px; border-radius: 12px;">
          <div style="color: #333; font-size: 14px; margin-bottom: 8px; font-weight: 600;">
            📋 Isi Gambar:
          </div>
          <div style="color: #666; font-size: 13px; line-height: 1.4;">
            • Nama user & avatar<br>
            • Konten post lengkap<br>
            • Watermark <strong>WorkIt!</strong><br>
            • Link: https://workitt.vercel.app
          </div>
        </div>
        
        <div style="text-align: left; margin: 20px 0;">
          <div style="display: flex; align-items: center; margin: 10px 0; padding: 12px; background: #f0f7ff; border-radius: 10px;">
            <span style="
              background: #000;
              color: white;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 12px;
              font-size: 12px;
              font-weight: bold;
            ">1</span>
            <span style="color: #333; font-size: 14px;">Buka <strong>Instagram</strong> → <strong>Story</strong></span>
          </div>
          
          <div style="display: flex; align-items: center; margin: 10px 0; padding: 12px; background: #f0f7ff; border-radius: 10px;">
            <span style="
              background: #000;
              color: white;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 12px;
              font-size: 12px;
              font-weight: bold;
            ">2</span>
            <span style="color: #333; font-size: 14px;">Pilih gambar dari <strong>Galeri</strong></span>
          </div>
          
          <div style="display: flex; align-items: center; margin: 10px 0; padding: 12px; background: #f0f7ff; border-radius: 10px;">
            <span style="
              background: #000;
              color: white;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 12px;
              font-size: 12px;
              font-weight: bold;
            ">3</span>
            <span style="color: #333; font-size: 14px;">Bagikan ke <strong>Story</strong> Anda</span>
          </div>
        </div>
        
        <button id="mobile-modal-close" style="
          background: #000;
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 30px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          margin-top: 10px;
          width: 100%;
          transition: all 0.3s ease;
        ">
          👍 Oke, Mengerti!
        </button>
      </div>
    `;

        document.body.appendChild(modal);

        const closeButton = modal.querySelector('#mobile-modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                modal.remove();
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        const handleKeyPress = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleKeyPress);
            }
        };
        document.addEventListener('keydown', handleKeyPress);
    }
}