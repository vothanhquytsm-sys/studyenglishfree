// EnglishFree - Writing Module

class WritingModule {
  constructor() {
    this.tasks = [
      {
        id: "task-1-internet",
        type: "Task 1",
        difficulty: "TRUNG BÌNH",
        title: "Internet Access in Households (2015-2025)",
        question: "The line graph below shows the percentage of households with internet access in three countries (Vietnam, UK, USA) from 2015 to 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        levelClass: "TRUNG BÌNH",
        wordLimit: 150,
        timerMinutes: 20,
        chartType: "line",
        tips: [
          "Viết Introduction bằng cách paraphrase đề bài (paraphrase 'shows' thành 'illustrates', 'percentage of households' thành 'proportion of families').",
          "Viết Overview nêu bật 2 xu hướng chính: tỷ lệ truy cập tăng ở cả 3 nước và tỷ lệ của USA luôn cao nhất.",
          "Chia Body thành 2 đoạn: Đoạn 1 miêu tả số liệu từ 2015 đến 2020, Đoạn 2 miêu tả từ 2020 đến 2025 với các so sánh số liệu trực quan."
        ],
        sampleEssay: `The line graph illustrates the proportion of households with internet connection in Vietnam, the UK, and the USA over a ten-year period from 2015 to 2025.

Overall, it is clear that internet access became increasingly common in all three countries. Throughout the period, the USA maintained the highest rates of internet connectivity, while Vietnam experienced the most rapid growth.

In 2015, internet access was highest in the USA, with about 75% of households connected, compared to 60% in the UK and only 25% in Vietnam. Over the next five years, these figures rose steadily. By 2020, internet adoption in the USA reached 85%, and the UK saw an increase to 72%. Meanwhile, Vietnam's percentage doubled, reaching approximately 50%.

Between 2020 and 2025, the upward trend continued, though at a slightly slower pace for the developed countries. By 2025, household internet access peaked at 92% in the USA and 85% in the UK. Vietnam showed further dramatic growth, closing the gap with the UK by reaching a peak of 80% in 2025.`,
        chartData: `<svg viewBox="0 0 500 250" style="width:100%; height:100%;">
          <!-- Grid Lines -->
          <line x1="50" y1="30" x2="450" y2="30" stroke="var(--border-color)" stroke-dasharray="3,3" />
          <line x1="50" y1="80" x2="450" y2="80" stroke="var(--border-color)" stroke-dasharray="3,3" />
          <line x1="50" y1="130" x2="450" y2="130" stroke="var(--border-color)" stroke-dasharray="3,3" />
          <line x1="50" y1="180" x2="450" y2="180" stroke="var(--border-color)" stroke-dasharray="3,3" />
          
          <!-- Axes -->
          <line x1="50" y1="30" x2="50" y2="200" stroke="var(--text-color)" stroke-width="2" />
          <line x1="50" y1="200" x2="450" y2="200" stroke="var(--text-color)" stroke-width="2" />
          
          <!-- Y-Axis Labels -->
          <text x="40" y="35" fill="var(--text-muted)" font-size="10" text-anchor="end">100%</text>
          <text x="40" y="85" fill="var(--text-muted)" font-size="10" text-anchor="end">75%</text>
          <text x="40" y="135" fill="var(--text-muted)" font-size="10" text-anchor="end">50%</text>
          <text x="40" y="185" fill="var(--text-muted)" font-size="10" text-anchor="end">25%</text>
          <text x="40" y="205" fill="var(--text-muted)" font-size="10" text-anchor="end">0%</text>
          
          <!-- X-Axis Labels -->
          <text x="50" y="215" fill="var(--text-muted)" font-size="10" text-anchor="middle">2015</text>
          <text x="183" y="215" fill="var(--text-muted)" font-size="10" text-anchor="middle">2018</text>
          <text x="316" y="215" fill="var(--text-muted)" font-size="10" text-anchor="middle">2022</text>
          <text x="450" y="215" fill="var(--text-muted)" font-size="10" text-anchor="middle">2025</text>
          
          <!-- Data Lines: USA (Indigo) -->
          <path d="M 50 72.5 L 183 55 L 316 41.5 L 450 34" fill="none" stroke="#4f46e5" stroke-width="3" />
          <circle cx="50" cy="72.5" r="4" fill="#4f46e5" />
          <circle cx="450" cy="34" r="4" fill="#4f46e5" />
          
          <!-- Data Lines: UK (Purple) -->
          <path d="M 50 98 L 183 85 L 316 68 L 450 48.5" fill="none" stroke="#a855f7" stroke-width="3" />
          <circle cx="50" cy="98" r="4" fill="#a855f7" />
          <circle cx="450" cy="48.5" r="4" fill="#a855f7" />
          
          <!-- Data Lines: Vietnam (Green) -->
          <path d="M 50 162.5 L 183 130 L 316 95 L 450 59" fill="none" stroke="#10b981" stroke-width="3" />
          <circle cx="50" cy="162.5" r="4" fill="#10b981" />
          <circle cx="450" cy="59" r="4" fill="#10b981" />
          
          <!-- Legend -->
          <rect x="350" y="40" width="80" height="60" fill="var(--panel-bg)" stroke="var(--border-color)" rx="4"/>
          <line x1="360" y1="52" x2="380" y2="52" stroke="#4f46e5" stroke-width="3"/>
          <text x="390" y="55" fill="var(--text-color)" font-size="10">USA</text>
          <line x1="360" y1="70" x2="380" y2="70" stroke="#a855f7" stroke-width="3"/>
          <text x="390" y="73" fill="var(--text-color)" font-size="10">UK</text>
          <line x1="360" y1="88" x2="380" y2="88" stroke="#10b981" stroke-width="3"/>
          <text x="390" y="91" fill="var(--text-color)" font-size="10">Vietnam</text>
        </svg>`
      },
      {
        id: "task-2-education",
        type: "Task 2",
        difficulty: "KHÓ",
        title: "Function of Universities",
        question: "Some people think that universities should provide graduates with the knowledge and skills needed in the workplace. Others think that the true function of a university should be to give access to knowledge for its own sake, regardless of whether the course is useful to an employer. Discuss both views and give your opinion.",
        wordLimit: 250,
        timerMinutes: 40,
        chartType: "none",
        tips: [
          "Viết mở bài 2 câu: Câu 1 paraphrase đề bài về cuộc tranh cãi chức năng đại học; Câu 2 đưa ra la lập trường của bạn (ví dụ: ủng hộ sự cân bằng cả hai).",
          "Body 1 phân tích quan điểm thứ nhất (kỹ năng nghề nghiệp giúp sinh viên dễ xin việc, giảm tỷ lệ thất nghiệp và tăng năng suất lao động).",
          "Body 2 phân tích quan điểm thứ hai (học thuật thuần túy giúp thúc đẩy nghiên cứu khoa học cốt lõi, phát minh vĩ đại bắt nguồn từ nghiên cứu lý thuyết không vụ lợi).",
          "Kết bài khẳng định lại tầm quan trọng của việc kết hợp cả hai yếu tố để phát triển bền vững."
        ],
        sampleEssay: `In contemporary society, there is an ongoing debate regarding the primary role of tertiary education. While one school of thought suggests that universities should focus on preparing students for their future careers, others argue that academic institutions should prioritize the pursuit of knowledge itself. In my opinion, universities ought to strike a balance between practical career preparation and academic exploration.

On the one hand, there are compelling reasons why universities should equip graduates with practical workplace skills. First and foremost, the job market has become highly competitive, and employers favor candidates who can contribute immediately without extensive training. Therefore, courses focusing on practical application, such as software engineering, accounting, and nursing, are highly beneficial. Furthermore, focusing on career readiness helps reduce youth unemployment rates and supports national economic development by ensuring a skilled workforce.

On the other hand, the value of learning for its own sake should not be underestimated. Pure academic research in fields like philosophy, theoretical physics, or history might not yield immediate commercial benefits, but it builds the cognitive foundation of human civilization. Major scientific breakthroughs often emerge from theoretical research that initially had no commercial purpose. If universities only offered job-oriented courses, society would lose its capacity for deep intellectual progress and critical thinking.

In conclusion, both functions of university education are vital. A university should not only act as a vocational training ground but also as a hub for academic curiosity. Therefore, the ideal tertiary education system should combine professional training with opportunities for academic enrichment.`,
        chartData: ""
      }
    ];

    this.currentTaskIndex = 0;
    this.timerInterval = null;
    this.timeRemainingSeconds = 0;
    this.isSampleShowing = false;
  }

