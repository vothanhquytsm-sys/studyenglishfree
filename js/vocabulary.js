// EnglishFree - Vocabulary Learning Module (IELTS Topic-based & Locked Progress)

class VocabularyModule {
  constructor() {
    this.currentBatchIndex = -1; // index of current topic (0-3)
    this.currentWords = []; // words for current topic
    this.currentIndex = 0; // index of active word card
    
    // Quiz state
    this.quizQuestions = [];
    this.quizCurrentIndex = 0;
    this.quizScore = 0;
    this.quizAnswered = false;

    // Direct IELTS topics
    this.topics = [
      {
        id: "emotion",
        nameVi: "Cảm xúc & Tâm lý",
        nameEn: "Emotion & Feelings",
        description: "Các từ vựng về trạng thái cảm xúc, phản ứng tâm lý và cách diễn tả tâm trạng trong IELTS.",
        emoji: "🧠",
        words: []
      },
      {
        id: "environment",
        nameVi: "Môi trường & Biến đổi khí hậu",
        nameEn: "Environment & Climate Change",
        description: "Từ vựng học thuật quan trọng về hệ sinh thái, bảo tồn thiên nhiên và biến đổi khí hậu.",
        emoji: "🌍",
        words: []
      },
      {
        id: "technology",
        nameVi: "Công nghệ & Đời sống xã hội",
        nameEn: "Technology & Society",
        description: "Các thuật ngữ về sự đổi mới kỹ thuật số, tự động hóa và tác động xã hội.",
        emoji: "💻",
        words: []
      },
      {
        id: "phrasal-verbs",
        nameVi: "Cụm động từ thông dụng",
        nameEn: "Common Phrasal Verbs",
        description: "100 cụm động từ tự nhiên và hữu ích nhất giúp tăng điểm tiêu chí Lexical Resource.",
        emoji: "💬",
        words: []
      }
    ];
  }

  init() {
    // Populate words from VOCABULARY_DATA
    if (typeof VOCABULARY_DATA !== 'undefined') {
      this.topics.forEach(t => {
        t.words = VOCABULARY_DATA.filter(w => w.topic === t.id);
      });
    }
    this.renderTopics();
  }

  resetView() {
    document.getElementById('vocab-topic-selector').style.display = 'block';
    if (document.getElementById('vocab-batch-selector')) {
      document.getElementById('vocab-batch-selector').style.display = 'none';
    }
    document.getElementById('vocab-flashcard-view').style.display = 'none';
    document.getElementById('vocab-quiz-view').style.display = 'none';
    this.renderTopics();
  }

