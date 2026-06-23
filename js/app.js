// EnglishFree - Main Coordinator & Routing System

class App {
  constructor() {
    this.currentTab = 'dashboard';
    const path = window.location.pathname.toLowerCase();
    if (path.includes('vocab.html')) {
      this.currentTab = 'vocab';
    } else if (path.includes('listening.html')) {
      this.currentTab = 'listening';
    } else if (path.includes('reading.html')) {
      this.currentTab = 'reading';
    } else if (path.includes('speaking.html')) {
      this.currentTab = 'speaking';
    } else if (path.includes('writing.html')) {
      this.currentTab = 'writing';
    }

    let storedKey = localStorage.getItem('ef_gemini_api_key');
    const oldKeys = [
      'AQ.Ab8RN6J0X4L5c0o4gZl0wLZlEvHHXzag47HiCHiHD2IxNpgpCA',
      'AQ.Ab8RN6LNAuCyi33lIfhLrMTInUzKMRIwVLI147Jab-ot2ZGxkQ'
    ];
    if (!storedKey || oldKeys.includes(storedKey)) {
      storedKey = 'AQ.Ab8RN6IGq66Iv2O0kK-qRUoinOXQIqBqdTbRLBx-o_GGMRM1QA';
      localStorage.setItem('ef_gemini_api_key', storedKey);
    }
    this.apiKey = storedKey;
    this.voiceGender = localStorage.getItem('ef_voice_gender') || 'female';
    this.theme = localStorage.getItem('ef_theme') || 'light';
    
    // Auth Session
    this.currentUser = localStorage.getItem('ef_current_user') || null;
    
    // Load student-specific progress or fallback
    const progressKey = this.currentUser ? 'ef_progress_' + this.currentUser : 'ef_progress';
    this.progress = JSON.parse(localStorage.getItem(progressKey)) || {};
    this.progress.wordsLearned = this.progress.wordsLearned || [];
    this.progress.testsPassed = this.progress.testsPassed || 0;
    this.progress.listeningCompleted = this.progress.listeningCompleted || [];
    this.progress.readingCompleted = this.progress.readingCompleted || [];
    this.progress.speakingCompleted = this.progress.speakingCompleted || [];
    this.progress.writingCompleted = this.progress.writingCompleted || [];
    this.progress.vocabProgress = this.progress.vocabProgress || { "A1": 1, "A2": 1, "B1": 1, "B2": 1 };
    this.progress.dailyLog = this.progress.dailyLog || {};
  }

  init() {
    // Apply theme
    if (this.theme === 'dark') {
      document.body.classList.add('dark-mode');
      document.getElementById('dark-mode-text').textContent = 'Chế độ sáng';
    }

    // Apply settings values to modal inputs
    document.getElementById('settings-api-key').value = this.apiKey;
    document.getElementById('settings-voice-gender').value = this.voiceGender;

    // Authentication Gate
    if (!this.currentUser) {
      document.getElementById('app-login-overlay').style.display = 'flex';
      return; // Skip modules initialization until logged in
    }

    // Render User profile details
    document.getElementById('app-login-overlay').style.display = 'none';
    document.getElementById('user-profile-sidebar').style.display = 'flex';
    document.getElementById('user-display-name').textContent = this.currentUser;
    document.getElementById('user-avatar-char').textContent = this.currentUser.charAt(0).toUpperCase();

    // Load progress UI
    this.updateProgress();
    this.renderStudyHistory();

    // Init modules
    vocab.init();
    listening.init();
    reading.init();
    speaking.init();
    writing.init();

    // Activate the current tab section
    this.switchTab(this.currentTab);
  }

  handleLoginSubmit() {
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const username = usernameInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();

    const allowedUsers = {
      'thanhquy': '12345678',
      'hangni': '12345678'
    };

    if (allowedUsers[username] && allowedUsers[username] === password) {
      this.login(username);
    } else {
      const card = document.getElementById('app-login-card');
      card.classList.add('shake');
      this.showToast('Tài khoản hoặc mật khẩu không chính xác!', 'error');
      setTimeout(() => {
        card.classList.remove('shake');
      }, 400);
    }
  }

