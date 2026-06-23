// EnglishFree - Listening Module

class ListeningModule {
  constructor() {
    this.currentLesson = null;
    this.isPlaying = false;
    this.activeSubTab = 'transcript'; // 'transcript' or 'quiz'
    this.quizGraded = false;
  }

  init() {
    this.renderLessonsSidebar();
    this.setupAudioListeners();
  }

  resetView() {
    this.pauseAudio();
    this.activeSubTab = 'transcript';
    this.quizGraded = false;
    document.getElementById('btn-tab-transcript').className = 'btn btn-primary';
    document.getElementById('btn-tab-quiz').className = 'btn btn-secondary';
    document.getElementById('listening-transcript-pane').style.display = 'block';
    document.getElementById('listening-quiz-pane').style.display = 'none';
  }

  renderLessonsSidebar() {
    const sidebar = document.getElementById('listening-lessons-list');
    sidebar.innerHTML = '<h3>Danh sách bài nghe</h3>';

    // Combine detailed LISTENING_DATA and LISTENING_INDEX index
    // To present a unified list
    const allLessons = [...LISTENING_DATA];
    
    // Add index entries if they aren't already in list
    LISTENING_INDEX.forEach(idxItem => {
      if (!allLessons.some(l => l.id === idxItem.id)) {
        allLessons.push({
          id: idxItem.id,
          title: idxItem.title,
          audioFile: idxItem.file,
          description: "Listen to the natural conversation and practice comprehension.",
          transcript: "Bản Script mẫu đang được cập nhật...",
          quiz: []
        });
      }
    });

    allLessons.forEach((lesson, index) => {
      const item = document.createElement('div');
      item.className = 'audio-item';
      item.id = `listening-item-${lesson.id}`;
      item.onclick = () => this.selectLesson(lesson);

      const status = app.progress.listeningCompleted.includes(lesson.id) 
        ? '<span style="color:var(--success-color); font-weight:700;">✓ Đã xong</span>' 
        : '<span style="color:var(--text-muted);">Chưa học</span>';

      item.innerHTML = `
        <div class="audio-item-title">${index + 1}. ${lesson.title}</div>
        <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-top:0.5rem;">
          <span>IELTS Cambridge</span>
          ${status}
        </div>
      `;

      sidebar.appendChild(item);
    });
  }

  selectLesson(lesson) {
    this.currentLesson = lesson;
    this.quizGraded = false;
    this.audioFinished = false;
    this.quizGradedSubmit = false;
    this.quizScore = 0;
    
    // Reset player elements
    this.pauseAudio();
    const audio = document.getElementById('main-audio-element');
    audio.src = lesson.audioFile;
    audio.load();

    // Highlights active item in list
    document.querySelectorAll('.audio-item').forEach(el => el.classList.remove('active'));
    const activeItem = document.getElementById(`listening-item-${lesson.id}`);
    if (activeItem) activeItem.classList.add('active');

    // Show workspace
    document.getElementById('listening-no-selection').style.display = 'none';
    document.getElementById('listening-main-content').style.display = 'flex';

    // Display title & metadata
    document.getElementById('listening-title').textContent = lesson.title;
    document.getElementById('listening-desc').textContent = lesson.description;

    // Render transcript
    this.renderTranscript();

    // Render Quiz Form
    this.renderQuiz();

    // Reset sub tabs
    this.switchSubTab('transcript');
  }

  setupAudioListeners() {
    const audio = document.getElementById('main-audio-element');
    const slider = document.getElementById('player-timeline-slider');
    const curTime = document.getElementById('player-time-current');
    const durTime = document.getElementById('player-time-duration');

    audio.addEventListener('timeupdate', () => {
      if (!isNaN(audio.duration)) {
        slider.value = audio.currentTime;
        curTime.textContent = this.formatTime(audio.currentTime);
      }
    });

    audio.addEventListener('loadedmetadata', () => {
      slider.max = audio.duration;
      durTime.textContent = this.formatTime(audio.duration);
    });

    audio.addEventListener('ended', () => {
      this.isPlaying = false;
      document.getElementById('player-btn-play').innerHTML = '<svg viewBox="0 0 24 24" id="play-svg"><path d="M8 5v14l11-7z"/></svg>';
      this.audioFinished = true;
      this.checkCompletionStatus();
    });
  }

  formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  togglePlay() {
    const audio = document.getElementById('main-audio-element');
    const btn = document.getElementById('player-btn-play');

    if (this.isPlaying) {
      this.pauseAudio();
    } else {
      audio.play().then(() => {
        this.isPlaying = true;
        btn.innerHTML = '<svg viewBox="0 0 24 24" id="pause-svg" style="width:20px;height:20px;fill:currentColor;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
      }).catch(e => {
        console.error("Audio playback error:", e);
        app.showToast('Không thể phát âm thanh. File âm thanh chưa sẵn sàng.', 'error');
      });
    }
  }

