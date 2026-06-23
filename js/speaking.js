// EnglishFree - Speaking AI Agent Module

class SpeakingModule {
  constructor() {
    this.currentTopic = 'intro';
    this.recognition = null;
    this.isRecording = false;
    this.dialogueHistory = [];
    
    // local scripted flow index
    this.localQuestionIndex = 0;
    
    // scripted examiner questions
    this.topicQuestions = {
      'intro': [
        "Hello! My name is Examiner Sarah. Welcome to your IELTS Speaking practice test. Let's start with introductions. Can you tell me your full name, and what you like to do in your free time?",
        "Thank you. Where do you come from? Can you describe your hometown a little bit?",
        "Excellent. Do you work or are you a student? What do you like most about your studies or job?",
        "I see. Let's talk about hobbies. Why do you think it is important for people to have hobbies in their life?",
        "Thank you. That is the end of this speaking section. I will now prepare your IELTS score evaluation!"
      ],
      'restaurant': [
        "Welcome to the IELTS cafe restaurant dialogue simulation. I'll act as the waiter. Good evening, welcome to the Cambridge Bistro. Do you have a reservation, or would you like a table for two?",
        "Certainly, right this way. Here is your menu. Today's special is roasted beef with red wine sauce. Are you ready to order, or do you need a few minutes?",
        "Excellent choice. How would you like your steak cooked? And would you like any side dishes or drinks with that?",
        "Perfect. I will bring your order shortly. ... Here is your meal! Is everything to your satisfaction, or can I get you anything else?",
        "Wonderful. Here is your bill. How would you like to pay tonight: cash or card? Also, do you have any feedback on our service today?"
      ],
      'ielts': [
        "Welcome to your formal IELTS Speaking Exam simulation. We will start with Part 2. Here is your cue card topic: 'Describe a time you solved a difficult problem'. You have one minute to think, and then you should speak for one to two minutes.",
        "Thank you. Now let's move to Part 3 questions related to your topic. Why do you think some people are better at solving problems than others?",
        "Very interesting. Do you think schools should explicitly teach problem-solving skills to children?",
        "I see. With the rise of AI technology, do you think humans will lose their ability to solve complex problems independently?",
        "Thank you very much. That concludes the IELTS Speaking test. I will now analyze your fluency, pronunciation, grammar, and vocabulary to assign your Band Score!"
      ]
    };
  }

  init() {
    this.initSpeechRecognition();
  }

  selectTopic(topicId) {
    this.currentTopic = topicId;
    
    // Update button states
    document.querySelectorAll('.speaking-topic-btn').forEach(btn => btn.classList.remove('active'));
    
    const activeBtn = {
      'intro': 'speaking-topic-intro',
      'restaurant': 'speaking-topic-restaurant',
      'ielts': 'speaking-topic-ielts'
    }[topicId];

    const btnEl = document.getElementById(activeBtn);
    if (btnEl) btnEl.classList.add('active');

    // Restart conversation
    this.startConversation();
  }

  applyVoiceSettings() {
    // If speaking, we will read with new voice next time
    console.log("Voice settings updated. Gender:", app.voiceGender);
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
        document.getElementById('btn-speaking-mic').style.backgroundColor = 'var(--danger-color)';
        document.getElementById('speaking-status-alert').style.display = 'block';
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        document.getElementById('btn-speaking-mic').style.backgroundColor = '';
        document.getElementById('speaking-status-alert').style.display = 'none';
      };

      this.recognition.onresult = (event) => {
        const spokenText = event.results[0][0].transcript;
        document.getElementById('speaking-text-input').value = spokenText;
      };

