// EnglishFree - Reading & Shadowing Module

class ReadingModule {
  constructor() {
    this.currentStory = null;
    this.selectedSentenceIndex = -1;
    this.isRecording = false;
    this.activeSubTab = 'read'; // 'read', 'shadow', or 'quiz'
    this.recognition = null;
    this.userAudioUrl = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.quizGraded = false;
  }

  init() {
    this.renderStoriesSidebar();
    this.initSpeechRecognition();
  }

  resetView() {
    this.selectedSentenceIndex = -1;
    this.isRecording = false;
    this.activeSubTab = 'read';
    this.quizGraded = false;
    document.getElementById('btn-reading-tab-read').className = 'btn btn-primary';
    document.getElementById('btn-reading-tab-shadow').className = 'btn btn-secondary';
    document.getElementById('btn-reading-tab-quiz').className = 'btn btn-secondary';
    document.getElementById('reading-read-pane').style.display = 'block';
    document.getElementById('reading-shadow-pane').style.display = 'none';
    document.getElementById('reading-quiz-pane').style.display = 'none';
  }

  renderStoriesSidebar() {
    const sidebar = document.getElementById('reading-stories-list');
    sidebar.innerHTML = '<h3>Danh sách bài đọc</h3>';

    READING_DATA.forEach((story, index) => {
      const item = document.createElement('div');
      item.className = 'story-item';
      item.id = `reading-item-${story.id}`;
      item.onclick = () => this.selectStory(story);

      const status = app.progress.readingCompleted.includes(story.id)
        ? '<span style="color:var(--success-color); font-weight:700;">✓ Đã xong</span>'
        : '<span style="color:var(--text-muted);">Chưa học</span>';

      item.innerHTML = `
        <div class="audio-item-title">${index + 1}. ${story.title}</div>
        <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-top:0.5rem;">
          <span>${story.topic}</span>
          ${status}
        </div>
      `;
      sidebar.appendChild(item);
    });
  }

  selectStory(story) {
    this.currentStory = story;
    this.selectedSentenceIndex = -1;
    this.quizGraded = false;

    // Highlights active item
    document.querySelectorAll('.story-item').forEach(el => el.classList.remove('active'));
    const activeItem = document.getElementById(`reading-item-${story.id}`);
    if (activeItem) activeItem.classList.add('active');

    // UI elements update
    document.getElementById('reading-no-selection').style.display = 'none';
    document.getElementById('reading-main-content').style.display = 'flex';
    document.getElementById('reading-title').textContent = `${story.topic}: ${story.title}`;

    // Render full English text for reading
    document.getElementById('reading-read-pane').innerHTML = `<p style="white-space: pre-wrap;">${story.englishText}</p>`;

    // Render sentences for clicking
    this.renderSentences();

    // Reset controls
    document.getElementById('shadow-selected-status').textContent = "Chọn một câu tiếng Anh ở trên để tập nói.";
    document.getElementById('shadow-score-display').innerHTML = '';
    document.getElementById('shadow-feedback-pane').style.display = 'none';
    document.getElementById('btn-shadow-playback').style.display = 'none';

    // Render Quiz questions
    this.renderQuiz();

    // Restore saved dictionary annotations
    if (typeof vocabDictionary !== 'undefined') {
      vocabDictionary.applySavedAnnotations('reading-read-pane', 'reading_' + story.id);
      vocabDictionary.applySavedAnnotations('reading-sentences-container', 'reading_' + story.id);
    }

    this.switchSubTab('read');
  }

  renderSentences() {
    const container = document.getElementById('reading-sentences-container');
    container.innerHTML = '';

    this.currentStory.shadowingSentences.forEach((sentence, idx) => {
      const div = document.createElement('div');
      div.className = 'sentence-shadow-item';
      div.id = `sentence-item-${idx}`;
      div.onclick = () => this.selectSentence(idx);

      div.innerHTML = `
        <span style="font-size:1.1rem; font-weight:500;">${sentence}</span>
        <button class="btn btn-secondary btn-icon" style="width:30px; height:30px;" onclick="event.stopPropagation(); reading.speakSentenceText('${sentence.replace(/'/g, "\\'")}')">
          <svg viewBox="0 0 24 24" style="width:16px; height:16px;"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
        </button>
      `;

      container.appendChild(div);
    });
  }

