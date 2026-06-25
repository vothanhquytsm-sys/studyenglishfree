// EnglishFree - Reading Module

class ReadingModule {
  constructor() {
    this.currentStory = null;
    this.activeSubTab = 'read'; // 'read' or 'quiz'
    this.quizGraded = false;
  }

  init() {
    this.renderStoriesSidebar();
  }

  resetView() {
    this.activeSubTab = 'read';
    this.quizGraded = false;
    document.getElementById('btn-reading-tab-read').className = 'btn btn-primary';
    document.getElementById('btn-reading-tab-quiz').className = 'btn btn-secondary';
    document.getElementById('reading-read-pane').style.display = 'block';
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

    // Render Quiz questions
    this.renderQuiz();

    // Restore saved dictionary annotations
    if (typeof vocabDictionary !== 'undefined') {
      vocabDictionary.applySavedAnnotations('reading-read-pane', 'reading_' + story.id);
    }

    this.switchSubTab('read');
  }

  switchSubTab(tabName) {
    this.activeSubTab = tabName;
    const btnRead = document.getElementById('btn-reading-tab-read');
    const btnQuiz = document.getElementById('btn-reading-tab-quiz');

    // Reset styles
    btnRead.className = 'btn btn-secondary';
    btnQuiz.className = 'btn btn-secondary';

    // Hide all panes
    document.getElementById('reading-read-pane').style.display = 'none';
    document.getElementById('reading-quiz-pane').style.display = 'none';

    if (tabName === 'read') {
      btnRead.className = 'btn btn-primary';
      document.getElementById('reading-read-pane').style.display = 'block';
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
