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

    this.topicsList = [
      "Gia đình & Mối quan hệ (Family & Relationships)",
      "Giáo dục & Trường học (Education & Learning)",
      "Công việc & Kinh doanh (Jobs & Business)",
      "Sức khỏe & Thể thao (Health & Sports)",
      "Ẩm thực & Ăn uống (Food & Dining)",
      "Du lịch & Thiên nhiên (Travel & Nature)",
      "Công nghệ & Truyền thông (Technology & Media)",
      "Hành động & Động từ (Actions & Verbs)",
      "Mô tả & Tính từ (Describing & Adjectives)",
      "Đời sống & Danh từ chung (General Nouns)",
      "Từ loại khác & Giao tiếp (Grammar & Others)"
    ];
  }

  getWordTopic(wordObj) {
    const word = wordObj.word.toLowerCase();
    const trans = wordObj.translation.toLowerCase();
    
    const TOPIC_KEYWORDS = {
      "Gia đình & Mối quan hệ (Family & Relationships)": {
        en: ["family", "parent", "father", "mother", "child", "baby", "adult", "born", "marry", "cousin", "uncle", "aunt", "friend", "love", "brother", "sister", "son", "daughter", "grand", "relationship", "neighbor", "meet", "wedding", "wife", "husband"],
        vi: ["gia đình", "bố", "mẹ", "cha", "con", "trẻ", "người lớn", "sinh", "kết hôn", "bạn", "yêu", "anh", "chị", "em", "họ hàng", "vợ", "chồng", "đám cưới", "hàng xóm"]
      },
      "Giáo dục & Trường học (Education & Learning)": {
        en: ["school", "study", "learn", "teach", "class", "student", "university", "lesson", "exam", "book", "write", "read", "homework", "subject", "science", "history", "geography", "chemistry", "biology", "math", "language", "vocabulary", "dictionary", "grammar", "college", "course", "degree", "academy", "educate", "knowledge", "pencil", "paper"],
        vi: ["trường", "học", "dạy", "lớp", "học sinh", "sinh viên", "đại học", "bài học", "thi", "sách", "viết", "đọc", "môn", "khoa học", "ngôn ngữ", "từ vựng", "ngữ pháp", "kiến thức", "giáo dục"]
      },
      "Công việc & Kinh doanh (Jobs & Business)": {
        en: ["job", "work", "office", "employ", "boss", "company", "business", "manager", "career", "salary", "money", "pay", "buy", "sell", "shop", "customer", "market", "cost", "price", "finance", "industry", "bank", "trade", "deal", "earn", "wage", "hire", "worker", "profession", "commercial", "economic"],
        vi: ["công việc", "làm việc", "văn phòng", "sếp", "công ty", "kinh doanh", "quản lý", "sự nghiệp", "lương", "tiền", "thanh toán", "mua", "bán", "cửa hàng", "khách hàng", "chợ", "giá", "tài chính", "ngân hàng", "thương mại", "thu nhập"]
      },
      "Sức khỏe & Thể thao (Health & Sports)": {
        en: ["health", "sick", "pain", "medicine", "hospital", "doctor", "nurse", "body", "foot", "hand", "eye", "face", "hair", "run", "play", "game", "sport", "tennis", "football", "swim", "active", "exercise", "fit", "energy", "heart", "breath", "ill", "disease", "treatment", "clinic", "muscle", "workout"],
        vi: ["sức khỏe", "ốm", "đau", "thuốc", "bệnh viện", "bác sĩ", "y tá", "cơ thể", "chân", "tay", "mắt", "mặt", "tóc", "chạy", "chơi", "thể thao", "bơi", "tập thể dục", "bệnh", "điều trị", "phòng khám"]
      },
      "Ẩm thực & Ăn uống (Food & Dining)": {
        en: ["food", "drink", "eat", "restaurant", "chef", "cook", "meal", "dinner", "lunch", "breakfast", "water", "milk", "coffee", "tea", "apple", "bread", "cheese", "meat", "vegetable", "fruit", "sugar", "sweet", "kitchen", "recipe", "delicious", "hungry", "taste", "salt", "pepper", "bowl", "plate"],
        vi: ["thức ăn", "nước uống", "ăn", "uống", "nhà hàng", "đầu bếp", "nấu", "bữa ăn", "bữa tối", "bữa trưa", "bữa sáng", "nước", "sữa", "cà phê", "trà", "táo", "bánh mì", "phô mai", "thịt", "rau", "trái cây", "đường", "ngọt", "bếp", "ngon", "đói", "vị"]
      },
      "Du lịch & Thiên nhiên (Travel & Nature)": {
        en: ["travel", "trip", "hotel", "tour", "flight", "plane", "bus", "train", "road", "street", "city", "country", "world", "map", "nature", "land", "water", "river", "lake", "sea", "ocean", "mountain", "tree", "flower", "plant", "animal", "dog", "cat", "bird", "fish", "weather", "sun", "rain", "cloud", "wind", "snow", "summer", "winter", "spring", "autumn", "visit", "destination", "forest", "wild", "beach", "island"],
        vi: ["du lịch", "chuyến đi", "khách sạn", "chuyến bay", "máy bay", "xe buýt", "tàu", "đường", "phố", "thành phố", "quốc gia", "thế giới", "bản đồ", "tự nhiên", "đất", "sông", "hồ", "biển", "đại dương", "núi", "cây", "hoa", "thực vật", "động vật", "chó", "mèo", "chim", "cá", "thời tiết", "mặt trời", "mưa", "mây", "gió", "tuyết", "mùa hè", "mùa đông", "mùa xuân", "mùa thu", "rừng", "bãi biển", "đảo"]
      },
      "Công nghệ & Truyền thông (Technology & Media)": {
        en: ["computer", "phone", "internet", "website", "email", "chat", "app", "online", "screen", "video", "audio", "media", "news", "radio", "television", "movie", "film", "photo", "camera", "electric", "digital", "device", "software", "network", "system", "blog", "data", "post", "social media"],
        vi: ["máy tính", "điện thoại", "mạng", "trang web", "trực tuyến", "màn hình", "tin tức", "phim", "ảnh", "điện", "kỹ thuật số", "thiết bị", "phần mềm", "hệ thống", "dữ liệu"]
      }
    };

    for (const [topic, kw] of Object.entries(TOPIC_KEYWORDS)) {
      for (const k of kw.en) {
        if (word.includes(k)) return topic;
      }
      for (const k of kw.vi) {
        if (trans.includes(k)) return topic;
      }
    }

    // Fallback based on part of speech
    const pos = (wordObj.partOfSpeech || '').toLowerCase();
    if (pos.includes('v')) {
      return "Hành động & Động từ (Actions & Verbs)";
    } else if (pos.includes('adj') || pos === 'a') {
      return "Mô tả & Tính từ (Describing & Adjectives)";
    } else if (pos.includes('n')) {
      return "Đời sống & Danh từ chung (General Nouns)";
    } else {
      return "Từ loại khác & Giao tiếp (Grammar & Others)";
    }
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

    const levels = ["A1", "A2", "B1", "B2", "PV"];
    const levelNamesVi = {
      "A1": "Cơ bản (Beginner)",
      "A2": "Sơ cấp (Elementary)",
      "B1": "Trung cấp (Intermediate)",
      "B2": "Trung cao cấp (Upper Intermediate)",
      "PV": "Cụm động từ (Phrasal Verbs)"
    };
    const levelDescriptions = {
      "A1": "Các từ vựng giao tiếp rất đơn giản, quen thuộc hàng ngày.",
      "A2": "Từ vựng thông dụng về bản thân, gia đình và môi trường sống.",
      "B1": "Từ vựng diễn tả ý kiến, kế hoạch, công việc và đời sống xã hội.",
      "B2": "Từ vựng học thuật phức tạp hơn, phục vụ tốt cho kỳ thi IELTS.",
      "PV": "100 cụm động từ thông dụng nhất giúp bạn giao tiếp và viết tiếng Anh tự nhiên."
    };
    const levelEmojis = {
      "A1": "🌱", "A2": "🌿", "B1": "🌳", "B2": "👑", "PV": "💬"
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
    
    // Group level words by topic
    const wordsByTopic = {};
    this.topicsList.forEach(t => wordsByTopic[t] = []);
    levelWords.forEach(w => {
      const topic = this.getWordTopic(w);
      if (wordsByTopic[topic]) {
        wordsByTopic[topic].push(w);
      } else {
        wordsByTopic["Đời sống & Danh từ chung (General Nouns)"].push(w);
      }
    });

    const unlockedHighest = app.progress.vocabProgress[this.currentLevel] || 1;

    this.topicsList.forEach((topicName, idx) => {
      const topicWords = wordsByTopic[topicName];
      if (topicWords.length === 0) return; // Skip if empty

      const isUnlocked = (idx + 1) <= unlockedHighest;
      
      const card = document.createElement('div');
      card.className = `topic-card ${isUnlocked ? '' : 'locked-topic'}`;
      if (!isUnlocked) {
        card.style.opacity = '0.6';
        card.style.cursor = 'not-allowed';
      }
      
      card.onclick = () => {
        if (isUnlocked) {
          this.selectTopic(topicName, topicWords, idx);
        } else {
          app.showToast(`Bạn cần đạt 100% điểm bài test của Chủ đề "${this.topicsList[idx - 1].split(' (')[0]}" để mở khóa chủ đề này!`, 'warning');
        }
      };

      const learnedCount = topicWords.filter(w => app.progress.wordsLearned.includes(w.word)).length;

      let statusHtml = "";
      if (!isUnlocked) {
        statusHtml = `<span style="color:var(--text-muted);">🔒 Đang khóa</span>`;
      } else if (learnedCount === topicWords.length) {
        statusHtml = `<span style="color:var(--success-color); font-weight:700;">✓ Hoàn thành</span>`;
      } else {
        statusHtml = `<span style="color:var(--primary-color); font-weight:600;">Sẵn sàng học</span>`;
      }

      const displayName = topicName.split(' (')[0];
      const englishName = topicName.split('(')[1]?.replace(')', '') || '';
      
      const topicIcons = {
        "Gia đình & Mối quan hệ": "👨‍👩‍👧‍👦",
        "Giáo dục & Trường học": "🏫",
        "Công việc & Kinh doanh": "💼",
        "Sức khỏe & Thể thao": "⚽",
        "Ẩm thực & Ăn uống": "🍔",
        "Du lịch & Thiên nhiên": "✈️",
        "Công nghệ & Truyền thông": "📱",
        "Hành động & Động từ": "🏃",
        "Mô tả & Tính từ": "🎨",
        "Đời sống & Danh từ chung": "📦",
        "Từ loại khác & Giao tiếp": "💬"
      };
      const icon = isUnlocked ? (topicIcons[displayName] || "📦") : "🔒";

      card.innerHTML = `
        <div class="topic-card-icon" style="font-size: 2rem;">${icon}</div>
        <h3 class="topic-card-title" style="font-size: 1.15rem; line-height: 1.3;">${displayName}</h3>
        <p style="font-size: 0.8rem; color: var(--text-muted); font-style: italic; margin-top: 0.25rem; text-align: center;">${englishName}</p>
        <div class="topic-card-stats" style="display:flex; justify-content:space-between; width:100%; border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.5rem;">
          <span>Tiến độ: ${learnedCount}/${topicWords.length} từ</span>
          ${statusHtml}
        </div>
      `;

      listContainer.appendChild(card);
    });
  }

  selectTopic(topicName, topicWords, topicIdx) {
    this.currentBatchIndex = topicIdx;
    this.currentWords = topicWords;
    this.currentIndex = 0;

    document.getElementById('vocab-batch-selector').style.display = 'none';
    document.getElementById('vocab-flashcard-view').style.display = 'flex';
    
    const displayName = topicName.split(' (')[0];
    document.getElementById('study-topic-title').textContent = `${this.currentLevel} - ${displayName}`;
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

    const displayName = this.topicsList[this.currentBatchIndex].split(' (')[0];
    document.getElementById('vocab-topic-badge').textContent = `${wordObj.level} - ${displayName.toUpperCase()}`;
    
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
      const displayName = this.topicsList[this.currentBatchIndex].split(' (')[0];
      const confirmQuiz = confirm(`Bạn đã học hết ${this.currentWords.length} từ vựng của chủ đề "${displayName}"! Bấm OK để bắt đầu làm bài test 10 câu. Đạt 100% để mở khóa chủ đề tiếp theo.`);
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

    // Quiz contains at most 10 random words from this topic
    const quizWords = [...this.currentWords].sort(() => 0.5 - Math.random()).slice(0, 10);
    quizWords.forEach((wordObj, index) => {
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
      const passScore = this.quizQuestions.length; // Must score 100% correct
      
      if (this.quizScore === passScore) {
        app.progress.testsPassed++;
        
        // Unlock next topic
        const nextBatchNum = this.currentBatchIndex + 2;
        const highestUnlocked = app.progress.vocabProgress[this.currentLevel] || 1;
        if (nextBatchNum > highestUnlocked) {
          app.progress.vocabProgress[this.currentLevel] = nextBatchNum;
        }
        app.updateProgress();
        
        alert(`Chúc mừng! Bạn đã đạt điểm tối đa ${this.quizScore}/${this.quizQuestions.length} (100%). Chủ đề tiếp theo đã được mở khóa!`);
        document.getElementById('vocab-quiz-view').style.display = 'none';
        document.getElementById('vocab-batch-selector').style.display = 'block';
        this.renderBatchSelector();
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