  pauseAudio() {
    const audio = document.getElementById('main-audio-element');
    const btn = document.getElementById('player-btn-play');
    if (audio) {
      audio.pause();
      this.isPlaying = false;
    }
    if (btn) {
      btn.innerHTML = '<svg viewBox="0 0 24 24" id="play-svg"><path d="M8 5v14l11-7z"/></svg>';
    }
  }

  skipSeconds(secs) {
    const audio = document.getElementById('main-audio-element');
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + secs));
  }

  seekAudio() {
    const audio = document.getElementById('main-audio-element');
    const slider = document.getElementById('player-timeline-slider');
    audio.currentTime = slider.value;
  }

  changeSpeed() {
    const audio = document.getElementById('main-audio-element');
    const speed = document.getElementById('player-speed-select').value;
    audio.defaultPlaybackRate = parseFloat(speed);
    audio.playbackRate = parseFloat(speed);
  }

  switchSubTab(tabName) {
    this.activeSubTab = tabName;
    const btnTranscript = document.getElementById('btn-tab-transcript');
    const btnQuiz = document.getElementById('btn-tab-quiz');

    if (tabName === 'transcript') {
      btnTranscript.className = 'btn btn-primary';
      btnQuiz.className = 'btn btn-secondary';
      document.getElementById('listening-transcript-pane').style.display = 'block';
      document.getElementById('listening-quiz-pane').style.display = 'none';
    } else {
      btnTranscript.className = 'btn btn-secondary';
      btnQuiz.className = 'btn btn-primary';
      document.getElementById('listening-transcript-pane').style.display = 'none';
      document.getElementById('listening-quiz-pane').style.display = 'block';
    }
  }

  renderTranscript() {
    const pane = document.getElementById('listening-transcript-content');
    pane.innerHTML = '';

    const lines = this.currentLesson.transcript.split('\n');
    lines.forEach(line => {
      if (!line.trim()) return;

      const lineDiv = document.createElement('div');
      lineDiv.className = 'speaker-line';

      // Parse Speaker name (e.g. Todd:)
      const match = line.match(/^([A-Za-z]+):(.*)/);
      if (match) {
        const speaker = match[1];
        const text = match[2];

        // Highlight certain academic words dynamically for learning
        const words = text.split(' ');
        const processedWords = words.map(w => {
          const cleanW = w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").toLowerCase().trim();
          // Match with VOCABULARY_DATA to add hover translations
          const found = VOCABULARY_DATA.find(vocabObj => vocabObj.word.toLowerCase() === cleanW);
          if (found) {
            return `<span class="highlight-word" title="${found.translation} (${found.ipa})">${w}</span>`;
          }
          return w;
        });

        lineDiv.innerHTML = `<span class="speaker-name">${speaker}:</span> ${processedWords.join(' ')}`;
      } else {
        lineDiv.textContent = line;
      }

      pane.appendChild(lineDiv);
    });

    // Restore saved dictionary annotations
    if (typeof vocabDictionary !== 'undefined') {
      vocabDictionary.applySavedAnnotations('listening-transcript-content', 'listening_' + this.currentLesson.id);
    }
  }

  toggleTranscriptWords() {
    const highlights = document.querySelectorAll('.highlight-word');
    highlights.forEach(el => {
      el.classList.toggle('highlight-disabled');
      if (el.classList.contains('highlight-disabled')) {
        el.style.backgroundColor = 'transparent';
        el.style.borderBottom = 'none';
        el.style.cursor = 'default';
      } else {
        el.style.backgroundColor = 'rgba(99, 102, 241, 0.15)';
        el.style.borderBottom = '2px solid var(--primary-color)';
        el.style.cursor = 'help';
      }
    });
  }

  renderQuiz() {
    const container = document.getElementById('listening-quiz-list');
    container.innerHTML = '';

    const quizList = this.currentLesson.quiz;
    
    if (!quizList || quizList.length === 0) {
      container.innerHTML = '<p style="text-align:center; padding: 2rem;">Bài tập trắc nghiệm đang được cập nhật cho bài nghe này. Hãy nghe và theo dõi transcript ở tab bên cạnh nhé!</p>';
      document.getElementById('btn-submit-listening-quiz').style.display = 'none';
      return;
    }

    document.getElementById('btn-submit-listening-quiz').style.display = 'block';

    quizList.forEach((q, idx) => {
      const qDiv = document.createElement('div');
      qDiv.className = 'quiz-question-item';
      qDiv.style.borderBottom = '1px solid var(--border-color)';
      qDiv.style.paddingBottom = '1.5rem';
      
      const title = document.createElement('h4');
      title.style.marginBottom = '0.75rem';
      title.textContent = `Câu ${idx + 1}: ${q.question}`;
      qDiv.appendChild(title);

      if (q.type === 'multiple') {
        const optsDiv = document.createElement('div');
        optsDiv.style.display = 'flex';
        optsDiv.style.flexDirection = 'column';
        optsDiv.style.gap = '0.5rem';

        q.options.forEach((opt, oIdx) => {
          const label = document.createElement('label');
          label.style.display = 'flex';
          label.style.alignItems = 'center';
          label.style.gap = '0.5rem';
          label.style.cursor = 'pointer';
          label.id = `lbl-q-${q.id}-opt-${oIdx}`;
          
          const radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = `quiz-q-${q.id}`;
          radio.value = oIdx;
          radio.style.accentColor = 'var(--primary-color)';
          
          label.appendChild(radio);
          label.appendChild(document.createTextNode(opt));
          optsDiv.appendChild(label);
        });
        qDiv.appendChild(optsDiv);
      } else {
        // Gap fill
        const inputDiv = document.createElement('div');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'input-field';
        input.style.width = '100%';
        input.placeholder = 'Nhập đáp án của bạn (ví dụ: teachers)';
        input.id = `input-q-${q.id}`;
        
        inputDiv.appendChild(input);
        qDiv.appendChild(inputDiv);
      }

      container.appendChild(qDiv);
    });
  }

  gradeQuiz() {
    if (this.quizGraded) {
      alert("Bạn đã nộp bài rồi! Hãy chọn bài nghe khác hoặc làm lại.");
      return;
    }

    const quizList = this.currentLesson.quiz;
    let score = 0;

    quizList.forEach(q => {
      if (q.type === 'multiple') {
        const radios = document.getElementsByName(`quiz-q-${q.id}`);
        let selectedValue = -1;
        radios.forEach(r => {
          if (r.checked) selectedValue = parseInt(r.value);
          // disable interaction
          r.disabled = true;
        });

        // Highlight correct option label
        const correctLabel = document.getElementById(`lbl-q-${q.id}-opt-${q.answer}`);
        if (correctLabel) {
          correctLabel.style.color = 'var(--success-color)';
          correctLabel.style.fontWeight = '700';
        }

        if (selectedValue === q.answer) {
          score++;
        } else if (selectedValue !== -1) {
          const wrongLabel = document.getElementById(`lbl-q-${q.id}-opt-${selectedValue}`);
          if (wrongLabel) {
            wrongLabel.style.color = 'var(--danger-color)';
          }
        }
      } else {
        const input = document.getElementById(`input-q-${q.id}`);
        const userAns = input.value.trim().toLowerCase();
        const correctAns = q.answer.toLowerCase();
        
        input.disabled = true;

        if (userAns === correctAns) {
          score++;
          input.style.borderColor = 'var(--success-color)';
          input.style.backgroundColor = 'var(--success-light)';
        } else {
          input.style.borderColor = 'var(--danger-color)';
          input.style.backgroundColor = 'var(--danger-light)';
          // Show correct answer next to it
          const hint = document.createElement('span');
          hint.style.color = 'var(--success-color)';
          hint.style.marginLeft = '1rem';
          hint.style.fontWeight = '700';
          hint.textContent = `(Đáp án đúng: ${q.answer})`;
          input.parentNode.appendChild(hint);
        }
      }
    });

    this.quizGraded = true;
    this.quizScore = score;
    this.quizGradedSubmit = true;
    
    app.showToast(`Bạn trả lời đúng ${score}/10 câu hỏi!`, score >= 7 ? 'success' : 'info');
    this.checkCompletionStatus();
  }

  checkCompletionStatus() {
    if (!this.currentLesson) return;
    
    // Skip if already marked completed
    if (app.progress.listeningCompleted.includes(this.currentLesson.id)) {
      return;
    }

    if (this.audioFinished && this.quizGradedSubmit) {
      if (this.quizScore >= 7) {
        app.saveProgress('listening', this.currentLesson.id);
        this.renderLessonsSidebar();
        app.showToast('Chúc mừng bạn đã hoàn thành bài nghe này (đã nghe hết và đạt kết quả)!', 'success');
      } else {
        app.showToast('Bạn đã nghe xong, nhưng cần đạt ít nhất 7/10 câu trả lời đúng để hoàn thành bài học.', 'info');
      }
    } else if (this.quizGradedSubmit && this.quizScore >= 7 && !this.audioFinished) {
      app.showToast('Bài tập đạt yêu cầu! Hãy nghe hết file âm thanh để chính thức hoàn thành bài nghe.', 'info');
    } else if (this.audioFinished && !this.quizGradedSubmit) {
      app.showToast('Đã nghe hết file âm thanh! Hãy làm và nộp bài kiểm tra đạt từ 7/10 điểm trở lên để hoàn thành.', 'info');
    }
  }
}

const listening = new ListeningModule();
exportDataList = listening;
