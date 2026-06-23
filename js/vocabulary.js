// EnglishFree - Vocabulary Learning Module (CEFR Graded & Locked Progress)

class VocabularyModule {
  constructor() {
    this.currentLevel = ""; // "A1", "A2", "B1", "B2"
    this.currentBatchIndex = -1; // 0, 1, 2, ...
    this.currentWords = []; // 10 words for this batch
    this.currentIndex = 0; // index inside current batch (0-9)
    
    // Quiz state
    this.quizQuestions = [];
    this.quizCurrentIndex = 0;
    this.quizScore = 0;
    this.quizAnswered = false;
  }

  init() {
    this.renderLevelSelector();
  }

  resetView() {
    document.getElementById('vocab-topic-selector').style.display = 'block';
    document.getElementById('vocab-batch-selector').style.display = 'none';
    document.getElementById('vocab-flashcard-view').style.display = 'none';
    document.getElementById('vocab-quiz-view').style.display = 'none';
    this.renderLevelSelector();
  }

  renderLevelSelector() {
    const listContainer = document.getElementById('vocab-topics-list');
    listContainer.innerHTML = '';

    const levels = ["A1", "A2", "B1", "B2"];
    const levelNamesVi = {
      "A1": "Cơ bản (Beginner)",
      "A2": "Sơ cấp (Elementary)",
      "B1": "Trung cấp (Intermediate)",
      "B2": "Trung cao cấp (Upper Intermediate)"
    };
    const levelDescriptions = {
      "A1": "Các từ vựng giao tiếp rất đơn giản, quen thuộc hàng ngày.",
      "A2": "Từ vựng thông dụng về bản thân, gia đình và môi trường sống.",
      "B1": "Từ vựng diễn tả ý kiến, kế hoạch, công việc và đời sống xã hội.",
      "B2": "Từ vựng học thuật phức tạp hơn, phục vụ tốt cho kỳ thi IELTS."
    };
    const levelEmojis = {
      "A1": "🌱", "A2": "🌿", "B1": "🌳", "B2": "👑"
    };

    levels.forEach(lvl => {
      const card = document.createElement('div');
      card.className = 'topic-card';
      card.onclick = () => this.selectLevel(lvl);

      const levelWords = VOCABULARY_DATA.filter(w => w.level === lvl);
      const totalWords = levelWords.length;
      
      // Count learned words in this level
      const learnedCount = levelWords.filter(w => app.progress.wordsLearned.includes(w.word)).length;

      card.innerHTML = `
        <div class="topic-card-icon">${levelEmojis[lvl]}</div>
        <h3 class="topic-card-title">Trình độ ${lvl}</h3>
        <p style="font-size: 0.9rem; font-weight: 600; color: var(--primary-color); margin-top: 0.25rem;">${levelNamesVi[lvl]}</p>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem; line-height: 1.4; flex-grow: 1;">${levelDescriptions[lvl]}</p>
        <div class="topic-card-stats" style="display:flex; justify-content:space-between; width:100%; border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.5rem;">
          <span>Tổng số: ${totalWords} từ</span>
          <span style="color:var(--success-color); font-weight:600;">Đã học: ${learnedCount}/${totalWords}</span>
        </div>
      `;

      listContainer.appendChild(card);
    });
  }

  selectLevel(level) {
    this.currentLevel = level;
    document.getElementById('vocab-topic-selector').style.display = 'none';
    document.getElementById('vocab-batch-selector').style.display = 'block';
    document.getElementById('study-level-title').textContent = `Trình độ ${level}`;
    
    this.renderBatchSelector();
  }

  exitLevelSelect() {
    this.resetView();
  }