      this.recognition.onerror = (e) => {
        console.error("Speaking SpeechRecognition error", e);
        this.isRecording = false;
        document.getElementById('speaking-status-alert').style.display = 'none';
      };
    }
  }

  toggleMic() {
    if (!this.recognition) {
      app.showToast('Nhận diện giọng nói bằng micro không khả dụng trên trình duyệt này. Bạn hãy gõ câu trả lời nhé!', 'info');
      return;
    }

    if (this.isRecording) {
      this.recognition.stop();
    } else {
      this.recognition.start();
    }
  }

  startConversation(shouldSpeak = true) {
    this.dialogueHistory = [];
    this.localQuestionIndex = 0;
    
    // Clear chats
    const chatContainer = document.getElementById('speaking-chat-messages');
    chatContainer.innerHTML = '';
    
    document.getElementById('speaking-feedback-box').style.display = 'none';
    document.getElementById('speaking-text-input').value = '';

    // Say first question
    const firstQ = this.topicQuestions[this.currentTopic][0];
    this.addChatBubble(firstQ, 'ai');
    if (shouldSpeak) {
      this.speakText(firstQ);
    }
    
    this.dialogueHistory.push({ role: 'ai', text: firstQ });
  }

  addChatBubble(text, sender) {
    const container = document.getElementById('speaking-chat-messages');
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    bubble.textContent = text;
    container.appendChild(bubble);

    // scroll
    container.scrollTop = container.scrollHeight;
  }

  speakText(text) {
    app.speak(text, 0.88);
  }

  handleInputKeydown(event) {
    if (event.key === 'Enter') {
      this.sendUserMessage();
    }
  }

  async sendUserMessage() {
    const inputEl = document.getElementById('speaking-text-input');
    const text = inputEl.value.trim();
    if (!text) return;

    inputEl.value = '';
    this.addChatBubble(text, 'user');
    this.dialogueHistory.push({ role: 'user', text: text });

    // Stop mic if recording
    if (this.isRecording) {
      this.recognition.stop();
    }

    // Process reply
    this.localQuestionIndex++;
    const questionsList = this.topicQuestions[this.currentTopic];

    if (this.localQuestionIndex < questionsList.length) {
      const nextQ = questionsList[this.localQuestionIndex];
      
      // Delay AI response slightly to feel natural
      setTimeout(async () => {
        let aiReply = nextQ;
        
        // Call AI for a dynamic question
        try {
          const sysPrompt = `You are an IELTS Speaking Examiner conducting a practice interview on the topic: ${this.currentTopic}. 
Respond to the user's previous answer dynamically, evaluate their language usage briefly (1-2 sentences), and ask the NEXT logical follow-up question.
Keep your response short (under 80 words) and speak naturally.`;
          
          const conversationHistoryString = this.dialogueHistory.map(h => `${h.role === 'ai' ? 'Examiner' : 'Candidate'}: ${h.text}`).join('\n');
          const reply = await app.callAI(sysPrompt, conversationHistoryString);
          if (reply) {
            aiReply = reply;
          }
        } catch (e) {
          console.error("AI examiner call error:", e);
        }

        this.addChatBubble(aiReply, 'ai');
        this.speakText(aiReply);
        this.dialogueHistory.push({ role: 'ai', text: aiReply });

        // If it was the last closing remark, evaluate the overall test
        if (this.localQuestionIndex === questionsList.length - 1) {
          this.evaluateOverallPerformance();
        }
      }, 1000);
    }
  }

  async evaluateOverallPerformance() {
    // Generate evaluations
    document.getElementById('speaking-feedback-box').style.display = 'block';
    const contentBox = document.getElementById('speaking-feedback-content');
    contentBox.innerHTML = '<p style="color:var(--text-muted);">AI đang đánh giá bài thi nói của bạn...</p>';

    // Extract questions and responses
    const questions = [];
    const responses = [];
    let lastQ = "";
    this.dialogueHistory.forEach(h => {
      if (h.role === 'ai') {
        lastQ = h.text;
      } else if (h.role === 'user') {
        questions.push(lastQ);
        responses.push(h.text);
      }
    });

    let ieltsPart = "Part 1";
    if (this.currentTopic === 'ielts') {
      ieltsPart = "Part 2 & Part 3";
    }

    const questionStr = questions.map((q, idx) => `[Question ${idx+1}] ${q}`).join("\n");
    const transcriptStr = responses.map((r, idx) => `[Response ${idx+1}] ${r}`).join("\n");

    let evaluationData = null;

    try {
      // Call AI for advanced IELTS evaluation matching candidate target Band 6.0
      const sysPrompt = `You are an IELTS Speaking Examiner specializing in helping candidates achieve a Target Band 6.0. Analyze the provided transcript and question strictly against the official IELTS Band Descriptors, focus feedback on helping them firmly secure a Band 6.0+.

### INPUT FORMAT:
- IELTS Part: [Part 1 / Part 2 / Part 3]
- Question: [The IELTS question asked]
- Transcript: [The text converted from the candidate's audio]

### EVALUATION CRITERIA FOR BAND 6.0:
1. Fluency & Coherence: Check if the user speaks at length (not too short), even with some hesitation or self-correction. Ensure they use basic linking words (but, because, although, however).
2. Lexical Resource: Ensure vocabulary is wide enough to discuss the topic clearly, even with some wrong word choices.
3. Grammatical Range & Accuracy: Check if they use a mix of simple and complex sentences. Mistakes are acceptable as long as they do not cause misunderstanding.

### OUTPUT FORMAT:
Return the response STRICTLY in JSON format without markdown wrappers.

{
  "current_overall_band": 0.0,
  "status_to_target": "Choose one: [Below Target / Achieved Target / Above Target]",
  "criteria_feedback": {
    "fluency_coherence": "Feedback focusing on length of answer and linking words.",
    "lexical_resource": "Feedback on vocabulary. Highlight 2-3 words to change to reach 6.0+.",
    "grammar": "Identify only major errors that disrupt meaning (e.g., wrong tenses, singular/plural confusion)."
  },
  "actionable_steps_for_6_0": [
    "Step 1 to improve this specific answer",
    "Step 2 to improve this specific answer"
  ],
  "achievable_model_answer": "An accessible Band 6.5 - 7.0 model answer. Use clear, natural language, simple compound structures, and common collocations that a Band 6.0 student can easily learn and replicate."
}`;

      const userPrompt = `- IELTS Part: ${ieltsPart}\n- Question:\n${questionStr}\n- Transcript:\n${transcriptStr}`;
      
      const feedback = await app.callAI(sysPrompt, userPrompt);
      if (feedback) {
        try {
          let cleanFeedback = feedback.trim();
          if (cleanFeedback.startsWith("```")) {
            cleanFeedback = cleanFeedback.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
          }
          evaluationData = JSON.parse(cleanFeedback);
        } catch (err) {
          console.error("JSON parse error for speaking feedback:", err, feedback);
        }
      }
    } catch (e) {
      console.error("AI overall speaking evaluation error:", e);
    }

    // Local Fallback Evaluation if API call fails or apiKey is absent
    if (!evaluationData) {
      evaluationData = this.getLocalEvaluation(responses, questions);
    }

    // Render report
    this.renderFeedbackHtml(evaluationData, contentBox);
    app.saveProgress('speaking', this.currentTopic);
  }

  getLocalEvaluation(responses, questions) {
    const text = responses.join(" ");
    const words = text.split(/\s+/).filter(Boolean).length;
    
    let band = 5.0;
    let status = "Below Target";
    let fluency = "";
    let lexical = "";
    let grammar = "";
    let steps = [];
    
    if (words > 120) {
      band = 6.5;
      status = "Achieved Target";
      fluency = "Bạn nói tương đối dài và mạch lạc, có sử dụng một số từ liên kết cơ bản. Đôi chỗ còn ngập ngừng nhưng nhìn chung duy trì được độ dài phù hợp.";
      lexical = "Vốn từ vựng tương đối đủ để diễn đạt ý kiến một cách rõ ràng. Hãy chú ý đa dạng hóa cách diễn đạt các từ thông dụng.";
      grammar = "Đã sử dụng kết hợp câu đơn và câu phức. Có một vài lỗi chia thì và số ít số nhiều nhưng không gây cản trở việc hiểu ý nghĩa.";
      steps = [
        "Hãy sử dụng các từ nối linh hoạt hơn như 'consequently', 'on the other hand' để kết nối các câu.",
        "Chú ý chia động từ ở các thì quá khứ khi kể về các trải nghiệm cũ của bạn."
      ];
    } else if (words > 60) {
      band = 5.5;
      status = "Below Target";
      fluency = "Bài nói có độ dài trung bình. Đôi khi có những khoảng ngập ngừng dài và tự sửa lỗi làm ảnh hưởng đến tính mạch lạc.";
      lexical = "Sử dụng từ vựng ở mức cơ bản, đủ để người nghe hiểu được nhưng còn lặp từ nhiều. Thiếu các cụm từ collocations tự nhiên.";
      grammar = "Cấu trúc câu chủ yếu là câu đơn giản. Có nhiều lỗi ngữ pháp cơ bản ở các thì hiện tại/quá khứ và chia số nhiều.";
      steps = [
        "Cố gắng kéo dài câu trả lời bằng cách bổ sung thêm nguyên nhân và ví dụ cụ thể (Ví dụ dùng 'For instance, ...').",
        "Thay thế các từ lặp lại nhiều lần bằng các từ đồng nghĩa đơn giản."
      ];
    } else {
      band = 4.5;
      status = "Below Target";
      fluency = "Câu trả lời của bạn quá ngắn. Bạn thường xuyên dừng lại hoặc ngập ngừng lâu, gây khó khăn cho việc theo dõi tính liên kết.";
      lexical = "Vốn từ vựng hạn chế, chỉ xoay quanh các từ rất đơn giản. Gặp khó khăn khi nói về các khía cạnh khác nhau của chủ đề.";
      grammar = "Cấu trúc ngữ pháp rất đơn giản và thường có lỗi nghiêm trọng khi chia động từ hoặc sắp xếp trật tự từ.";
      steps = [
        "Mỗi câu trả lời cần nói tối thiểu 3-4 câu đầy đủ để tăng điểm trôi chảy.",
        "Luyện tập cấu trúc câu phức cơ bản bằng cách sử dụng các từ nối phụ thuộc như 'because', 'although'."
      ];
    }

    // Model answers based on topics
    let modelAnswer = "";
    if (this.currentTopic === 'intro') {
      modelAnswer = "My full name is Vo Quy, and you can call me Quy. In my spare time, I really enjoy playing football and listening to music. Doing sports helps me relax after a long day of study, and music helps me clear my mind. I come from Ho Chi Minh City, which is a very crowded and energetic city in Vietnam. There are many delicious foods and attractive places to visit there.";
    } else if (this.currentTopic === 'restaurant') {
      modelAnswer = "Yes, I would like to order a medium-cooked beef steak, please. For the side dish, a fresh green salad would be perfect. I would also like to have a bottle of mineral water. Everything was absolutely delicious, and the service was very fast. Thank you very much, I would like to pay by card tonight.";
    } else {
      modelAnswer = "I would like to describe a time when I had to solve a difficult problem at my school. Last semester, my team had a group project, but one member suddenly got sick and couldn't complete their part. It was very stressful because the deadline was only two days away. However, we managed to solve it by dividing the remaining tasks among other members and working together late at night. In the end, we achieved an A grade. In my opinion, schools should teach problem-solving skills to children because it is a very useful skill for their future career.";
    }

    return {
      current_overall_band: band,
      status_to_target: status,
      criteria_feedback: {
        fluency_coherence: fluency,
        lexical_resource: lexical,
        grammar: grammar
      },
      actionable_steps_for_6_0: steps,
      achievable_model_answer: modelAnswer
    };
  }

  renderFeedbackHtml(data, container) {
    const band = data.current_overall_band || 0.0;
    const status = data.status_to_target || "Below Target";
    
    // Status color mapping
    let statusClass = "status-below";
    let statusVi = "Chưa đạt mục tiêu (6.0)";
    if (status === "Achieved Target") {
      statusClass = "status-achieved";
      statusVi = "Đạt mục tiêu (6.0)";
    } else if (status === "Above Target") {
      statusClass = "status-above";
      statusVi = "Vượt mục tiêu (6.0+)";
    }

    const fluency = data.criteria_feedback?.fluency_coherence || "";
    const lexical = data.criteria_feedback?.lexical_resource || "";
    const grammar = data.criteria_feedback?.grammar || "";
    const steps = data.actionable_steps_for_6_0 || [];
    const modelAnswer = data.achievable_model_answer || "";

    const stepsHtml = steps.map(step => `<li class="speaking-action-item">✓ ${step}</li>`).join("");

    container.innerHTML = `
      <div class="speaking-feedback-report">
        <div class="speaking-feedback-header" style="display: flex; gap: 2rem; margin-bottom: 1.5rem; justify-content: center; flex-wrap: wrap;">
          <div class="speaking-band-badge-container" style="text-align: center;">
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">ĐIỂM ĐÁNH GIÁ</span>
            <div class="speaking-band-badge" style="font-size: 2.2rem; font-weight: 800; color: white; background: var(--primary-color); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; box-shadow: var(--shadow-md);">${band.toFixed(1)}</div>
          </div>
          <div class="speaking-status-badge-container" style="text-align: center; display: flex; flex-direction: column; justify-content: center;">
            <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.25rem;">TRẠNG THÁI MỤC TIÊU</span>
            <div class="speaking-status-badge ${statusClass}" style="font-weight: 700; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.95rem; color: white;">${statusVi}</div>
          </div>
        </div>

        <div class="speaking-criteria-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div class="speaking-criterion-card" style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem;">
            <h4 style="margin-top: 0; color: var(--primary-color); font-size: 0.95rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">🗣️ Fluency & Coherence</h4>
            <p style="font-size: 0.85rem; line-height: 1.5; margin: 0.5rem 0 0 0; color: var(--text-color);">${fluency}</p>
          </div>
          <div class="speaking-criterion-card" style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem;">
            <h4 style="margin-top: 0; color: var(--primary-color); font-size: 0.95rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">📚 Lexical Resource</h4>
            <p style="font-size: 0.85rem; line-height: 1.5; margin: 0.5rem 0 0 0; color: var(--text-color);">${lexical}</p>
          </div>
          <div class="speaking-criterion-card" style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem;">
            <h4 style="margin-top: 0; color: var(--primary-color); font-size: 0.95rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">✍️ Grammatical Range</h4>
            <p style="font-size: 0.85rem; line-height: 1.5; margin: 0.5rem 0 0 0; color: var(--text-color);">${grammar}</p>
          </div>
        </div>

        ${steps.length > 0 ? `
          <div class="speaking-steps-section" style="margin-bottom: 1.5rem; background: rgba(var(--primary-color-rgb, 9, 132, 227), 0.05); padding: 1rem; border-radius: var(--radius-md); border-left: 4px solid var(--primary-color);">
            <h4 style="margin-top:0; color: var(--text-color); font-size: 1rem;">💡 Bước cải thiện cụ thể để đạt Band 6.0+:</h4>
            <ul class="speaking-steps-list" style="margin: 0.5rem 0 0 0; padding-left: 1.25rem; font-size: 0.85rem; line-height: 1.5; list-style-type: none;">
              ${steps.map(step => `<li class="speaking-action-item" style="position: relative; margin-bottom: 0.4rem; padding-left: 0.5rem;">✓ ${step}</li>`).join("")}
            </ul>
          </div>
        ` : ''}

        ${modelAnswer ? `
          <div class="speaking-model-answer-section" style="background: var(--bg-color); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
              <h4 style="margin:0; font-size: 0.95rem; color: var(--primary-color);">🎯 Bài mẫu gợi ý (Band 6.5 - 7.0):</h4>
              <button class="btn btn-secondary btn-sm" id="btn-speak-model-answer" style="padding: 4px 10px; font-size: 0.8rem; display: flex; align-items: center; gap: 4px;">🔊 Nghe bài mẫu</button>
            </div>
            <div class="speaking-model-answer-box" style="font-size: 0.9rem; line-height: 1.5; font-style: italic; color: var(--text-color); padding: 0.75rem; background: var(--panel-bg); border-radius: var(--radius-sm); border: 1px dashed var(--border-color);">
              "${modelAnswer}"
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // Hook up play button for model answer
    const speakBtn = container.querySelector("#btn-speak-model-answer");
    if (speakBtn && modelAnswer) {
      speakBtn.onclick = () => {
        app.speak(modelAnswer, 0.88);
      };
    }
  }
}

const speaking = new SpeakingModule();
