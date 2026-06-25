// EnglishFree - Vocabulary Learning Module (IELTS Topic-based & Locked Progress)

class VocabularyModule {
  constructor() {
    this.currentTopicIndex = -1; // index of selected topic (0-6)
    this.currentBatchIndex = -1; // index of current batch within topic (0-indexed)
    this.currentWords = []; // words for current batch (exactly 10 words)
    this.currentIndex = 0; // index of active word card (0-9)
    
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
        id: "education",
        nameVi: "Giáo dục & Trường học",
        nameEn: "Education & Schooling",
        description: "Các từ vựng thiết yếu về học tập, phương pháp giảng dạy, thi cử và môi trường sư phạm.",
        emoji: "📚",
        words: []
      },
      {
        id: "business",
        nameVi: "Công việc & Kinh doanh",
        nameEn: "Work & Business",
        description: "Các thuật ngữ quan trọng về quản lý doanh nghiệp, tài chính, nhân sự và việc làm.",
        emoji: "💼",
        words: []
      },
      {
        id: "health",
        nameVi: "Sức khỏe & Thể thao",
        nameEn: "Health & Sports",
        description: "Từ vựng học thuật về chăm sóc y tế, phòng ngừa bệnh tật và các hoạt động thể thao.",
        emoji: "🏥",
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

    this.topics.forEach((topic, idx) => {
      // User requested: "mở khoá các chủ đề" -> All topics are unlocked by default
      const isUnlocked = true;
      const totalWords = topic.words.length;
      const learnedCount = topic.words.filter(w => app.progress.wordsLearned.includes(w.word)).length;

      const card = document.createElement('div');
      card.className = 'topic-card';
      card.style.cursor = 'pointer';

      card.onclick = () => {
        this.selectTopic(idx);
      };

      let statusHtml = "";
      if (learnedCount === totalWords && totalWords > 0) {
        statusHtml = `<span style="color:var(--success-color); font-weight:700;">✓ Hoàn thành</span>`;
      } else {
        statusHtml = `<span style="color:var(--primary-color); font-weight:600;">Sẵn sàng học</span>`;
      }

      card.innerHTML = `
        <div class="topic-card-icon">${topic.emoji}</div>
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
    this.currentTopicIndex = topicIdx;
    this.renderBatches();
  }

  exitLevelSelect() {
    this.exitBatchSelector();
  }

  exitBatchSelector() {
    document.getElementById('vocab-batch-selector').style.display = 'none';
    document.getElementById('vocab-topic-selector').style.display = 'block';
    this.renderTopics();
  }

  renderBatches() {
    const topic = this.topics[this.currentTopicIndex];
    if (!topic) return;

    document.getElementById('vocab-topic-selector').style.display = 'none';
    const batchSelector = document.getElementById('vocab-batch-selector');
    batchSelector.style.display = 'block';

    const titleEl = document.getElementById('study-level-title');
    if (titleEl) {
      titleEl.textContent = topic.nameVi;
    }

    const listContainer = document.getElementById('vocab-batches-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const topicId = topic.id;
    // Track progressive batch unlock within each topic key
    const unlockedHighestBatch = (app.progress.vocabProgress && app.progress.vocabProgress[topicId]) || 1;
    const numBatches = Math.ceil(topic.words.length / 10);

    for (let b = 0; b < numBatches; b++) {
      const isUnlocked = (b + 1) <= unlockedHighestBatch;
      const startIdx = b * 10;
      const endIdx = Math.min((b + 1) * 10, topic.words.length);
      const batchWords = topic.words.slice(startIdx, endIdx);
      const learnedCount = batchWords.filter(w => app.progress.wordsLearned.includes(w.word)).length;

      const card = document.createElement('div');
      card.className = `topic-card ${isUnlocked ? '' : 'locked-topic'}`;
      if (!isUnlocked) {
        card.style.opacity = '0.6';
        card.style.cursor = 'not-allowed';
      } else {
        card.style.cursor = 'pointer';
      }

      card.onclick = () => {
        if (isUnlocked) {
          this.startBatch(b);
        } else {
          app.showToast(`Bạn cần đạt 100% điểm bài test của Cụm ${b} để mở khóa cụm này!`, 'warning');
        }
      };

      let statusHtml = "";
      if (!isUnlocked) {
        statusHtml = `<span style="color:var(--text-muted);">🔒 Đang khóa</span>`;
      } else if ((b + 1) < unlockedHighestBatch || learnedCount === batchWords.length) {
        statusHtml = `<span style="color:var(--success-color); font-weight:700;">✓ Hoàn thành</span>`;
      } else {
        statusHtml = `<span style="color:var(--primary-color); font-weight:600;">Sẵn sàng học</span>`;
      }

      card.innerHTML = `
        <div class="topic-card-icon" style="font-size: 2.2rem; margin-bottom: 0.5rem;">${isUnlocked ? '📖' : '🔒'}</div>
        <h3 class="topic-card-title">Cụm ${b + 1}</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">Từ ${startIdx + 1} đến ${endIdx}</p>
        <div class="topic-card-stats" style="display:flex; justify-content:space-between; width:100%; border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 1rem; font-size: 0.8rem;">
          <span>Tiến độ: ${learnedCount}/${batchWords.length} từ</span>
          ${statusHtml}
        </div>
      `;

      listContainer.appendChild(card);
    }
  }

  startBatch(batchIdx) {
    const topic = this.topics[this.currentTopicIndex];
    this.currentBatchIndex = batchIdx;
    this.currentIndex = 0;

    const startIdx = batchIdx * 10;
    const endIdx = startIdx + 10;
    this.currentWords = topic.words.slice(startIdx, endIdx);

    document.getElementById('vocab-batch-selector').style.display = 'none';
    document.getElementById('vocab-flashcard-view').style.display = 'flex';
    
    document.getElementById('study-topic-title').textContent = `${topic.nameVi} - Cụm ${batchIdx + 1}`;
    this.renderCard();
  }

  exitStudyMode() {
    document.getElementById('vocab-flashcard-view').style.display = 'none';
    this.renderBatches();
  }

  renderCard() {
    const wordObj = this.currentWords[this.currentIndex];
    if (!wordObj) return;

    const cardEl = document.getElementById('current-flashcard');
    if (cardEl) cardEl.classList.remove('flipped');

    const topic = this.topics[this.currentTopicIndex];
    const badgeEl = document.getElementById('vocab-topic-badge');
    if (badgeEl) badgeEl.textContent = `${topic.nameVi.toUpperCase()} - CỤM ${this.currentBatchIndex + 1}`;
    
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
      const topic = this.topics[this.currentTopicIndex];
      const confirmQuiz = confirm(`Bạn đã học hết 10 từ vựng của Cụm ${this.currentBatchIndex + 1}! Bấm OK để bắt đầu làm bài test 10 câu. Đạt 100% để mở khóa cụm tiếp theo.`);
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
      app.speak(wordObj.word, 0.85, 'en-US'); // Default to US accent
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

  getBlankedExample(example, word) {
    const irregularMap = {
      'bring': '\\b(bring|brought|bringing|brings)\\b',
      'break': '\\b(break|broke|broken|breaking|breaks)\\b',
      'go': '\\b(go|went|gone|going|goes)\\b',
      'give': '\\b(give|gave|given|giving|gives)\\b',
      'fall': '\\b(fall|fell|fallen|falling|falls)\\b',
      'find': '\\b(find|found|finding|finds)\\b',
      'grow': '\\b(grow|grew|grown|growing|grows)\\b',
      'hold': '\\b(hold|held|holding|holds)\\b',
      'keep': '\\b(keep|kept|keeping|keeps)\\b',
      'take': '\\b(take|took|taken|taking|takes)\\b',
      'think': '\\b(think|thought|thinking|thinks)\\b',
      'wake': '\\b(wake|woke|woken|waking|wakes)\\b',
      'write': '\\b(write|wrote|written|writing|writes)\\b',
      'make': '\\b(make|made|making|makes)\\b',
      'come': '\\b(come|came|coming|comes)\\b',
      'cut': '\\b(cut|cutting|cuts)\\b',
      'catch': '\\b(catch|caught|catching|catches)\\b',
      'drop': '\\b(drop|dropped|dropping|drops)\\b',
      'die': '\\b(die|died|dying|dies)\\b',
      'get': '\\b(get|got|gotten|getting|gets)\\b',
      'leave': '\\b(leave|left|leaving|leaves)\\b'
    };

    const parts = word.toLowerCase().split(' ');
    if (parts.length > 1) {
      const firstWord = parts[0];
      const rest = parts.slice(1).join(' ');
      const pattern = irregularMap[firstWord] || `\\b${firstWord}(ed|ing|s|es|d)?`;
      const regex = new RegExp(`${pattern}\\s+${rest}\\b`, 'gi');
      if (regex.test(example)) {
        return example.replace(regex, '_____');
      }
    }

    const firstWord = parts[0];
    const pattern = irregularMap[firstWord] || `\\b${firstWord}(ed|ing|s|es|d)?\\b`;
    const regex = new RegExp(pattern, 'gi');
    return example.replace(regex, '_____');
  }

  startQuiz() {
    document.getElementById('vocab-flashcard-view').style.display = 'none';
    document.getElementById('vocab-quiz-view').style.display = 'block';

    this.quizScore = 0;
    this.quizCurrentIndex = 0;
    this.quizQuestions = [];

    // The quiz contains exactly the 10 words from this batch, shuffled
    const quizWords = [...this.currentWords].sort(() => 0.5 - Math.random());
    quizWords.forEach((wordObj, index) => {
      // Pick random question type (0: EN->VI, 1: VI->EN, 2: Fill in the blank)
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
        optionTexts = options.map(o => `${o.word} (${o.partOfSpeech})`);
      } else {
        const blankExample = this.getBlankedExample(correct.example, correct.word);
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
      // Completed quiz - must score 10/10 to pass
      const passScore = this.quizQuestions.length; 
      
      if (this.quizScore === passScore) {
        app.progress.testsPassed++;
        
        // Unlock next batch in this topic
        const topic = this.topics[this.currentTopicIndex];
        const topicId = topic.id;
        const nextBatchNum = this.currentBatchIndex + 2; // batch number (1-indexed) is currentBatchIndex + 1, next is +2
        const highestUnlocked = (app.progress.vocabProgress && app.progress.vocabProgress[topicId]) || 1;
        if (nextBatchNum > highestUnlocked) {
          app.progress.vocabProgress[topicId] = nextBatchNum;
        }
        app.updateProgress();
        
        alert(`Chúc mừng! Bạn đã hoàn thành bài test của Cụm ${this.currentBatchIndex + 1} với điểm tuyệt đối ${this.quizScore}/${this.quizQuestions.length} (100%). Cụm tiếp theo đã được mở khóa!`);
        document.getElementById('vocab-quiz-view').style.display = 'none';
        this.renderBatches();
      } else {
        alert(`Bạn đạt được ${this.quizScore}/${this.quizQuestions.length} câu đúng. Bạn cần trả lời đúng 100% để mở khóa cụm tiếp theo. Hãy ôn tập lại cụm này nhé!`);
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
