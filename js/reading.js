// EnglishFree - IELTS Reading Simulator Module
// Supports: Dashboard, Split-Pane Simulator, Results, Review Mode

class ReadingModule {
  constructor() {
    this.currentTest = null;
    this.currentPassageIndex = 0;
    this.userAnswers = {}; // { questionNumber: answerValue }
    this.timerInterval = null;
    this.timeRemaining = 60 * 60; // 60 minutes in seconds
    this.testStartTime = null;
    this.isSubmitted = false;
    this.fontSize = 1.1; // em units
    this.isReviewMode = false;
  }

  // ─── INIT ────────────────────────────────────────────────────────────
  init() {
    this.renderDashboard();
  }

  // ─── DASHBOARD ───────────────────────────────────────────────────────
  renderDashboard() {
    const grid = document.getElementById('reading-test-grid');
    if (!grid || !window.IELTS_READING_TESTS) return;

    grid.innerHTML = '';

    IELTS_READING_TESTS.forEach((test, index) => {
      const testNum = index + 1;
      const testId = test.test_id || `test_${testNum}`;
      const progress = this._getTestProgress(testId);
      const totalQ = test.passages.reduce((sum, p) => sum + (p.questions || []).length, 0);

      const card = document.createElement('div');
      card.className = 'reading-test-card';
      card.id = `test-card-${testId}`;

      let statusBadge = '';
      let statusClass = '';
      if (progress.score !== undefined) {
        const band = this._scoreToBand(progress.score, totalQ);
        statusBadge = `<div class="test-card-status completed">Band ${band} · ${progress.score}/${totalQ}</div>`;
        statusClass = 'completed';
      } else {
        statusBadge = `<div class="test-card-status new">Chưa làm</div>`;
      }

      card.innerHTML = `
        <div class="test-card-number">${testNum}</div>
        <div class="test-card-body">
          <h4 class="test-card-title">Mock Test ${testNum}</h4>
          <p class="test-card-subtitle">${test.passages.map(p => p.title).join(' · ')}</p>
          <div class="test-card-meta">
            <span>⏱ 60 phút</span>
            <span>📝 ${totalQ} câu</span>
            <span>📖 3 Passages</span>
          </div>
        </div>
        ${statusBadge}
        <button class="test-card-btn" onclick="reading.startTest(${index})">
          ${progress.score !== undefined ? 'Làm lại' : 'Bắt đầu'}
        </button>
      `;
      grid.appendChild(card);
    });
  }

  _getTestProgress(testId) {
    try {
      const saved = localStorage.getItem(`ielts_reading_${testId}`);
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  }

  _saveTestProgress(testId, score, totalQ, timeTaken) {
    try {
      localStorage.setItem(`ielts_reading_${testId}`, JSON.stringify({ score, totalQ, timeTaken, date: new Date().toISOString() }));
    } catch (e) {}
  }

  // ─── START TEST ──────────────────────────────────────────────────────
  startTest(testIndex) {
    this.currentTest = IELTS_READING_TESTS[testIndex];
    this.currentPassageIndex = 0;
    this.userAnswers = {};
    this.isSubmitted = false;
    this.isReviewMode = false;
    this.fontSize = 1.1;
    this.timeRemaining = 60 * 60;
    this.testStartTime = Date.now();

    // Show simulator view
    this._showView('simulator');

    document.getElementById('sim-test-title').textContent = this.currentTest.title || `IELTS Reading Mock Test`;

    // Render navigator
    this._renderNavigator();

    // Switch to passage 0
    this.switchPassage(0);

    // Start timer
    this._startTimer();
  }

  // ─── VIEW MANAGEMENT ─────────────────────────────────────────────────
  _showView(view) {
    // 'dashboard', 'simulator', 'results'
    document.getElementById('reading-dashboard-view').style.display = view === 'dashboard' ? '' : 'none';
    document.getElementById('reading-simulator-view').style.display = view === 'simulator' ? 'flex' : 'none';
    document.getElementById('reading-results-view').style.display = view === 'results' ? 'flex' : 'none';
  }

  exitTest() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = null;
    this._showView('dashboard');
    this.renderDashboard();
  }