  selectSentence(index) {
    this.selectedSentenceIndex = index;
    
    // Highlight UI
    document.querySelectorAll('.sentence-shadow-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`sentence-item-${index}`).classList.add('active');

    // Update Shadow panel text
    const text = this.currentStory.shadowingSentences[index];
    document.getElementById('shadow-selected-status').innerHTML = `Đang chọn câu ${index + 1}: <br><strong style="color:var(--text-color);">${text}</strong>`;
    
    // Clear feedback
    document.getElementById('shadow-score-display').innerHTML = '';
    document.getElementById('shadow-feedback-pane').style.display = 'none';
    document.getElementById('btn-shadow-playback').style.display = 'none';
  }

  speakSentenceText(text) {
    app.speak(text, 0.88);
  }

  speakSelectedSentence() {
    if (this.selectedSentenceIndex === -1) {
      alert("Vui lòng chọn một câu tiếng Anh trước!");
      return;
    }
    const text = this.currentStory.shadowingSentences[this.selectedSentenceIndex];
    this.speakSentenceText(text);
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'en-US';
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isRecording = true;
        document.getElementById('btn-shadow-record').textContent = '⏹️ Đang ghi âm...';
        document.getElementById('btn-shadow-record').style.backgroundColor = 'var(--danger-color)';
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        document.getElementById('btn-shadow-record').textContent = '🎙️ Bắt đầu nói';
        document.getElementById('btn-shadow-record').style.backgroundColor = '';
      };

      this.recognition.onresult = (event) => {
        const resultText = event.results[0][0].transcript;
        this.analyzePronunciation(resultText);
      };

      this.recognition.onerror = (e) => {
        console.error("Speech recognition error", e);
        this.isRecording = false;
        document.getElementById('btn-shadow-record').textContent = '🎙️ Bắt đầu nói';
        app.showToast('Không nhận dạng được giọng nói. Hãy nói rõ ràng hơn hoặc sử dụng trình duyệt Chrome/Safari.', 'error');
      };
    } else {
      console.warn("Web SpeechRecognition not supported in this browser.");
    }
  }

  toggleRecording() {
    if (this.selectedSentenceIndex === -1) {
      alert("Vui lòng chọn một câu tiếng Anh để ghi âm shadowing!");
      return;
    }

    if (this.isRecording) {
      this.stopSpeechRecognition();
    } else {
      this.startSpeechRecognition();
    }
  }

  startSpeechRecognition() {
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {
        console.error("Recognition start failed", e);
      }
    } else {
      // Audio Recording fallback if SpeechRecognition API is unavailable
      this.startAudioRecordingFallback();
    }
  }

  stopSpeechRecognition() {
    if (this.recognition) {
      this.recognition.stop();
    } else if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }
  }

  // Fallback voice recorder
  startAudioRecordingFallback() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(stream);
      
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        this.userAudioUrl = URL.createObjectURL(blob);
        document.getElementById('btn-shadow-playback').style.display = 'inline-flex';
        app.showToast('Đã lưu ghi âm! Hãy bấm nút Nghe lại để đối chiếu.', 'success');
        
        this.isRecording = false;
        document.getElementById('btn-shadow-record').textContent = '🎙️ Bắt đầu nói';
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      document.getElementById('btn-shadow-record').textContent = '⏹️ Đang ghi âm...';
    }).catch(err => {
      console.error("Microphone access error:", err);
      app.showToast('Không truy cập được Micro. Vui lòng cấp quyền micro cho trình duyệt.', 'error');
    });
  }

  playbackVoice() {
    if (this.userAudioUrl) {
      const audioObj = new Audio(this.userAudioUrl);
      audioObj.play();
    }
  }

  analyzePronunciation(spokenText) {
    const targetText = this.currentStory.shadowingSentences[this.selectedSentenceIndex];
    
    // Normalize texts (lowercase, remove punctuation)
    const normalize = (t) => t.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim().split(/\s+/);
    
    const targetWords = normalize(targetText);
    const spokenWords = normalize(spokenText);

    let matchCount = 0;
    const feedbackHtml = targetWords.map(tWord => {
      const foundIdx = spokenWords.indexOf(tWord);
      if (foundIdx !== -1) {
        matchCount++;
        // Remove it so it doesn't match double words twice
        spokenWords.splice(foundIdx, 1);
        return `<span class="feedback-word correct">${tWord}</span>`;
      }
      return `<span class="feedback-word incorrect">${tWord}</span>`;
    });

    const scorePct = Math.round((matchCount / targetWords.length) * 100);

    // Render results
    let scoreColor = "var(--danger-color)";
    let rating = "Chưa đạt";
    if (scorePct >= 80) {
      scoreColor = "var(--success-color)";
      rating = "Xuất sắc!";
    } else if (scorePct >= 50) {
      scoreColor = "var(--warning-color)";
      rating = "Khá tốt";
    }

    document.getElementById('shadow-score-display').innerHTML = `
      <span>Điểm phát âm:</span>
      <span style="color:${scoreColor}; font-size:1.4rem;">${scorePct}%</span>
      <span style="font-size:0.9rem; color:var(--text-muted);">(${rating})</span>
    `;

    document.getElementById('shadow-feedback-pane').style.display = 'block';
    document.getElementById('shadow-feedback-words').innerHTML = feedbackHtml.join(' ') + `<br><p style="font-size:0.9rem; margin-top:0.5rem; color:var(--text-muted);">Bạn đã nói: "${spokenText}"</p>`;
  }

  switchSubTab(tabName) {
    this.activeSubTab = tabName;
    const btnRead = document.getElementById('btn-reading-tab-read');
    const btnShadow = document.getElementById('btn-reading-tab-shadow');
    const btnQuiz = document.getElementById('btn-reading-tab-quiz');

    // Reset styles
    btnRead.className = 'btn btn-secondary';
    btnShadow.className = 'btn btn-secondary';
    btnQuiz.className = 'btn btn-secondary';

    // Hide all panes
    document.getElementById('reading-read-pane').style.display = 'none';
    document.getElementById('reading-shadow-pane').style.display = 'none';
    document.getElementById('reading-quiz-pane').style.display = 'none';

    if (tabName === 'read') {
      btnRead.className = 'btn btn-primary';
      document.getElementById('reading-read-pane').style.display = 'block';
    } else if (tabName === 'shadow') {
      btnShadow.className = 'btn btn-primary';
      document.getElementById('reading-shadow-pane').style.display = 'flex';
    } else if (tabName === 'quiz') {
      btnQuiz.className = 'btn btn-primary';
      document.getElementById('reading-quiz-pane').style.display = 'block';
    }
  }

  renderQuiz() {
    const list = document.getElementById('reading-quiz-questions-list');
    list.innerHTML = '';

    const quiz = this.currentStory.quiz;
    if (!quiz || quiz.length === 0) {
      list.innerHTML = '<p style="text-align:center;">Trắc nghiệm đọc hiểu đang được cập nhật...</p>';
      return;
    }

    quiz.forEach((q, idx) => {
      const qItem = document.createElement('div');
      qItem.className = 'quiz-question-item';

      const title = document.createElement('h4');
      title.style.marginBottom = '0.75rem';
      title.textContent = `Câu ${idx + 1}: ${q.question}`;
      qItem.appendChild(title);

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
        label.id = `lbl-read-q-${idx}-opt-${oIdx}`;

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `reading-q-${idx}`;
        radio.value = oIdx;
        radio.style.accentColor = 'var(--primary-color)';

        label.appendChild(radio);
        label.appendChild(document.createTextNode(opt));
        optsDiv.appendChild(label);
      });

      qItem.appendChild(optsDiv);
      list.appendChild(qItem);
    });
  }

  gradeQuiz() {
    if (this.quizGraded) {
      alert("Bạn đã nộp bài rồi!");
      return;
    }

    const quiz = this.currentStory.quiz;
    let score = 0;

    quiz.forEach((q, idx) => {
      const radios = document.getElementsByName(`reading-q-${idx}`);
      let selectedValue = -1;
      radios.forEach(r => {
        if (r.checked) selectedValue = parseInt(r.value);
        r.disabled = true;
      });

      // Show correct option in green
      const correctLabel = document.getElementById(`lbl-read-q-${idx}-opt-${q.answer}`);
      if (correctLabel) {
        correctLabel.style.color = 'var(--success-color)';
        correctLabel.style.fontWeight = '700';
      }

      if (selectedValue === q.answer) {
        score++;
      } else if (selectedValue !== -1) {
        const wrongLabel = document.getElementById(`lbl-read-q-${idx}-opt-${selectedValue}`);
        if (wrongLabel) {
          wrongLabel.style.color = 'var(--danger-color)';
        }
      }
    });

    this.quizGraded = true;
    app.showToast(`Bạn trả lời đúng ${score}/${quiz.length} câu hỏi!`, score === quiz.length ? 'success' : 'info');

    // Save progress if score is 100% correct
    if (score === quiz.length) {
      app.saveProgress('reading', this.currentStory.id);
      this.renderStoriesSidebar();
    }
  }
}

const reading = new ReadingModule();