  renderBatchSelector() {
    const listContainer = document.getElementById('vocab-batches-list');
    listContainer.innerHTML = '';

    const levelWords = VOCABULARY_DATA.filter(w => w.level === this.currentLevel);
    const batchSize = 10;
    const totalBatches = Math.ceil(levelWords.length / batchSize);
    
    const unlockedHighest = app.progress.vocabProgress[this.currentLevel] || 1;

    for (let i = 0; i < totalBatches; i++) {
      const startIdx = i * batchSize;
      const endIdx = Math.min((i + 1) * batchSize, levelWords.length);
      const batchWords = levelWords.slice(startIdx, endIdx);
      const wordRangeText = `${batchWords[0].word} ... ${batchWords[batchWords.length - 1].word}`;
      
      const isUnlocked = (i + 1) <= unlockedHighest;
      
      const card = document.createElement('div');
      card.className = `topic-card ${isUnlocked ? '' : 'locked-topic'}`;
      if (!isUnlocked) {
        card.style.opacity = '0.6';
        card.style.cursor = 'not-allowed';
      }
      
      card.onclick = () => {
        if (isUnlocked) {
          this.selectBatch(i);
        } else {
          app.showToast(`Bạn cần đạt 100% điểm bài test của Cụm ${i} để mở khóa cụm này!`, 'warning');
        }
      };

      const learnedCount = batchWords.filter(w => app.progress.wordsLearned.includes(w.word)).length;

      let statusHtml = "";
      if (!isUnlocked) {
        statusHtml = `<span style="color:var(--text-muted);">🔒 Đang khóa</span>`;
      } else if (learnedCount === batchWords.length) {
        statusHtml = `<span style="color:var(--success-color); font-weight:700;">✓ Hoàn thành</span>`;
      } else {
        statusHtml = `<span style="color:var(--primary-color); font-weight:600;">Sẵn sàng học</span>`;
      }

      card.innerHTML = `
        <div class="topic-card-icon" style="font-size: 2rem;">${isUnlocked ? "📦" : "🔒"}</div>
        <h3 class="topic-card-title" style="font-size: 1.25rem;">Cụm ${i + 1}</h3>
        <p style="font-size: 0.8rem; color: var(--text-muted); font-style: italic; margin-top: 0.25rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; text-align: center;">${wordRangeText}</p>
        <div class="topic-card-stats" style="display:flex; justify-content:space-between; width:100%; border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.5rem;">
          <span>Tiến độ: ${learnedCount}/10 từ</span>
          ${statusHtml}
        </div>
      `;

      listContainer.appendChild(card);
    }
  }

  selectBatch(batchIdx) {
    this.currentBatchIndex = batchIdx;
    const levelWords = VOCABULARY_DATA.filter(w => w.level === this.currentLevel);
    const batchSize = 10;
    this.currentWords = levelWords.slice(batchIdx * batchSize, (batchIdx + 1) * batchSize);
    this.currentIndex = 0;

    document.getElementById('vocab-batch-selector').style.display = 'none';
    document.getElementById('vocab-flashcard-view').style.display = 'flex';
    
    document.getElementById('study-topic-title').textContent = `${this.currentLevel} - Cụm ${batchIdx + 1}`;
    this.renderCard();
  }

  exitStudyMode() {
    document.getElementById('vocab-flashcard-view').style.display = 'none';
    document.getElementById('vocab-batch-selector').style.display = 'block';
    this.renderBatchSelector();
  }