  // ─── PASSAGE SWITCHING ───────────────────────────────────────────────
  switchPassage(index) {
    this.currentPassageIndex = index;
    const passage = this.currentTest.passages[index];

    // Update tab buttons
    [0, 1, 2].forEach(i => {
      const btn = document.getElementById(`btn-passage-${i + 1}`);
      if (btn) btn.classList.toggle('active', i === index);
    });

    // Render passage text
    this._renderPassage(passage);

    // Render questions
    this._renderQuestions(passage);
  }

  _renderPassage(passage) {
    const pane = document.getElementById('sim-passage-pane');
    if (!pane) return;

    const paragraphs = passage.text.split('\n\n').map(para => `<p>${para.trim()}</p>`).join('\n');

    pane.innerHTML = `
      <div class="passage-content" style="font-size: ${this.fontSize}em; line-height: 1.85;">
        <h2 class="passage-title">${passage.title}</h2>
        ${paragraphs}
      </div>
    `;
    pane.scrollTop = 0;
  }

  _renderQuestions(passage) {
    const pane = document.getElementById('sim-questions-pane');
    if (!pane) return;
    pane.innerHTML = '';

    // Group questions by type section
    let currentGroupLabel = '';
    passage.questions.forEach((q, idx) => {
      // Section header if question type changes
      const label = this._getTypeLabel(q.type);
      if (label !== currentGroupLabel) {
        currentGroupLabel = label;
        const header = document.createElement('div');
        header.className = 'q-section-header';
        header.innerHTML = `<strong>${label}</strong>`;
        pane.appendChild(header);
      }

      const item = document.createElement('div');
      item.className = 'q-item';
      item.id = `q-container-${q.number}`;

      const userAnswer = this.userAnswers[q.number];

      if (q.type === 'tfng' || q.type === 'mcq') {
        // Options rendering
        const options = q.options || [];
        const optionsHtml = options.map((opt, oIdx) => {
          const isSelected = userAnswer === opt;
          const isCorrect = this.isReviewMode && opt === q.answer;
          const isWrong = this.isReviewMode && isSelected && opt !== q.answer;

          let optClass = 'q-option';
          if (isSelected && !this.isReviewMode) optClass += ' selected';
          if (isCorrect) optClass += ' correct';
          if (isWrong) optClass += ' wrong';

          const disabled = this.isSubmitted ? 'disabled' : '';
          return `
            <label class="${optClass}" for="opt-${q.number}-${oIdx}" ${disabled ? 'style="pointer-events:none;"' : ''}>
              <input type="radio" id="opt-${q.number}-${oIdx}"
                name="q-${q.number}" value="${opt}"
                ${isSelected ? 'checked' : ''}
                ${disabled}
                onchange="reading._onAnswerChange(${q.number}, '${opt.replace(/'/g, "\\'")}')">
              <span>${opt}</span>
            </label>
          `;
        }).join('');

        item.innerHTML = `
          <div class="q-number">Câu ${q.number}</div>
          <div class="q-text">${q.text}</div>
          <div class="q-options">${optionsHtml}</div>
          ${this.isReviewMode ? `<div class="q-explanation"><strong>📍 Vị trí:</strong> "${q.location || ''}"<br><strong>💡 Giải thích:</strong> ${q.explanation || ''}</div>` : ''}
        `;

      } else if (q.type === 'gapfill') {
        const inputValue = userAnswer || '';
        const isCorrect = this.isReviewMode && inputValue.toLowerCase().trim() === (q.answer || '').toLowerCase().trim();
        const isWrong = this.isReviewMode && inputValue && !isCorrect;

        item.innerHTML = `
          <div class="q-number">Câu ${q.number}</div>
          <div class="q-text q-gapfill-text">${q.text.replace('______', `<input type="text" class="gap-input${isCorrect ? ' correct' : isWrong ? ' wrong' : ''}" id="gap-${q.number}" value="${inputValue}" ${this.isSubmitted ? 'disabled' : ''} oninput="reading._onAnswerChange(${q.number}, this.value)" placeholder="Nhập đáp án...">`)}</div>
          ${this.isReviewMode ? `<div class="q-explanation"><strong>✅ Đáp án:</strong> <em>${q.answer}</em><br><strong>📍 Vị trí:</strong> "${q.location || ''}"<br><strong>💡 Giải thích:</strong> ${q.explanation || ''}</div>` : ''}
        `;
      }

      pane.appendChild(item);
    });

    pane.scrollTop = 0;
  }