  login(username) {
    this.currentUser = username;
    localStorage.setItem('ef_current_user', username);
    
    // Load student-specific progress
    const progressKey = 'ef_progress_' + username;
    this.progress = JSON.parse(localStorage.getItem(progressKey)) || {};
    this.progress.wordsLearned = this.progress.wordsLearned || [];
    this.progress.testsPassed = this.progress.testsPassed || 0;
    this.progress.listeningCompleted = this.progress.listeningCompleted || [];
    this.progress.readingCompleted = this.progress.readingCompleted || [];
    this.progress.speakingCompleted = this.progress.speakingCompleted || [];
    this.progress.writingCompleted = this.progress.writingCompleted || [];
    this.progress.vocabProgress = this.progress.vocabProgress || { "A1": 1, "A2": 1, "B1": 1, "B2": 1 };
    this.progress.dailyLog = this.progress.dailyLog || {};

    // Hide Login Overlay & render user profile details
    document.getElementById('app-login-overlay').style.display = 'none';
    document.getElementById('user-profile-sidebar').style.display = 'flex';
    document.getElementById('user-display-name').textContent = username;
    document.getElementById('user-avatar-char').textContent = username.charAt(0).toUpperCase();

    // Load progress UI
    this.updateProgress();
    this.renderStudyHistory();

    // Init modules
    vocab.init();
    listening.init();
    reading.init();
    speaking.init();
    writing.init();

    // Activate the current tab section
    this.switchTab(this.currentTab);

    this.showToast(`Chào mừng ${username} đã đăng nhập thành công!`, 'success');
  }