  renderTopics() {
    const listContainer = document.getElementById('vocab-topics-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const unlockedHighest = app.progress.vocabProgress["ielts"] || 1;

    this.topics.forEach((topic, idx) => {
      const isUnlocked = (idx + 1) <= unlockedHighest;
      const totalWords = topic.words.length;
      const learnedCount = topic.words.filter(w => app.progress.wordsLearned.includes(w.word)).length;

      const card = document.createElement('div');
      card.className = `topic-card ${isUnlocked ? '' : 'locked-topic'}`;
      if (!isUnlocked) {
        card.style.opacity = '0.6';
        card.style.cursor = 'not-allowed';
      }

      card.onclick = () => {
        if (isUnlocked) {
          this.selectTopic(idx);
        } else {
          app.showToast(`Bạn cần đạt 100% điểm bài test của Chủ đề "${this.topics[idx - 1].nameVi}" để mở khóa chủ đề này!`, 'warning');
        }
      };

      let statusHtml = "";
      if (!isUnlocked) {
        statusHtml = `<span style="color:var(--text-muted);">🔒 Đang khóa</span>`;
      } else if (learnedCount === totalWords && totalWords > 0) {
        statusHtml = `<span style="color:var(--success-color); font-weight:700;">✓ Hoàn thành</span>`;
      } else {
        statusHtml = `<span style="color:var(--primary-color); font-weight:600;">Sẵn sàng học</span>`;
      }

      const icon = isUnlocked ? topic.emoji : "🔒";

      card.innerHTML = `
        <div class="topic-card-icon">${icon}</div>
        <h3 class="topic-card-title">${topic.nameVi}</h3>
        <p style="font-size: 0.9rem; font-weight: 600; color: var(--primary-color); margin-top: 0.25rem;">${topic.nameEn}</p>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem; line-height: 1.4; flex-grow: 1;">${topic.description}</p>
        <div class="topic-card-stats" style="display:flex; justify-content:space-between; width:100%; border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.5rem;">
          <span>Tiến độ: ${learnedCount}/${totalWords} từ</span>
          ${statusHtml}
        </div>
      `;

      listContainer.appendChild(card);
    });
  }

  selectTopic(topicIdx) {
    const topic = this.topics[topicIdx];
    this.currentBatchIndex = topicIdx;
    this.currentWords = topic.words;
    this.currentIndex = 0;

    document.getElementById('vocab-topic-selector').style.display = 'none';
    document.getElementById('vocab-flashcard-view').style.display = 'flex';
    
    document.getElementById('study-topic-title').textContent = topic.nameVi;
    this.renderCard();
  }

  exitStudyMode() {
    document.getElementById('vocab-flashcard-view').style.display = 'none';
    document.getElementById('vocab-topic-selector').style.display = 'block';
    this.renderTopics();
  }

  renderCard() {
    const wordObj = this.currentWords[this.currentIndex];
    if (!wordObj) return;

    const cardEl = document.getElementById('current-flashcard');
    if (cardEl) cardEl.classList.remove('flipped');

    const topic = this.topics[this.currentBatchIndex];
    const badgeEl = document.getElementById('vocab-topic-badge');
    if (badgeEl) badgeEl.textContent = topic.nameVi.toUpperCase();
    
    // Add part of speech badge next to the word
    const posSuffix = wordObj.partOfSpeech ? ` <span style="font-size: 1.2rem; font-weight: 500; color: var(--text-muted); font-style: italic;">(${wordObj.partOfSpeech})</span>` : '';
    const wordEnEl = document.getElementById('vocab-word-en');
    if (wordEnEl) wordEnEl.innerHTML = `${wordObj.word}${posSuffix}`;
    
    // Set illustrative image on front card
    const imgEl = document.getElementById('vocab-word-img');
    if (imgEl) {
      imgEl.src = `https://images.unsplash.com/${wordObj.imageId}?w=400&auto=format&fit=crop`;
      imgEl.alt = wordObj.word;
      imgEl.style.display = 'block';
    }

    // Set separate US and UK pronunciations
    const ipaUkEl = document.getElementById('vocab-word-ipa-uk');
    const ipaUsEl = document.getElementById('vocab-word-ipa-us');
    if (ipaUkEl) ipaUkEl.textContent = wordObj.ipaUk;
    if (ipaUsEl) ipaUsEl.textContent = wordObj.ipaUs;

    // Backward compatibility for fallback display
    const ipaEl = document.getElementById('vocab-word-ipa');
    if (ipaEl) ipaEl.textContent = `UK: ${wordObj.ipaUk} | US: ${wordObj.ipaUs}`;

    const wordViEl = document.getElementById('vocab-word-vi');
    if (wordViEl) wordViEl.textContent = wordObj.translation;

    const wordExEl = document.getElementById('vocab-word-ex');
    if (wordExEl) wordExEl.textContent = `"${wordObj.example}"`;

    const wordExViEl = document.getElementById('vocab-word-ex-vi');
    if (wordExViEl) wordExViEl.textContent = wordObj.exampleVi;

    // Disable Word Family container since it's CEFR-specific
    const familyContainer = document.getElementById('vocab-word-family');
    if (familyContainer) familyContainer.style.display = 'none';

    const progressCounter = document.getElementById('study-progress-counter');
    if (progressCounter) progressCounter.textContent = `${this.currentIndex + 1}/${this.currentWords.length}`;

    // Mark as studied
    app.saveProgress('vocab', wordObj.word);
  }

  flipCard() {
    const cardEl = document.getElementById('current-flashcard');
    if (cardEl) cardEl.classList.toggle('flipped');
  }

  nextCard() {
    if (this.currentIndex < this.currentWords.length - 1) {
      this.currentIndex++;
      this.renderCard();
    } else {
      const topic = this.topics[this.currentBatchIndex];
      const confirmQuiz = confirm(`Bạn đã học hết ${this.currentWords.length} từ vựng của chủ đề "${topic.nameVi}"! Bấm OK để bắt đầu làm bài test 10 câu. Đạt 100% để mở khóa chủ đề tiếp theo.`);
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
      app.speak(wordObj.word, 0.85, 'en-US'); // Default to US accent for general speak button
    }
  }

  speakAccent(event, accent) {
    if (event) event.stopPropagation();
    const wordObj = this.currentWords[this.currentIndex];
    if (wordObj) {
      const lang = accent === 'uk' ? 'en-GB' : 'en-US';
      app.speak(wordObj.word, 0.85, lang);
    }
  }

  startQuiz() {
    document.getElementById('vocab-flashcard-view').style.display = 'none';
    document.getElementById('vocab-quiz-view').style.display = 'block';

    this.quizScore = 0;
    this.quizCurrentIndex = 0;
    this.quizQuestions = [];

    // Quiz contains at most 10 random words from this topic
    const quizWords = [...this.currentWords].sort(() => 0.5 - Math.random()).slice(0, 10);
    quizWords.forEach((wordObj, index) => {
      // Pick random question type
      const type = Math.floor(Math.random() * 3);
      
      const correct = wordObj;
      const others = VOCABULARY_DATA.filter(w => w.word !== correct.word && w.topic === correct.topic);
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
        optionTexts = options.map(o => `${o.word} (UK: ${o.ipaUk} | US: ${o.ipaUs})`);
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
      const passScore = this.quizQuestions.length; // Must score 100% correct
      
      if (this.quizScore === passScore) {
        app.progress.testsPassed++;
        
        // Unlock next topic
        const nextBatchNum = this.currentBatchIndex + 2;
        const highestUnlocked = app.progress.vocabProgress["ielts"] || 1;
        if (nextBatchNum > highestUnlocked) {
          app.progress.vocabProgress["ielts"] = nextBatchNum;
        }
        app.updateProgress();
        
        alert(`Chúc mừng! Bạn đã đạt điểm tối đa ${this.quizScore}/${this.quizQuestions.length} (100%). Chủ đề tiếp theo đã được mở khóa!`);
        document.getElementById('vocab-quiz-view').style.display = 'none';
        document.getElementById('vocab-topic-selector').style.display = 'block';
        this.renderTopics();
      } else {
        alert(`Bạn đạt được ${this.quizScore}/${this.quizQuestions.length} câu đúng. Bạn cần trả lời đúng 100% để mở khóa chủ đề tiếp theo. Hãy ôn tập lại nhé!`);
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