  init() {
    this.loadTask();
  }

  loadTask() {
    const task = this.tasks[this.currentTaskIndex];
    if (!task) return;

    this.isSampleShowing = false;

    // Badges
    document.getElementById('writing-level-badge').textContent = `ĐỘ KHÓ: ${task.difficulty}`;
    document.getElementById('writing-task-badge').textContent = task.type.toUpperCase();
    
    // Question text
    document.getElementById('writing-prompt-title').textContent = task.title;
    document.getElementById('writing-prompt-question').textContent = task.question;

    // Load visual graphics for Task 1
    if (task.chartType !== "none") {
      document.getElementById('writing-chart-box').style.display = 'flex';
      document.getElementById('writing-svg-chart').innerHTML = task.chartData;
    } else {
      document.getElementById('writing-chart-box').style.display = 'none';
    }

    // Load Tips list
    const tipsList = document.getElementById('writing-tips-list');
    tipsList.innerHTML = '';
    task.tips.forEach(tip => {
      const li = document.createElement('li');
      li.textContent = tip;
      tipsList.appendChild(li);
    });

    // Load draft if exists
    const savedDraft = localStorage.getItem(`ef_writing_draft_${task.id}`) || '';
    document.getElementById('writing-textarea-input').value = savedDraft;
    
    this.updateWordCount();

    // Reset feedback
    document.getElementById('writing-feedback-box').style.display = 'none';

    // Start Timer
    this.startTimer(task.timerMinutes * 60);
  }