  logout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      localStorage.removeItem('ef_current_user');
      location.reload();
    }
  }

  switchTab(tabId) {
    const filename = tabId === 'dashboard' ? 'index.html' : `${tabId}.html`;
    const path = window.location.pathname.toLowerCase();
    
    // Check if we need to redirect
    let shouldRedirect = false;
    if (tabId === 'dashboard') {
      if (!path.endsWith('/') && !path.endsWith('/index.html') && !path.includes('index.html')) {
        shouldRedirect = true;
      }
    } else {
      if (!path.includes(filename)) {
        shouldRedirect = true;
      }
    }
    
    if (shouldRedirect) {
      window.location.href = filename;
      return;
    }

    // Deactivate previous nav item and section
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.app-section').forEach(sec => sec.classList.remove('active'));

    // Activate new ones
    const navItem = document.getElementById(`nav-${tabId}`);
    if (navItem) navItem.classList.add('active');

    const section = document.getElementById(`section-${tabId}`);
    if (section) section.classList.add('active');

    // Update Header title
    const titles = {
      'dashboard': 'Trang chủ',
      'vocab': 'Từ vựng thông dụng (3000 từ)',
      'listening': 'Luyện nghe IELTS Listening',
      'reading': 'Luyện đọc IELTS Reading & Shadowing',
      'speaking': 'Luyện nói cùng Trợ lý AI Speaking',
      'writing': 'Luyện viết IELTS Writing Task 1 & 2'
    };
    document.getElementById('current-section-title').textContent = titles[tabId] || 'EnglishFree';
    this.currentTab = tabId;

    // Trigger actions on switch
    if (tabId === 'dashboard') {
      this.renderStudyHistory();
    } else if (tabId === 'vocab') {
      vocab.resetView();
    } else if (tabId === 'listening') {
      listening.resetView();
    } else if (tabId === 'reading') {
      reading.resetView();
    } else if (tabId === 'speaking') {
      speaking.startConversation();
    } else if (tabId === 'writing') {
      writing.loadTask();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleDarkMode() {
    if (document.body.classList.contains('dark-mode')) {
      document.body.classList.remove('dark-mode');
      this.theme = 'light';
      document.getElementById('dark-mode-text').textContent = 'Chế độ tối';
    } else {
      document.body.classList.add('dark-mode');
      this.theme = 'dark';
      document.getElementById('dark-mode-text').textContent = 'Chế độ sáng';
    }
    localStorage.setItem('ef_theme', this.theme);
    this.showToast('Đã chuyển đổi giao diện màu sắc!', 'info');
  }

  showSettings() {
    document.getElementById('settings-modal-overlay').style.display = 'flex';
  }

  closeSettings() {
    document.getElementById('settings-modal-overlay').style.display = 'none';
  }

  saveSettings() {
    const key = document.getElementById('settings-api-key').value.trim();
    const gender = document.getElementById('settings-voice-gender').value;

    this.apiKey = key;
    this.voiceGender = gender;

    localStorage.setItem('ef_gemini_api_key', key);
    localStorage.setItem('ef_voice_gender', gender);

    this.closeSettings();
    this.showToast('Cấu hình đã được lưu thành công!', 'success');

    // Notify speaking module to restart voice parameters if active
    speaking.applyVoiceSettings();
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('app-toast');
    toast.textContent = message;
    toast.style.display = 'block';
    
    // Styling based on type
    if (type === 'success') {
      toast.style.borderLeftColor = 'var(--success-color)';
    } else if (type === 'error') {
      toast.style.borderLeftColor = 'var(--danger-color)';
    } else {
      toast.style.borderLeftColor = 'var(--primary-color)';
    }

    setTimeout(() => {
      toast.style.display = 'none';
    }, 3000);
  }

  updateProgress() {
    const totalWords = 3000;
    const wordsLearnedCount = this.progress.wordsLearned.length;
    
    // Simple overall progress weight: 50% vocab, 12.5% listening, 12.5% reading, 12.5% speaking, 12.5% writing
    const vocabWeight = (wordsLearnedCount / totalWords) * 50;
    const listeningWeight = Math.min((this.progress.listeningCompleted.length / 5) * 12.5, 12.5);
    const readingWeight = Math.min((this.progress.readingCompleted.length / 5) * 12.5, 12.5);
    const speakingWeight = Math.min((this.progress.speakingCompleted.length / 3) * 12.5, 12.5);
    const writingWeight = Math.min((this.progress.writingCompleted.length / 3) * 12.5, 12.5);

    const totalPercentage = Math.round(vocabWeight + listeningWeight + readingWeight + speakingWeight + writingWeight);
    
    document.getElementById('progress-text').textContent = `${totalPercentage}%`;
    document.getElementById('progress-bar').style.width = `${totalPercentage}%`;
    
    const progressKey = this.currentUser ? 'ef_progress_' + this.currentUser : 'ef_progress';
    localStorage.setItem(progressKey, JSON.stringify(this.progress));
  }

  saveProgress(type, id) {
    // Generate ISO date in client timezone (e.g. YYYY-MM-DD)
    const today = new Date().toLocaleDateString('en-CA');
    this.progress.dailyLog = this.progress.dailyLog || {};
    this.progress.dailyLog[today] = this.progress.dailyLog[today] || {
      words: [],
      listening: [],
      reading: []
    };

    if (type === 'vocab') {
      if (!this.progress.wordsLearned.includes(id)) {
        this.progress.wordsLearned.push(id);
      }
      if (!this.progress.dailyLog[today].words.includes(id)) {
        this.progress.dailyLog[today].words.push(id);
      }
    } else if (type === 'listening') {
      if (!this.progress.listeningCompleted.includes(id)) {
        this.progress.listeningCompleted.push(id);
      }
      if (!this.progress.dailyLog[today].listening.includes(id)) {
        this.progress.dailyLog[today].listening.push(id);
      }
    } else if (type === 'reading') {
      if (!this.progress.readingCompleted.includes(id)) {
        this.progress.readingCompleted.push(id);
      }
      if (!this.progress.dailyLog[today].reading.includes(id)) {
        this.progress.dailyLog[today].reading.push(id);
      }
    } else if (type === 'speaking' && !this.progress.speakingCompleted.includes(id)) {
      this.progress.speakingCompleted.push(id);
    } else if (type === 'writing' && !this.progress.writingCompleted.includes(id)) {
      this.progress.writingCompleted.push(id);
    }
    
    this.updateProgress();
    this.renderStudyHistory();
  }

  renderStudyHistory() {
    const container = document.getElementById('dashboard-history-log');
    if (!container) return;

    const log = this.progress.dailyLog || {};
    const dates = Object.keys(log).sort((a, b) => new Date(b) - new Date(a));

    if (dates.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 1.5rem; font-style: italic; background: var(--bg-color); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
          Chưa có nhật ký học tập. Hãy bắt đầu học từ vựng, nghe hoặc đọc để ghi nhận thành tích!
        </div>
      `;
      return;
    }

    container.innerHTML = dates.map(dateStr => {
      const entry = log[dateStr];
      const wordCount = entry.words ? entry.words.length : 0;
      const listeningCount = entry.listening ? entry.listening.length : 0;
      const readingCount = entry.reading ? entry.reading.length : 0;

      const dateParts = dateStr.split('-');
      const formattedDate = `Ngày ${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1.2rem; background: var(--bg-color); border-radius: var(--radius-md); border: 1px solid var(--border-color); gap: 1rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
          <div style="font-weight: 700; color: var(--text-color); display: flex; align-items: center; gap: 0.5rem; font-size: 0.95rem;">
            📅 ${formattedDate}
          </div>
          <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
            <span style="background: rgba(99, 102, 241, 0.1); color: var(--primary-color); border: 1px solid rgba(99, 102, 241, 0.2); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">
              📖 ${wordCount} từ vựng
            </span>
            <span style="background: rgba(16, 185, 129, 0.1); color: var(--success-color); border: 1px solid rgba(16, 185, 129, 0.2); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">
              🎧 ${listeningCount} bài nghe
            </span>
            <span style="background: rgba(245, 158, 11, 0.1); color: var(--warning-color); border: 1px solid rgba(245, 158, 11, 0.2); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">
              📚 ${readingCount} bài đọc
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  exportProgress() {
    try {
      const dataStr = JSON.stringify(this.progress, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `englishfree_progress_${this.currentUser || 'user'}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      this.showToast('Đã tải xuống tệp sao lưu tiến trình học!', 'success');
    } catch (e) {
      console.error(e);
      this.showToast('Không thể xuất tiến trình học!', 'error');
    }
  }

  importProgress() {
    document.getElementById('import-progress-file').click();
  }

  handleImportProgress(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (importedData && typeof importedData === 'object') {
          this.progress = {
            wordsLearned: Array.isArray(importedData.wordsLearned) ? importedData.wordsLearned : [],
            testsPassed: typeof importedData.testsPassed === 'number' ? importedData.testsPassed : 0,
            listeningCompleted: Array.isArray(importedData.listeningCompleted) ? importedData.listeningCompleted : [],
            readingCompleted: Array.isArray(importedData.readingCompleted) ? importedData.readingCompleted : [],
            speakingCompleted: Array.isArray(importedData.speakingCompleted) ? importedData.speakingCompleted : [],
            writingCompleted: Array.isArray(importedData.writingCompleted) ? importedData.writingCompleted : [],
            vocabProgress: importedData.vocabProgress || { "A1": 1, "A2": 1, "B1": 1, "B2": 1 }
          };
          
          this.updateProgress();
          this.showToast('Khôi phục tiến trình học thành công! Đang tải lại...', 'success');
          
          setTimeout(() => {
            location.reload();
          }, 1500);
        } else {
          this.showToast('Tệp tiến trình học không hợp lệ!', 'error');
        }
      } catch (err) {
        console.error(err);
        this.showToast('Định dạng tệp không hợp lệ (phải là JSON)!', 'error');
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  }

  resetProgress() {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ tiến trình học? Hành động này sẽ đặt lại tất cả các bài học và bài kiểm tra đã hoàn thành về trạng thái ban đầu.')) {
      this.progress = {
        wordsLearned: [],
        testsPassed: 0,
        listeningCompleted: [],
        readingCompleted: [],
        speakingCompleted: [],
        writingCompleted: [],
        vocabProgress: { "A1": 1, "A2": 1, "B1": 1, "B2": 1 }
      };
      this.updateProgress();
      this.showToast('Đã đặt lại tiến trình học về ban đầu! Đang tải lại...', 'success');
      
      setTimeout(() => {
        location.reload();
      }, 1500);
    }
  }

  // Common wrapper to call Gemini API
  async callGemini(systemPrompt, userPrompt, maxTokens = 1000) {
    if (!this.apiKey) {
      return null;
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${this.apiKey}`;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemPrompt}\n\nUser Input: ${userPrompt}` }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: maxTokens
          }
        })
      });

      if (!response.ok) {
        throw new Error('API Response was not OK');
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (e) {
      console.error("Gemini API error:", e);
      this.showToast('Lỗi kết nối Gemini API. Hãy kiểm tra API Key.', 'error');
      return null;
    }
  }

  // Global Text-to-Speech assistant with natural speed & premium voice prioritization
  speak(text, rate = 0.88) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn("Cancel voice error:", e);
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const enVoices = voices.filter(v => v.lang.startsWith('en'));
    
    if (enVoices.length > 0) {
      const genderTerm = this.voiceGender === 'male' ? 'male' : 'female';
      const scoreVoice = (v) => {
        let score = 0;
        const name = v.name.toLowerCase();
        
        // Match gender
        if (name.includes(genderTerm)) score += 10;
        else if (genderTerm === 'female' && (name.includes('samantha') || name.includes('zira') || name.includes('karen') || name.includes('moira') || name.includes('tessa') || name.includes('veena') || name.includes('siri') || name.includes('hazel'))) score += 5;
        else if (genderTerm === 'male' && (name.includes('david') || name.includes('mark') || name.includes('alex') || name.includes('daniel') || name.includes('rishi') || name.includes('james'))) score += 5;
        
        // Premium voice indicators
        if (name.includes('natural')) score += 100;
        if (name.includes('google')) score += 80;
        if (name.includes('siri')) score += 70;
        if (name.includes('enhanced')) score += 50;
        if (name.includes('premium')) score += 40;
        
        // Accents
        if (v.lang === 'en-US' || v.lang === 'en-GB') score += 20;
        
        return score;
      };
      
      enVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a));
      utterance.voice = enVoices[0];
    }

    window.speechSynthesis.speak(utterance);
  }
}

// Global App instance
const app = new App();
window.addEventListener('DOMContentLoaded', () => app.init());