  _getTypeLabel(type) {
    const labels = {
      tfng: 'TRUE / FALSE / NOT GIVEN',
      mcq: 'Multiple Choice',
      gapfill: 'Gap Fill / Sentence Completion',
      matching: 'Matching',
    };
    return labels[type] || 'Questions';
  }

  _onAnswerChange(qNumber, value) {
    this.userAnswers[qNumber] = value;
    this._updateNavigatorBtn(qNumber, 'answered');
  }

  // ─── NAVIGATOR ───────────────────────────────────────────────────────
  _renderNavigator() {
    const grid = document.getElementById('sim-navigator-grid');
    if (!grid || !this.currentTest) return;
    grid.innerHTML = '';

    this.currentTest.passages.forEach(passage => {
      passage.questions.forEach(q => {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        btn.id = `nav-btn-${q.number}`;
        btn.textContent = q.number;
        btn.title = `Câu ${q.number}`;
        btn.onclick = () => this._jumpToQuestion(q.number);
        grid.appendChild(btn);
      });
    });
  }

  _updateNavigatorBtn(qNumber, state) {
    const btn = document.getElementById(`nav-btn-${qNumber}`);
    if (!btn) return;
    btn.className = `nav-btn ${state}`;
  }

  _jumpToQuestion(qNumber) {
    // Find which passage this question belongs to
    for (let i = 0; i < this.currentTest.passages.length; i++) {
      const passage = this.currentTest.passages[i];
      const found = passage.questions.find(q => q.number === qNumber);
      if (found) {
        if (i !== this.currentPassageIndex) {
          this.switchPassage(i);
          // Small delay to let DOM render
          setTimeout(() => {
            const el = document.getElementById(`q-container-${qNumber}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        } else {
          const el = document.getElementById(`q-container-${qNumber}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        break;
      }
    }
  }

  // ─── TIMER ───────────────────────────────────────────────────────────
  _startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this._updateTimerDisplay();
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      this._updateTimerDisplay();
      if (this.timeRemaining <= 0) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this._autoSubmit();
      }
    }, 1000);
  }

  _updateTimerDisplay() {
    const el = document.getElementById('sim-timer-text');
    const iconEl = document.getElementById('sim-timer-icon');
    if (!el) return;

    const mins = Math.floor(this.timeRemaining / 60);
    const secs = this.timeRemaining % 60;
    el.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // Warning colors
    const timerContainer = document.getElementById('sim-timer-container');
    if (this.timeRemaining <= 300) { // last 5 mins
      if (timerContainer) timerContainer.style.color = 'var(--danger-color)';
      if (iconEl) iconEl.textContent = '🔴';
    } else if (this.timeRemaining <= 600) { // last 10 mins
      if (timerContainer) timerContainer.style.color = 'var(--warning-color, #f59e0b)';
      if (iconEl) iconEl.textContent = '⚠️';
    }
  }

  _autoSubmit() {
    if (typeof app !== 'undefined' && app.showToast) {
      app.showToast('Hết giờ! Bài làm tự động nộp.', 'info');
    }
    this._doSubmit();
  }

  // ─── SUBMIT ──────────────────────────────────────────────────────────
  confirmSubmit() {
    const answeredCount = Object.keys(this.userAnswers).length;
    const totalQ = this.currentTest.passages.reduce((sum, p) => sum + p.questions.length, 0);
    const unanswered = totalQ - answeredCount;

    if (unanswered > 0) {
      const confirmed = confirm(`Bạn còn ${unanswered} câu chưa trả lời. Bạn có chắc muốn nộp bài không?`);
      if (!confirmed) return;
    }

    this._doSubmit();
  }