  renderCard() {
    const wordObj = this.currentWords[this.currentIndex];
    if (!wordObj) return;

    const cardEl = document.getElementById('current-flashcard');
    cardEl.classList.remove('flipped');

    document.getElementById('vocab-topic-badge').textContent = `${wordObj.level} - CỤM ${this.currentBatchIndex + 1}`;
    
    // Add part of speech badge next to the word
    const posSuffix = wordObj.partOfSpeech ? ` <span style="font-size: 1.2rem; font-weight: 500; color: var(--text-muted); font-style: italic;">(${wordObj.partOfSpeech})</span>` : '';
    document.getElementById('vocab-word-en').innerHTML = `${wordObj.word}${posSuffix}`;
    
    document.getElementById('vocab-word-ipa').textContent = wordObj.ipa;
    document.getElementById('vocab-word-vi').textContent = wordObj.translation;
    document.getElementById('vocab-word-ex').textContent = `"${wordObj.example}"`;
    document.getElementById('vocab-word-ex-vi').textContent = wordObj.exampleVi;

    // Display Word Family
    const familyContainer = document.getElementById('vocab-word-family');
    if (wordObj.family) {
      const familyWords = VOCABULARY_DATA.filter(w => w.family === wordObj.family && w.level === wordObj.level);
      if (familyWords.length > 1) {
        familyContainer.style.display = 'block';
        const familyTexts = familyWords.map(w => {
          const wPos = w.partOfSpeech ? ` (${w.partOfSpeech})` : '';
          return `<strong style="color:var(--primary-color);">${w.word}</strong>${wPos} (${w.ipa}): ${w.translation}`;
        });
        document.getElementById('vocab-word-family-list').innerHTML = familyTexts.join('<br>');
      } else {
        familyContainer.style.display = 'none';
      }
    } else {
      familyContainer.style.display = 'none';
    }

    document.getElementById('study-progress-counter').textContent = `${this.currentIndex + 1}/${this.currentWords.length}`;

    // Mark as studied
    app.saveProgress('vocab', wordObj.word);
  }

  flipCard() {
    const cardEl = document.getElementById('current-flashcard');
    cardEl.classList.toggle('flipped');
  }

  nextCard() {
    if (this.currentIndex < this.currentWords.length - 1) {
      this.currentIndex++;
      this.renderCard();
    } else {
      const confirmQuiz = confirm("Bạn đã học hết 10 từ vựng của Cụm này! Bấm OK để bắt đầu làm bài test 10 câu. Đạt 100% để mở khóa Cụm tiếp theo.");
      if (confirmQuiz) {
        this.startQuiz();
      }
    }
  }