  changeTask() {
    this.currentTaskIndex = (this.currentTaskIndex + 1) % this.tasks.length;
    this.loadTask();
  }

  startTimer(durationSeconds) {
    if (this.timerInterval) clearInterval(this.timerInterval);
    
    this.timeRemainingSeconds = durationSeconds;
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      if (this.timeRemainingSeconds > 0) {
        this.timeRemainingSeconds--;
        this.updateTimerDisplay();
      } else {
        clearInterval(this.timerInterval);
        app.showToast('Hết thời gian viết bài làm văn!', 'warning');
      }
    }, 1000);
  }

  updateTimerDisplay() {
    const min = Math.floor(this.timeRemainingSeconds / 60).toString().padStart(2, '0');
    const sec = (this.timeRemainingSeconds % 60).toString().padStart(2, '0');
    document.getElementById('writing-timer').textContent = `${min}:${sec}`;
  }

  updateWordCount() {
    const input = document.getElementById('writing-textarea-input').value;
    const task = this.tasks[this.currentTaskIndex];
    
    // Simple word splitter
    const words = input.trim() ? input.trim().split(/\s+/).length : 0;
    document.getElementById('writing-word-count').textContent = words;

    const counterDisplay = document.getElementById('writing-word-counter-display');
    if (words < task.wordLimit) {
      counterDisplay.className = "word-counter under-limit";
    } else {
      counterDisplay.className = "word-counter passed-limit";
    }

    // Save draft auto-saves in localstorage
    localStorage.setItem(`ef_writing_draft_${task.id}`, input);
  }

  showSampleEssay() {
    const task = this.tasks[this.currentTaskIndex];
    const editor = document.getElementById('writing-textarea-input');

    if (this.isSampleShowing) {
      // Toggle back to draft
      const draft = localStorage.getItem(`ef_writing_draft_${task.id}`) || '';
      editor.value = draft;
      editor.readOnly = false;
      this.isSampleShowing = false;
      app.showToast('Đã quay lại bản nháp của bạn.', 'info');
    } else {
      // Show sample
      editor.value = task.sampleEssay;
      editor.readOnly = true;
      this.isSampleShowing = true;
      app.showToast('Đang hiển thị bài luận mẫu đạt Band 8.0 (Đọc chỉ xem).', 'info');
    }
    this.updateWordCount();
  }

  async submitEssay() {
    const input = document.getElementById('writing-textarea-input').value.trim();
    const task = this.tasks[this.currentTaskIndex];

    if (!input) {
      alert("Vui lòng viết gì đó trước khi nộp bài!");
      return;
    }

    if (this.timerInterval) clearInterval(this.timerInterval);

    const feedbackBox = document.getElementById('writing-feedback-box');
    const feedbackContent = document.getElementById('writing-feedback-content');
    
    feedbackBox.style.display = 'block';
    feedbackContent.innerHTML = '<p style="color:var(--text-muted);">AI đang đọc và chấm điểm bài viết của bạn theo khung tiêu chí IELTS...</p>';

    try {
      const sysPrompt = `You are a certified IELTS Writing Examiner grading an academic essay.
Analyze the user's essay for the prompt: "${task.question}".
Provide a professional score sheet containing:
1. **Estimated IELTS Band Score** (e.g. Band 6.5)
2. **Task Achievement / Response** (word count check, key points covered)
3. **Coherence & Cohesion** (transition words usage, paragraphing structures)
4. **Lexical Resource** (spelling checks, vocab range improvements)
5. **Grammatical Range & Accuracy** (grammar errors correction)
6. **Polished Version** (Rewrite their essay to achieve Band 8.0+)
Output the feedback in Vietnamese so the user can easily study, but keep the technical English terms.`;

      const feedbackText = await app.callAI(sysPrompt, input);
      if (feedbackText) {
        feedbackContent.innerHTML = feedbackText.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        app.saveProgress('writing', task.id);
        return;
      }
    } catch (e) {
      console.error("AI writing grader error:", e);
    }

    // Local Fallback Grader
    setTimeout(() => {
      const wordCount = input.split(/\s+/).length;
      let score = 5.0;
      let tasksFeedback = "";

      // 1. Task Achievement
      if (wordCount < task.wordLimit) {
        score -= 1.0;
        tasksFeedback = `Bài viết quá ngắn (${wordCount}/${task.wordLimit} từ). Bạn bị trừ điểm Task Achievement vì không đạt số lượng từ tối thiểu.`;
      } else {
        score += 1.0;
        tasksFeedback = `Đạt yêu cầu độ dài bài viết (${wordCount} từ). Đã phác thảo đầy đủ các ý chính của đề bài.`;
      }

      // 2. Coherence & Cohesion transition check
      const transitions = ["however", "furthermore", "moreover", "on the other hand", "in addition", "in conclusion", "consequently", "therefore", "firstly", "secondly"];
      const usedTrans = transitions.filter(t => input.toLowerCase().includes(t));
      
      let ccFeedback = "";
      if (usedTrans.length >= 4) {
        score += 1.0;
        ccFeedback = `Khả năng liên kết tốt. Bạn đã dùng các từ nối: <em>${usedTrans.join(', ')}</em> giúp mạch văn rõ ràng.`;
      } else {
        ccFeedback = "Liên kết đoạn còn yếu. Bạn nên sử dụng thêm các từ nối liên kết như: <em>However, Furthermore, On the other hand, In conclusion</em> để tăng điểm gắn kết.";
      }

      // Cap score between 1 and 9
      score = Math.max(1.0, Math.min(9.0, score));

      feedbackContent.innerHTML = `
        <strong>Estimated Band Score: Band ${score.toFixed(1)}</strong><br><br>
        <strong>1. Task Achievement (Hoàn thành nhiệm vụ):</strong><br>
        ${tasksFeedback}<br><br>
        <strong>2. Coherence & Cohesion (Độ mạch lạc):</strong><br>
        ${ccFeedback}<br><br>
        <strong>3. Lexical Resource (Từ vựng):</strong><br>
        Từ vựng của bạn ở mức cơ bản. Hãy học thêm các từ vựng học thuật trong mục 'Từ vựng' để nâng band điểm.<br><br>
        <p style="font-size:0.85rem;color:var(--text-muted);margin-top:1rem;">*Mẹo: Hãy cấu hình API Key ở mục Cấu hình AI ở cuối menu để trợ lý Gemini AI phân tích ngữ pháp, lỗi chính tả và viết lại bài văn mẫu chi tiết hơn.</p>
      `;

      app.saveProgress('writing', task.id);
    }, 2000);
  }
}

const writing = new WritingModule();
