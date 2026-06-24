// EnglishFree - Listening Module with Ello and IELTS sub-categories and multi-voice, rhythmic TTS engine
class ListeningModule {
  constructor() {
    this.currentLesson = null;
    this.isPlaying = false;
    this.activeSubTab = 'transcript'; // 'transcript' or 'quiz'
    this.quizGraded = false;
    
    // Categorization
    this.currentCategory = 'ello'; // 'ello' or 'ielts'
    
    // TTS engine parameters
    this.ttsUtterance = null;
    this.ttsInterval = null;
    this.ttsDelayTimeout = null;
    
    this.ttsLines = [];
    this.ttsTotalChars = 0;
    this.ttsCurrentLineIndex = 0;
    this.ttsCurrentTime = 0;
    this.ttsDuration = 0;
    
    this.audioFinished = false;
    this.quizGradedSubmit = false;
    this.quizScore = 0;
  }

  init() {
    this.switchCategory('ello');
    this.setupAudioListeners();
    
    // Warm up speech synthesis voices list
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        const oldHandler = window.speechSynthesis.onvoiceschanged;
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
          if (oldHandler) oldHandler();
        };
      }
    }
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

  switchCategory(category) {
    this.currentCategory = category;
    this.pauseAudio();
    
    const btnEllo = document.getElementById('btn-list-cat-ello');
    const btnIelts = document.getElementById('btn-list-cat-ielts');
    
    if (category === 'ello') {
      if (btnEllo) btnEllo.className = 'btn btn-primary';
      if (btnIelts) btnIelts.className = 'btn btn-secondary';
    } else {
      if (btnEllo) btnEllo.className = 'btn btn-secondary';
      if (btnIelts) btnIelts.className = 'btn btn-primary';
    }
    
    this.renderLessonsSidebar();
    
    // Reset workspace view on category switch
    document.getElementById('listening-no-selection').style.display = 'block';
    document.getElementById('listening-main-content').style.display = 'none';
    this.currentLesson = null;
  }

  renderLessonsSidebar() {
    const sidebar = document.getElementById('listening-lessons-list');
    sidebar.innerHTML = '';

    // Filter lessons by category
    const filteredLessons = LISTENING_DATA.filter(l => (l.category || 'ello') === this.currentCategory);

    filteredLessons.forEach((lesson, index) => {
      const item = document.createElement('div');
      item.className = 'audio-item';
      item.id = `listening-item-${lesson.id}`;
      item.onclick = () => this.selectLesson(lesson);

      const status = app.progress.listeningCompleted.includes(lesson.id) 
        ? '<span style="color:var(--success-color); font-weight:700;">✓ Đã xong</span>' 
        : '<span style="color:var(--text-muted);">Chưa học</span>';

      const typeLabel = this.currentCategory === 'ello' ? 'Ello Listening' : 'IELTS Practice';

      item.innerHTML = `
        <div class="audio-item-title">${index + 1}. ${lesson.title}</div>
        <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-top:0.5rem;">
          <span>${typeLabel}</span>
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
    
    // Reset player elements & cancel ongoing speech synthesis
    this.pauseAudio();
    
    const audio = document.getElementById('main-audio-element');
    const slider = document.getElementById('player-timeline-slider');
    const curTime = document.getElementById('player-time-current');
    const durTime = document.getElementById('player-time-duration');
    
    if (lesson.audioFile.startsWith('TTS_')) {
      // Parse transcript into dialogue turns
      this.ttsLines = [];
      let totalChars = 0;
      const rawLines = lesson.transcript.split('\n');
      rawLines.forEach(line => {
        if (!line.trim()) return;
        const match = line.match(/^([A-Za-z\s]+):(.*)/);
        if (match) {
          const speaker = match[1].trim();
          const text = match[2].trim();
          this.ttsLines.push({ speaker, text, charOffset: totalChars });
          totalChars += text.length;
        } else {
          this.ttsLines.push({ speaker: "", text: line.trim(), charOffset: totalChars });
          totalChars += line.trim().length;
        }
      });
      this.ttsTotalChars = totalChars;
      this.ttsCurrentLineIndex = 0;

      // Setup TTS simulated timings
      const wordsCount = lesson.transcript.split(/\s+/).length;
      const speedVal = parseFloat(document.getElementById('player-speed-select').value) || 1.0;
      
      this.ttsCurrentTime = 0;
      this.ttsDuration = Math.round(wordsCount / (2.2 * speedVal));
      
      slider.max = this.ttsDuration;
      slider.value = 0;
      curTime.textContent = "00:00";
      durTime.textContent = this.formatTime(this.ttsDuration);
      audio.src = '';
    } else {
      audio.src = lesson.audioFile;
      audio.load();
    }

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
      if (this.currentLesson && !this.currentLesson.audioFile.startsWith('TTS_')) {
        if (!isNaN(audio.duration)) {
          slider.value = audio.currentTime;
          curTime.textContent = this.formatTime(audio.currentTime);
        }
      }
    });

    audio.addEventListener('loadedmetadata', () => {
      if (this.currentLesson && !this.currentLesson.audioFile.startsWith('TTS_')) {
        slider.max = audio.duration;
        durTime.textContent = this.formatTime(audio.duration);
      }
    });

    audio.addEventListener('ended', () => {
      if (this.currentLesson && !this.currentLesson.audioFile.startsWith('TTS_')) {
        this.isPlaying = false;
        document.getElementById('player-btn-play').innerHTML = '<svg viewBox="0 0 24 24" id="play-svg"><path d="M8 5v14l11-7z"/></svg>';
        this.audioFinished = true;
        this.checkCompletionStatus();
      }
    });
  }

  formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  getSpeakerVoice(speaker) {
    const voices = window.speechSynthesis.getVoices();
    const enVoices = voices.filter(v => v.lang.startsWith('en') || v.lang.startsWith('en-'));
    if (enVoices.length === 0) return null;
    
    // Determine target gender for this speaker
    let targetGender = 'female'; // default
    const speakerLower = speaker.toLowerCase().trim();
    
    if (this.currentLesson) {
      if (this.currentLesson.id === 'ielts_001') {
        if (speakerLower === 'customer') targetGender = 'male';
        else targetGender = 'female';
      } else if (this.currentLesson.id === 'ielts_002') {
        if (speakerLower === 'customer') targetGender = 'female';
        else targetGender = 'male';
      } else if (this.currentLesson.id === 'ielts_003') {
        if (speakerLower === 'customer') targetGender = 'male';
        else targetGender = 'female';
      } else if (this.currentLesson.id === 'ielts_004') {
        targetGender = app.voiceGender;
      } else {
        // Fallback for general speakers by name if applicable
        const maleNames = ['todd', 'jim', 'al', 'mark', 'david', 'daniel', 'alex', 'rishi', 'james', 'albert', 'aman', 'eddy', 'fred', 'grandpa', 'ralph', 'reed', 'rocko', 'george', 'ravi', 'tom', 'ollie', 'harry', 'nathan', 'sam', 'evan', 'victor', 'charles', 'andrew', 'robert', 'john', 'william', 'richard', 'thomas', 'jeffrey', 'steve', 'peter', 'paul', 'brian', 'kevin', 'michael', 'jason', 'ian', 'oliver', 'jack', 'charlie', 'noah', 'jacob', 'leo', 'oscar', 'simon'];
        const femaleNames = ['jeannie', 'kate', 'rina', 'akane', 'barbara', 'naomi', 'ruth', 'eucharia', 'samantha', 'zira', 'karen', 'moira', 'tessa', 'veena', 'siri', 'hazel', 'flo', 'grandma', 'kathy', 'sandy', 'shelley', 'tara', 'susan', 'heera', 'fiona', 'victoria', 'claire', 'laura', 'alice', 'anna', 'melina', 'serena', 'zoe', 'luciana', 'helena', 'joana', 'lisa', 'tracey', 'stephanie', 'linda', 'mary', 'katherine', 'cathy', 'jessica', 'emily', 'charlotte', 'elizabeth', 'sophie', 'chloe', 'sara', 'sarah', 'amy'];
        
        if (maleNames.some(name => speakerLower.includes(name))) {
          targetGender = 'male';
        } else if (femaleNames.some(name => speakerLower.includes(name))) {
          targetGender = 'female';
        } else {
          targetGender = app.voiceGender;
        }
      }
    }

    // Helper to determine gender of a SpeechSynthesisVoice
    const getVoiceGender = (v) => {
      const name = v.name.toLowerCase();
      
      // Explicit indicators
      if (name.includes('female')) return 'female';
      if (name.includes('male')) return 'male';
      
      // Female names/keywords
      const femaleNames = [
        'samantha', 'zira', 'karen', 'moira', 'tessa', 'veena', 'siri', 'hazel', 
        'flo', 'grandma', 'kathy', 'sandy', 'shelley', 'tara', 'susan', 'heera', 
        'fiona', 'victoria', 'claire', 'laura', 'alice', 'anna', 'melina', 'serena', 
        'zoe', 'luciana', 'helena', 'joana', 'lisa', 'tracey', 'stephanie', 'linda', 
        'mary', 'katherine', 'cathy', 'jessica', 'emily', 'charlotte', 'elizabeth', 
        'sophie', 'chloe', 'sara', 'sarah', 'amy'
      ];
      
      // Male names/keywords
      const maleNames = [
        'david', 'mark', 'alex', 'daniel', 'rishi', 'james', 'albert', 'aman', 
        'eddy', 'fred', 'grandpa', 'ralph', 'reed', 'rocko', 'george', 'ravi', 
        'tom', 'ollie', 'harry', 'nathan', 'sam', 'evan', 'victor', 'charles', 
        'andrew', 'robert', 'john', 'william', 'richard', 'thomas', 'jeffrey', 
        'steve', 'peter', 'paul', 'brian', 'kevin', 'michael', 'jason', 'ian', 
        'oliver', 'jack', 'charlie', 'noah', 'jacob', 'leo', 'oscar', 'simon', 
        'todd', 'reky', 'al'
      ];
      
      if (femaleNames.some(fName => name.includes(fName))) return 'female';
      if (maleNames.some(mName => name.includes(mName))) return 'male';
      
      return 'unknown';
    };

    // Partition English voices strictly by gender
    const femaleVoices = enVoices.filter(v => getVoiceGender(v) === 'female');
    const maleVoices = enVoices.filter(v => getVoiceGender(v) === 'male');
    const unknownVoices = enVoices.filter(v => getVoiceGender(v) === 'unknown');

    // Score voice quality/origin within the matches
    const scoreVoice = (v) => {
      let score = 0;
      const name = v.name.toLowerCase();
      
      if (name.includes('natural')) score += 100;
      if (name.includes('google')) score += 80;
      if (name.includes('siri')) score += 70;
      if (name.includes('enhanced')) score += 50;
      if (name.includes('premium')) score += 40;
      
      // Prefer standard region accents
      if (v.lang === 'en-US' || v.lang === 'en-GB') score += 20;
      return score;
    };

    let selectedVoice = null;
    
    if (targetGender === 'male') {
      if (maleVoices.length > 0) {
        maleVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a));
        selectedVoice = maleVoices[0];
      } else if (unknownVoices.length > 0) {
        unknownVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a));
        selectedVoice = unknownVoices[0];
      }
    } else {
      // targetGender === 'female'
      if (femaleVoices.length > 0) {
        femaleVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a));
        selectedVoice = femaleVoices[0];
      } else if (unknownVoices.length > 0) {
        unknownVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a));
        selectedVoice = unknownVoices[0];
      }
    }

    // Ultimate fallback if no matches in target lists
    if (!selectedVoice) {
      enVoices.sort((a, b) => {
        const genderScoreA = getVoiceGender(a) === targetGender ? 50 : 0;
        const genderScoreB = getVoiceGender(b) === targetGender ? 50 : 0;
        return (scoreVoice(b) + genderScoreB) - (scoreVoice(a) + genderScoreA);
      });
      selectedVoice = enVoices[0];
    }
    
    return selectedVoice;
  }

  togglePlay() {
    if (!this.currentLesson) return;
    
    const audio = document.getElementById('main-audio-element');
    const btn = document.getElementById('player-btn-play');

    if (this.currentLesson.audioFile.startsWith('TTS_')) {
      if (this.isPlaying) {
        this.pauseAudio();
      } else {
        this.isPlaying = true;
        btn.innerHTML = '<svg viewBox="0 0 24 24" id="pause-svg" style="width:20px;height:20px;fill:currentColor;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
        this.startTtsTimer();
        this.speakTtsLine();
      }
    } else {
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
  }

  speakTtsLine() {
    if (!this.isPlaying) return;
    
    // Check if we reached the end of the script
    if (this.ttsCurrentLineIndex >= this.ttsLines.length) {
      this.isPlaying = false;
      this.audioFinished = true;
      clearInterval(this.ttsInterval);
      document.getElementById('player-btn-play').innerHTML = '<svg viewBox="0 0 24 24" id="play-svg"><path d="M8 5v14l11-7z"/></svg>';
      document.getElementById('player-timeline-slider').value = this.ttsDuration;
      document.getElementById('player-time-current').textContent = this.formatTime(this.ttsDuration);
      this.checkCompletionStatus();
      return;
    }
    
    const currentLine = this.ttsLines[this.ttsCurrentLineIndex];
    const speedVal = parseFloat(document.getElementById('player-speed-select').value) || 1.0;
    
    this.ttsUtterance = new SpeechSynthesisUtterance(currentLine.text);
    this.ttsUtterance.lang = 'en-US';
    this.ttsUtterance.rate = speedVal;
    
    // Choose appropriate voice
    const voice = this.getSpeakerVoice(currentLine.speaker);
    if (voice) {
      this.ttsUtterance.voice = voice;
    }
    
    this.ttsUtterance.onend = () => {
      if (this.isPlaying) {
        this.ttsCurrentLineIndex++;
        // Natural pause between speakers (900ms / speedVal)
        const pauseDuration = 900 / speedVal;
        this.ttsDelayTimeout = setTimeout(() => {
          this.speakTtsLine();
        }, pauseDuration);
      }
    };
    
    this.ttsUtterance.onerror = (e) => {
      console.warn("SpeechSynthesis line stopped/cancelled.");
    };
    
    window.speechSynthesis.speak(this.ttsUtterance);
  }

  startTtsTimer() {
    clearInterval(this.ttsInterval);
    this.ttsInterval = setInterval(() => {
      if (this.isPlaying && !window.speechSynthesis.paused) {
        this.ttsCurrentTime += 1;
        if (this.ttsCurrentTime > this.ttsDuration) {
          this.ttsCurrentTime = this.ttsDuration;
        }
        document.getElementById('player-timeline-slider').value = this.ttsCurrentTime;
        document.getElementById('player-time-current').textContent = this.formatTime(this.ttsCurrentTime);
      }
    }, 1000);
  }

  pauseAudio() {
    clearInterval(this.ttsInterval);
    clearTimeout(this.ttsDelayTimeout);
    
    if (this.currentLesson && this.currentLesson.audioFile.startsWith('TTS_')) {
      this.isPlaying = false;
      window.speechSynthesis.cancel();
    } else {
      const audio = document.getElementById('main-audio-element');
      if (audio) {
        audio.pause();
        this.isPlaying = false;
      }
    }
    
    const btn = document.getElementById('player-btn-play');
    if (btn) {
      btn.innerHTML = '<svg viewBox="0 0 24 24" id="play-svg"><path d="M8 5v14l11-7z"/></svg>';
    }
  }

  skipSeconds(secs) {
    if (this.currentLesson && this.currentLesson.audioFile.startsWith('TTS_')) {
      const targetTime = Math.max(0, Math.min(this.ttsDuration || 0, this.ttsCurrentTime + secs));
      document.getElementById('player-timeline-slider').value = targetTime;
      this.seekAudio();
    } else {
      const audio = document.getElementById('main-audio-element');
      audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + secs));
    }
  }

  seekAudio() {
    const slider = document.getElementById('player-timeline-slider');
    
    if (this.currentLesson && this.currentLesson.audioFile.startsWith('TTS_')) {
      const val = parseFloat(slider.value);
      this.ttsCurrentTime = val;
      document.getElementById('player-time-current').textContent = this.formatTime(val);
      
      // Calculate target character offset based on seek time
      const ratio = val / (this.ttsDuration || 1);
      const targetChar = ratio * this.ttsTotalChars;
      
      // Find matching line index
      let lineIndex = 0;
      for (let i = 0; i < this.ttsLines.length; i++) {
        if (this.ttsLines[i].charOffset <= targetChar) {
          lineIndex = i;
        } else {
          break;
        }
      }
      this.ttsCurrentLineIndex = lineIndex;
      
      if (this.isPlaying) {
        clearTimeout(this.ttsDelayTimeout);
        window.speechSynthesis.cancel();
        this.speakTtsLine();
      }
    } else {
      const audio = document.getElementById('main-audio-element');
      audio.currentTime = slider.value;
    }
  }

  changeSpeed() {
    const slider = document.getElementById('player-timeline-slider');
    const speed = document.getElementById('player-speed-select').value;
    
    if (this.currentLesson && this.currentLesson.audioFile.startsWith('TTS_')) {
      const wordsCount = this.currentLesson.transcript.split(/\s+/).length;
      const speedVal = parseFloat(speed) || 1.0;
      const oldDuration = this.ttsDuration;
      const progressRatio = this.ttsCurrentTime / (oldDuration || 1);
      
      this.ttsDuration = Math.max(1, Math.round(wordsCount / (2.2 * speedVal)));
      this.ttsCurrentTime = Math.round(this.ttsDuration * progressRatio);
      
      slider.max = this.ttsDuration;
      slider.value = this.ttsCurrentTime;
      document.getElementById('player-time-duration').textContent = this.formatTime(this.ttsDuration);
      
      if (this.isPlaying) {
        clearTimeout(this.ttsDelayTimeout);
        window.speechSynthesis.cancel();
        this.speakTtsLine();
      }
    } else {
      const audio = document.getElementById('main-audio-element');
      audio.defaultPlaybackRate = parseFloat(speed);
      audio.playbackRate = parseFloat(speed);
    }
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
      const match = line.match(/^([A-Za-z\s]+):(.*)/);
      if (match) {
        const speaker = match[1];
        const text = match[2];

        lineDiv.innerHTML = `<span class="speaker-name">${speaker}:</span>${text}`;
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

  renderQuiz() {
    const container = document.getElementById('listening-quiz-list');
    container.innerHTML = '';

    const quizList = this.currentLesson.quiz;
    
    if (!quizList || quizList.length === 0) {
      container.innerHTML = '<p style="text-align:center; padding: 2rem;">Bài tập điền từ đang được cập nhật cho bài nghe này. Hãy nghe và theo dõi transcript ở tab bên cạnh nhé!</p>';
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
      title.textContent = `Câu ${idx + 1}:`;
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
        // Gap fill / Cloze
        const questionTextContainer = document.createElement('div');
        questionTextContainer.style.fontSize = '1.05rem';
        questionTextContainer.style.lineHeight = '1.6';
        questionTextContainer.style.marginBottom = '0.5rem';

        // Render question text with an actual inline input box
        const textParts = q.question.split('________');
        if (textParts.length > 1) {
          questionTextContainer.appendChild(document.createTextNode(textParts[0]));
          
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'input-field';
          input.style.width = '160px';
          input.style.display = 'inline-block';
          input.style.margin = '0 8px';
          input.style.padding = '0.25rem 0.5rem';
          input.placeholder = '...';
          input.id = `input-q-${q.id}`;
          
          questionTextContainer.appendChild(input);
          questionTextContainer.appendChild(document.createTextNode(textParts[1]));
        } else {
          // Fallback if no blanks are represented
          questionTextContainer.textContent = q.question;
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'input-field';
          input.style.width = '100%';
          input.style.marginTop = '0.5rem';
          input.placeholder = 'Nhập đáp án của bạn...';
          input.id = `input-q-${q.id}`;
          questionTextContainer.appendChild(input);
        }

        qDiv.appendChild(questionTextContainer);
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
          r.disabled = true;
        });

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
          
          const hint = document.createElement('span');
          hint.style.color = 'var(--success-color)';
          hint.style.marginLeft = '0.5rem';
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