  prevCard() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.renderCard();
    }
  }

  speakCurrentWord(event) {
    if (event) event.stopPropagation();
    const wordObj = this.currentWords[this.currentIndex];
    if (wordObj) {
      app.speak(wordObj.word, 0.85);
    }
  }

  startQuiz() {
    document.getElementById('vocab-flashcard-view').style.display = 'none';
    document.getElementById('vocab-quiz-view').style.display = 'block';

    this.quizScore = 0;
    this.quizCurrentIndex = 0;
    this.quizQuestions = [];

    // Quiz strictly contains the 10 words of the current batch
    this.currentWords.forEach((wordObj, index) => {
      // Pick random question type
      const type = Math.floor(Math.random() * 3);
      
      const correct = wordObj;
      const others = VOCABULARY_DATA.filter(w => w.word !== correct.word && w.level === correct.level);
      const shuffledOthers = others.sort(() => 0.5 - Math.random());
      
      const options = [correct, shuffledOthers[0], shuffledOthers[1], shuffledOthers[2]].sort(() => 0.5 - Math.random());
      const correctIndex = options.indexOf(correct);

      let questionText = "";
      let optionTexts = [];

      if (type === 0) {
        questionText = `Từ "${correct.word}" có nghĩa tiếng Việt là gì?`;
        optionTexts = options.map(o => o.translation);
      } else if (type === 1) {
        questionText = `Từ tiếng Anh nào có nghĩa là: "${correct.translation}"?`;
        optionTexts = options.map(o => `${o.word} ${o.ipa}`);
      } else {
        const blankExample = correct.example.replace(new RegExp(`\\b${correct.word}\\b`, 'gi'), '_____');
        questionText = `Chọn từ thích hợp điền vào chỗ trống:\n"${blankExample}"\n(${correct.exampleVi})`;
        optionTexts = options.map(o => o.word);
      }

      this.quizQuestions.push({
        word: correct.word,
        questionText: questionText,
        options: optionTexts,
        correctAnswerIndex: correctIndex
      });
    });

    this.renderQuizQuestion();
  }

  renderQuizQuestion() {
    this.quizAnswered = false;
    document.getElementById('btn-next-quiz-question').style.display = 'none';

    const currentQ = this.quizQuestions[this.quizCurrentIndex];
    if (!currentQ) return;

    document.getElementById('vocab-quiz-question-num').textContent = `Câu hỏi: ${this.quizCurrentIndex + 1}/${this.quizQuestions.length}`;
    document.getElementById('vocab-quiz-score').textContent = `Đúng: ${this.quizScore}`;
    
    const progressPct = ((this.quizCurrentIndex + 1) / this.quizQuestions.length) * 100;
    document.getElementById('vocab-quiz-progress-fill').style.width = `${progressPct}%`;

    document.getElementById('vocab-quiz-question-text').innerText = currentQ.questionText;

    const optionsContainer = document.getElementById('vocab-quiz-options-list');
    optionsContainer.innerHTML = '';

    currentQ.options.forEach((optText, index) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = optText;
      btn.onclick = () => this.handleOptionClick(index, btn);
      optionsContainer.appendChild(btn);
    });
  }

  handleOptionClick(selectedIndex, buttonEl) {
    if (this.quizAnswered) return;
    this.quizAnswered = true;

    const currentQ = this.quizQuestions[this.quizCurrentIndex];
    const correctIdx = currentQ.correctAnswerIndex;

    const optionsContainer = document.getElementById('vocab-quiz-options-list');
    const buttons = optionsContainer.getElementsByTagName('button');

    if (selectedIndex === correctIdx) {
      buttonEl.classList.add('correct');
      this.quizScore++;
      app.showToast('Chính xác!', 'success');
    } else {
      buttonEl.classList.add('wrong');
      buttons[correctIdx].classList.add('correct');
      app.showToast('Chưa đúng rồi!', 'error');
    }

    document.getElementById('vocab-quiz-score').textContent = `Đúng: ${this.quizScore}`;
    document.getElementById('btn-next-quiz-question').style.display = 'block';
  }

  nextQuizQuestion() {
    if (this.quizCurrentIndex < this.quizQuestions.length - 1) {
      this.quizCurrentIndex++;
      this.renderQuizQuestion();
    } else {
      // Completed quiz
      const passScore = this.quizQuestions.length; // Must score 10/10 (100% correct)
      
      if (this.quizScore === passScore) {
        app.progress.testsPassed++;
        
        // Unlock next batch
        const nextBatchNum = this.currentBatchIndex + 2; // e.g. current batch index 0 is Cụm 1. Next batch index 1 is Cụm 2.
        const highestUnlocked = app.progress.vocabProgress[this.currentLevel] || 1;
        if (nextBatchNum > highestUnlocked) {
          app.progress.vocabProgress[this.currentLevel] = nextBatchNum;
        }
        app.updateProgress();
        
        alert(`Chúc mừng! Bạn đã trả lời đúng ${this.quizScore}/${this.quizQuestions.length} câu (100%). Cụm tiếp theo đã được mở khóa!`);
        document.getElementById('vocab-quiz-view').style.display = 'none';
        document.getElementById('vocab-batch-selector').style.display = 'block';
        this.renderBatchSelector();
      } else {
        alert(`Bạn đạt được ${this.quizScore}/${this.quizQuestions.length} câu đúng. Bạn cần trả lời đúng 100% (10/10 câu) để mở khóa cụm tiếp theo. Hãy ôn tập lại nhé!`);
        document.getElementById('vocab-quiz-view').style.display = 'none';
        document.getElementById('vocab-flashcard-view').style.display = 'flex';
        this.currentIndex = 0;
        this.renderCard();
      }
    }
  }
}

// Global instance
const vocab = new VocabularyModule();
exportData = vocab;