  _doSubmit() {
    if (this.isSubmitted) return;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = null;
    this.isSubmitted = true;

    const timeTaken = this.testStartTime ? Math.round((Date.now() - this.testStartTime) / 1000) : 0;

    // Calculate score
    let score = 0;
    const totalQ = this.currentTest.passages.reduce((sum, p) => sum + p.questions.length, 0);

    this.currentTest.passages.forEach(passage => {
      passage.questions.forEach(q => {
        const userAns = (this.userAnswers[q.number] || '').toString().toLowerCase().trim();
        const correctAns = (q.answer || '').toString().toLowerCase().trim();
        if (userAns === correctAns) score++;
      });
    });

    // Update navigator to show results
    this.currentTest.passages.forEach(passage => {
      passage.questions.forEach(q => {
        const userAns = (this.userAnswers[q.number] || '').toString().toLowerCase().trim();
        const correctAns = (q.answer || '').toString().toLowerCase().trim();
        const state = !this.userAnswers[q.number] ? 'unanswered' : (userAns === correctAns ? 'correct-nav' : 'wrong-nav');
        this._updateNavigatorBtn(q.number, state);
      });
    });

    // Save progress
    const testId = this.currentTest.test_id || 'test_1';
    this._saveTestProgress(testId, score, totalQ, timeTaken);

    // Show results
    this._showResults(score, totalQ, timeTaken);
  }

  _showResults(score, totalQ, timeTaken) {
    const band = this._scoreToBand(score, totalQ);
    const mins = Math.floor(timeTaken / 60);
    const secs = timeTaken % 60;
    const timeStr = `${mins} phút ${String(secs).padStart(2, '0')} giây`;

    document.getElementById('results-band-score').textContent = band;
    document.getElementById('results-summary-text').textContent = `Bạn đã trả lời đúng ${score}/${totalQ} câu hỏi. Thời gian làm bài: ${timeStr}.`;

    const title = document.getElementById('results-congrats-title');
    if (band >= 7) {
      title.textContent = '🎉 Xuất sắc! Kết quả tuyệt vời!';
    } else if (band >= 5.5) {
      title.textContent = '👏 Tốt lắm! Hãy tiếp tục luyện tập!';
    } else {
      title.textContent = '💪 Cố gắng lên! Ôn luyện thêm nhé!';
    }

    this._showView('results');
  }

  _scoreToBand(score, totalQ) {
    // IELTS Reading Academic band conversion table (approximate)
    const percentage = score / totalQ;
    if (percentage >= 0.925) return 9;
    if (percentage >= 0.875) return 8.5;
    if (percentage >= 0.825) return 8;
    if (percentage >= 0.775) return 7.5;
    if (percentage >= 0.700) return 7;
    if (percentage >= 0.625) return 6.5;
    if (percentage >= 0.550) return 6;
    if (percentage >= 0.475) return 5.5;
    if (percentage >= 0.400) return 5;
    if (percentage >= 0.325) return 4.5;
    if (percentage >= 0.250) return 4;
    return 3.5;
  }

  // ─── REVIEW MODE ─────────────────────────────────────────────────────
  enterReviewMode() {
    this.isReviewMode = true;
    this._showView('simulator');
    // Re-render current passage with explanations
    this.switchPassage(0);
    // Update passage tabs
    const btn = document.getElementById('btn-sim-submit');
    if (btn) {
      btn.textContent = '← Kết quả';
      btn.onclick = () => {
        this.isReviewMode = false;
        const totalQ = this.currentTest.passages.reduce((sum, p) => sum + p.questions.length, 0);
        let score = 0;
        this.currentTest.passages.forEach(passage => {
          passage.questions.forEach(q => {
            const ua = (this.userAnswers[q.number] || '').toString().toLowerCase().trim();
            const ca = (q.answer || '').toString().toLowerCase().trim();
            if (ua === ca) score++;
          });
        });
        this._showResults(score, totalQ, 0);
        btn.textContent = 'Nộp bài';
        btn.onclick = () => this.confirmSubmit();
      };
    }
  }

  // ─── FONT SIZE ───────────────────────────────────────────────────────
  adjustFontSize(delta) {
    this.fontSize = Math.max(0.8, Math.min(1.5, this.fontSize + delta * 0.1));
    const content = document.querySelector('.passage-content');
    if (content) content.style.fontSize = `${this.fontSize}em`;
  }
}

const reading = new ReadingModule();
