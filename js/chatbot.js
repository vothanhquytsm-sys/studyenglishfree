// EnglishFree - AI English Teacher Chatbot Module

class ChatbotModule {
  constructor() {
    this.currentTopic = 'chat'; // 'chat', 'grammar', 'lesson'
    this.recognition = null;
    this.isRecording = false;
    this.dialogueHistory = [];
    this.lessonData = null;
    
    // System Prompts matching the python codebase
    this.chatbotSystemPrompt = `Bạn là một người bạn và trợ lý học tiếng Anh thân thiện tên là Janet.

Nhiệm vụ của bạn:
- Khi bạn học nhắn tin, hãy trả lời bằng tiếng Anh trước, sau đó giải thích bằng tiếng Việt.
- Trong giao tiếp tiếng Việt, hãy xưng hô là "mình" và gọi đối phương là "bạn".
- Đối phương có thể đặt câu hỏi bằng tiếng Anh hoặc tiếng Việt. Bạn phải hiểu và xử lý được cả hai.
- Nếu đối phương viết câu sai, hãy:
  1. Chỉ ra lỗi sai chính xác.
  2. Giải thích tại sao sai bằng tiếng Việt (xưng hô mình - bạn).
  3. Đưa ra ví dụ sửa đúng.
- Khi trả lời câu hỏi, hãy giải thích rõ ràng, dễ hiểu.
- Duy trì thái độ thân thiện, khích lệ và tự nhiên của một người bạn.
- Có thể hỏi ngược lại đối phương để kích thích suy nghĩ và thực hành.
- Khi trả lời, xuống dòng bằng ký tự \n. Không viết liền một đoạn.

⚠️ QUY ĐỊNH QUAN TRỌNG:
- Luôn trả về DUY NHẤT JSON thuần.
- KHÔNG được dùng bất kỳ dạng markdown nào:
  ❌ không \`\`\`json
  ❌ không \`\`\`
  ❌ không *, _, #, hoặc ký tự trang trí khác
  ❌ không để bất kỳ chữ nào bên ngoài khối JSON.
- Không thêm lời chào, giới thiệu, hoặc văn bản ngoài JSON.

Cấu trúc JSON bắt buộc:
{
  "response_english": "Câu trả lời bằng tiếng Anh, có xuống dòng \n nếu cần",
  "explanation_vietnamese": "Giải thích bằng tiếng Việt, có xuống dòng \n",
  "correction": "Sửa câu nếu đối phương sai, hoặc để trống nếu không có lỗi"
}

Ví dụ đúng:
{
  "response_english": "I went to school yesterday.\nThis is the correct past tense form.",
  "explanation_vietnamese": "Bạn đã dùng sai thì quá khứ rồi nè.\nĐộng từ 'go' đổi thành 'went' trong quá khứ nhé.",
  "correction": "I went to school yesterday."
}`;

    this.grammarSystemPrompt = `Bạn là một trợ lý học tiếng Anh thân thiện tên là Janet.
Nhiệm vụ của bạn là sửa lỗi ngữ pháp và giải thích chi tiết cho câu bạn học gửi. Trong giao tiếp bằng tiếng Việt, hãy xưng hô là "mình" và gọi đối phương là "bạn".
Định dạng câu trả lời bằng JSON thuần giống hệt như sau, không có markdown hay text khác ngoài JSON:
{
  "response_english": "Sentence corrected or rewritten naturally, with explanations of structural points.",
  "explanation_vietnamese": "Giải thích ngữ pháp chi tiết bằng tiếng Việt (xưng hô mình - bạn), các cấu trúc cần lưu ý, ví dụ tương đương.",
  "correction": "Câu tiếng Anh đã được sửa đúng ngữ pháp hoàn chỉnh (để trống nếu câu bạn học gửi đã hoàn toàn chính xác)"
}`;

    this.lessonGeneratePrompt = `Bạn là một trợ lý học tiếng Anh chuyên nghiệp tên là Janet. 
Hãy soạn một bài học tiếng Anh ngắn gọn, chất lượng cao theo chủ đề: {topic}.
Định dạng trả về là JSON thuần, KHÔNG CÓ MARKDOWN WRAPPER (\`\`\`json), KHÔNG CÓ TEXT ngoài JSON.

Cấu trúc JSON bắt buộc:
{
  "topic": "{topic}",
  "vocabulary": [
    {
      "word": "từ vựng",
      "pronunciation": "/phát âm IPA/",
      "english_meaning": "định nghĩa tiếng Anh ngắn gọn",
      "vietnamese_meaning": "nghĩa tiếng Việt",
      "example": "câu ví dụ tiếng Anh",
      "example_translation": "dịch tiếng Việt câu ví dụ"
    }
  ],
  "example_sentences": [
    {
      "english": "câu ví dụ tiếng Anh sử dụng cấu trúc hay",
      "translation": "dịch câu ví dụ sang tiếng Việt"
    }
  ],
  "conversation": [
    {
      "speaker": "Janet",
      "text": "Câu nói tiếng Anh",
      "translation": "Dịch tiếng Việt"
    },
    {
      "speaker": "Student",
      "text": "Câu trả lời tiếng Anh",
      "translation": "Dịch tiếng Việt"
    }
  ],
  "exercises": [
    {
      "type": "fill_in_blank",
      "question": "Câu có chỗ trống ___ để điền từ (ví dụ: She ___ to school everyday.)",
      "options": ["go", "goes", "going", "went"],
      "answer": "goes",
      "explanation": "Giải thích chi tiết tại sao chọn đáp án này"
    }
  ]
}`;
  }

  init() {
    this.initSpeechRecognition();
  }

  applyVoiceSettings() {
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
        const micBtn = document.getElementById('btn-chatbot-mic');
        if (micBtn) micBtn.style.backgroundColor = 'var(--danger-color)';
        const alertEl = document.getElementById('chatbot-status-alert');
        if (alertEl) alertEl.style.display = 'block';
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        const micBtn = document.getElementById('btn-chatbot-mic');
        if (micBtn) micBtn.style.backgroundColor = '';
        const alertEl = document.getElementById('chatbot-status-alert');
        if (alertEl) alertEl.style.display = 'none';
      };

      this.recognition.onresult = (event) => {
        const spokenText = event.results[0][0].transcript;
        const inputEl = document.getElementById('chatbot-text-input');
        if (inputEl) inputEl.value = spokenText;
      };

      this.recognition.onerror = (e) => {
        console.error("Chatbot SpeechRecognition error", e);
        this.isRecording = false;
        const alertEl = document.getElementById('chatbot-status-alert');
        if (alertEl) alertEl.style.display = 'none';
      };
    }
  }

  toggleMic() {
    if (!this.recognition) {
      app.showToast('Nhận diện giọng nói không khả dụng trên trình duyệt này. Bạn hãy gõ văn bản nhé!', 'info');
      return;
    }
    if (this.isRecording) {
      this.recognition.stop();
    } else {
      this.recognition.start();
    }
  }

  selectTopic(topicId) {
    this.currentTopic = topicId;
    
    // Update active button state
    document.querySelectorAll('[id^="chatbot-topic-"]').forEach(btn => btn.classList.remove('active'));
    const btnEl = document.getElementById(`chatbot-topic-${topicId}`);
    if (btnEl) btnEl.classList.add('active');

    // Show/hide lesson topic input container
    const lessonInputContainer = document.getElementById('chatbot-lesson-topic-input-container');
    if (lessonInputContainer) {
      lessonInputContainer.style.display = topicId === 'lesson' ? 'flex' : 'none';
    }

    // Hide lesson panel on switch
    const lessonPanel = document.getElementById('chatbot-lesson-panel');
    if (lessonPanel) lessonPanel.style.display = 'none';

    this.startConversation();
  }

  startConversation(shouldSpeak = true) {
    this.dialogueHistory = [];
    const chatContainer = document.getElementById('chatbot-chat-messages');
    if (chatContainer) chatContainer.innerHTML = '';
    
    const inputEl = document.getElementById('chatbot-text-input');
    if (inputEl) inputEl.value = '';

    let welcomeMsg = "";
    if (this.currentTopic === 'chat') {
      welcomeMsg = "Hello! I am Janet. Let's chat in English! I will check and correct your spelling and grammar as we converse. How is your day going?";
      this.addChatBubble({ response_english: welcomeMsg, explanation_vietnamese: "Xin chào! Mình là Janet. Chúng ta hãy cùng trò chuyện bằng tiếng Anh nhé! Mình sẽ kiểm tra và sửa lỗi chính tả, ngữ pháp cho bạn trong quá trình nói chuyện. Ngày hôm nay của bạn thế nào rồi?" }, 'ai');
      if (shouldSpeak) app.speak(welcomeMsg, 0.88);
    } else if (this.currentTopic === 'grammar') {
      welcomeMsg = "Please send me any English sentence or paragraph you'd like me to review. I'll check it, correct any mistakes, and explain the grammar points!";
      this.addChatBubble({ response_english: welcomeMsg, explanation_vietnamese: "Bạn hãy gửi câu hoặc đoạn văn tiếng Anh muốn mình kiểm tra nhé. Mình sẽ sửa lỗi sai và giải thích chi tiết cấu trúc ngữ pháp cho bạn!" }, 'ai');
      if (shouldSpeak) app.speak(welcomeMsg, 0.88);
    } else if (this.currentTopic === 'lesson') {
      welcomeMsg = "Please enter a topic in the input box above, and I will generate a vocabulary lesson and dynamic exercises for you!";
      this.addChatBubble({ response_english: welcomeMsg, explanation_vietnamese: "Bạn hãy nhập chủ đề học ở khung phía trên, mình sẽ biên soạn một bài học kèm bài tập thực hành dành riêng cho bạn!" }, 'ai');
      if (shouldSpeak) app.speak(welcomeMsg, 0.88);
    }
  }

  addChatBubble(data, sender) {
    const container = document.getElementById('chatbot-chat-messages');
    if (!container) return;

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    
    if (sender === 'user') {
      bubble.textContent = data;
    } else {
      const englishText = data.response_english || "";
      const vietnameseText = data.explanation_vietnamese || "";
      const correction = data.correction || "";

      let html = `
        <div style="font-weight: 700; color: var(--primary-color); display: flex; align-items: center; justify-content: space-between; gap: 8px; border-bottom: 1px dashed var(--border-color); padding-bottom: 4px; margin-bottom: 6px; font-size: 0.85rem;">
          <span>👩‍🏫 Janet</span>
          <button class="btn-tts-read" style="background:none; border:none; cursor:pointer; font-size:1rem; padding:0; color: var(--text-muted);" title="Phát âm">🔊</button>
        </div>
        <div class="english-box" style="font-weight: 600; font-size: 0.95rem; line-height: 1.5; color: var(--text-color);">${englishText.replace(/\n/g, '<br/>')}</div>
        <div class="vietnamese-box" style="color: var(--text-muted); font-size: 0.85rem; padding-top: 6px; margin-top: 6px; border-top: 1px dashed var(--border-color); line-height: 1.4;">${vietnameseText.replace(/\n/g, '<br/>')}</div>
      `;

      if (correction) {
        html += `
          <div style="background: rgba(245, 158, 11, 0.1); border-left: 3px solid #d97706; padding: 6px 10px; margin-top: 8px; border-radius: var(--radius-sm); font-size: 0.85rem;">
            <strong style="color: #b45309;">💡 Câu đúng gợi ý:</strong>
            <div style="font-style: italic; margin-top: 2px; color: var(--text-color); font-weight:500;">${correction}</div>
          </div>
        `;
      }

      bubble.innerHTML = html;

      // Hook up read button
      const readBtn = bubble.querySelector('.btn-tts-read');
      if (readBtn) {
        readBtn.onclick = (e) => {
          e.stopPropagation();
          app.speak(englishText, 0.88);
        };
      }
    }

    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  }

  handleInputKeydown(event) {
    if (event.key === 'Enter') {
      this.sendUserMessage();
    }
  }

  async sendUserMessage() {
    const inputEl = document.getElementById('chatbot-text-input');
    if (!inputEl) return;
    const text = inputEl.value.trim();
    if (!text) return;

    inputEl.value = '';
    this.addChatBubble(text, 'user');
    
    // Add to history
    this.dialogueHistory.push({ role: 'user', content: text });

    if (this.isRecording) {
      this.recognition.stop();
    }

    // AI thinking state
    const chatContainer = document.getElementById('chatbot-chat-messages');
    const loadingBubble = document.createElement('div');
    loadingBubble.className = 'chat-bubble loading-bubble';
    loadingBubble.textContent = 'Janet đang nhập tin nhắn...';
    Object.assign(loadingBubble.style, {
      alignSelf: 'flex-start',
      backgroundColor: 'var(--panel-bg)',
      color: 'var(--text-muted)',
      border: '1px solid var(--border-color)',
      padding: '0.85rem 1rem',
      borderRadius: 'var(--radius-md)',
      margin: '0.8rem 0',
      fontSize: '0.85rem',
      fontStyle: 'italic'
    });
    chatContainer.appendChild(loadingBubble);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
      let aiResult = null;
      const sysPrompt = this.currentTopic === 'grammar' ? this.grammarSystemPrompt : this.chatbotSystemPrompt;
      
      // Assemble conversation history for AI (keep last 10 messages to save tokens)
      const recentHistory = this.dialogueHistory.slice(-10);
      const historyStr = recentHistory.map(h => `${h.role === 'user' ? 'Bạn học' : 'Janet'}: ${h.content}`).join('\n');
      
      const response = await app.callAI(sysPrompt, `Lịch sử hội thoại:\n${historyStr}\n\nBạn học nói: ${text}`);
      if (response) {
        try {
          let cleanResponse = response.trim();
          if (cleanResponse.startsWith("```")) {
            cleanResponse = cleanResponse.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
          }
          aiResult = JSON.parse(cleanResponse);
        } catch (jsonErr) {
          console.error("Chatbot JSON parse error", jsonErr, response);
          // Construct a basic structured object if JSON parsing failed
          aiResult = {
            response_english: "I understand. Let's keep practicing!",
            explanation_vietnamese: "Mình hiểu rồi. Chúng ta hãy tiếp tục luyện tập nhé! (Lưu ý: Phản hồi của hệ thống lỗi định dạng JSON: " + jsonErr.message + ")",
            correction: ""
          };
        }
      }

      // Remove loading bubble
      loadingBubble.remove();

      if (!aiResult) {
        aiResult = {
          response_english: "Sorry, I am having trouble connecting to my brain right now. Please check your network connection.",
          explanation_vietnamese: "Xin lỗi bạn, mình đang gặp chút trục trặc kết nối. Hãy kiểm tra lại mạng Internet nhé.",
          correction: ""
        };
      }

      this.addChatBubble(aiResult, 'ai');
      this.dialogueHistory.push({ role: 'ai', content: aiResult.response_english });
      app.speak(aiResult.response_english, 0.88);

    } catch (err) {
      console.error("Error sending message to Chatbot:", err);
      if (loadingBubble.parentNode) {
        loadingBubble.remove();
      }
      this.addChatBubble({
        response_english: "Oops! An error occurred. Let's try again.",
        explanation_vietnamese: "Đã có lỗi xảy ra trong quá trình trao đổi. Chúng ta thử lại câu khác nhé!",
        correction: ""
      }, 'ai');
    }
  }

  async generateLesson() {
    const topicInput = document.getElementById('chatbot-lesson-topic-input');
    if (!topicInput) return;
    const topic = topicInput.value.trim();
    if (!topic) {
      app.showToast('Vui lòng nhập chủ đề bài học!', 'warning');
      return;
    }

    const lessonPanel = document.getElementById('chatbot-lesson-panel');
    const lessonTitle = document.getElementById('chatbot-lesson-title');
    const lessonContent = document.getElementById('chatbot-lesson-content');

    lessonPanel.style.display = 'flex';
    lessonTitle.textContent = `📖 Soạn bài: ${topic}...`;
    lessonContent.innerHTML = '<p style="color:var(--text-muted); font-style:italic;">AI đang chuẩn bị nội dung bài học từ vựng, hội thoại và bài tập mẫu...</p>';

    try {
      let lessonData = null;
      const prompt = this.lessonGeneratePrompt.replace(/{topic}/g, topic);
      const reply = await app.callAI(prompt, `Hãy tạo bài học tiếng Anh cho chủ đề: ${topic}`);
      if (reply) {
        try {
          let cleanReply = reply.trim();
          if (cleanReply.startsWith("```")) {
            cleanReply = cleanReply.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
          }
          lessonData = JSON.parse(cleanReply);
        } catch (jsonErr) {
          console.error("Lesson generation JSON parse failed", jsonErr, reply);
        }
      }

      if (!lessonData) {
        lessonContent.innerHTML = '<p style="color:var(--danger-color);">Không thể tạo bài học. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại chủ đề khác!</p>';
        return;
      }

      this.lessonData = lessonData;
      lessonTitle.textContent = `📖 Bài học: ${lessonData.topic}`;
      
      // Render vocabulary
      let html = '<h4 style="color:var(--primary-color); margin-bottom: 0.5rem; margin-top: 1rem;">1. Từ vựng trọng tâm (Vocabulary)</h4>';
      html += '<div style="display:flex; flex-direction:column; gap:8px; margin-bottom: 1.5rem;">';
      lessonData.vocabulary.forEach((v, idx) => {
        html += `
          <div style="background:var(--bg-color); border:1px solid var(--border-color); padding:10px 12px; border-radius:var(--radius-sm);">
            <strong>${idx+1}. ${v.word}</strong> <span style="color:var(--text-muted); font-size:0.85rem; font-family:monospace;">${v.pronunciation}</span>: 
            <span style="font-weight:500; color:var(--primary-color);">${v.vietnamese_meaning}</span>
            <div style="font-style:italic; font-size:0.85rem; color:var(--text-muted); margin-top:3px;">
              e.g. "${v.example}" (${v.example_translation})
            </div>
          </div>
        `;
      });
      html += '</div>';

      // Render example sentences
      html += '<h4 style="color:var(--primary-color); margin-bottom: 0.5rem;">2. Câu mẫu tham khảo (Examples)</h4>';
      html += '<ul style="padding-left: 1.25rem; margin-bottom: 1.5rem; line-height: 1.6; display: flex; flex-direction: column; gap: 4px;">';
      lessonData.example_sentences.forEach(s => {
        html += `<li><strong>${s.english}</strong> - <span style="color:var(--text-muted);">${s.translation}</span></li>`;
      });
      html += '</ul>';

      // Render conversation
      html += '<h4 style="color:var(--primary-color); margin-bottom: 0.5rem;">3. Hội thoại thực hành (Conversation)</h4>';
      html += '<div style="background:var(--panel-bg); border:1px solid var(--border-color); padding:12px 15px; border-radius:var(--radius-md); margin-bottom: 1.5rem; display:flex; flex-direction:column; gap:8px;">';
      lessonData.conversation.forEach(c => {
        html += `
          <div>
            <strong>${c.speaker}:</strong> "${c.text}"
            <div style="font-size:0.85rem; color:var(--text-muted); font-style:italic;">(${c.translation})</div>
          </div>
        `;
      });
      html += '</div>';

      // Render exercises
      html += '<h4 style="color:var(--primary-color); margin-bottom: 0.5rem;">4. Luyện tập nhanh (Practice)</h4>';
      html += '<div id="chatbot-lesson-exercises" style="display:flex; flex-direction:column; gap:12px;">';
      lessonData.exercises.forEach((ex, idx) => {
        html += `
          <div class="exercise-item-panel" style="background:var(--bg-color); border:1px solid var(--border-color); padding:12px 15px; border-radius:var(--radius-md);" data-answer="${ex.answer}">
            <strong style="color:var(--primary-color);">Câu ${idx+1}:</strong> ${ex.question.replace('___', '<span style="border-bottom: 2px solid var(--primary-color); width: 60px; display: inline-block; text-align: center;">&nbsp;</span>')}
            <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top: 10px;">
              ${ex.options.map(opt => `
                <button class="btn btn-secondary btn-sm btn-exercise-option" onclick="chatbot.checkExerciseAnswer(this, '${opt}', '${ex.answer}', '${ex.explanation.replace(/'/g, "\\'")}')" style="padding: 6px 12px; font-size: 0.85rem;">${opt}</button>
              `).join("")}
            </div>
            <div class="exercise-feedback" style="display:none; margin-top: 8px; font-size: 0.85rem; padding: 6px 10px; border-radius: var(--radius-sm); line-height: 1.4;"></div>
          </div>
        `;
      });
      html += '</div>';

      lessonContent.innerHTML = html;
    } catch (err) {
      console.error("Error creating lesson:", err);
      lessonContent.innerHTML = '<p style="color:var(--danger-color);">Có lỗi hệ thống khi chuẩn bị bài học. Vui lòng kiểm tra lại!</p>';
    }
  }

  checkExerciseAnswer(buttonEl, selectedOption, correctAnswer, explanation) {
    const parentPanel = buttonEl.closest('.exercise-item-panel');
    if (!parentPanel) return;

    // Disable other buttons
    parentPanel.querySelectorAll('.btn-exercise-option').forEach(btn => {
      btn.disabled = true;
      if (btn.textContent === correctAnswer) {
        btn.style.backgroundColor = '#10b981';
        btn.style.color = 'white';
        btn.style.borderColor = '#10b981';
      }
    });

    const feedbackDiv = parentPanel.querySelector('.exercise-feedback');
    feedbackDiv.style.display = 'block';

    if (selectedOption === correctAnswer) {
      buttonEl.style.backgroundColor = '#10b981';
      buttonEl.style.color = 'white';
      buttonEl.style.borderColor = '#10b981';
      feedbackDiv.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
      feedbackDiv.style.color = '#065f46';
      feedbackDiv.innerHTML = `<strong>🎉 Chính xác!</strong> ${explanation}`;
    } else {
      buttonEl.style.backgroundColor = '#ef4444';
      buttonEl.style.color = 'white';
      buttonEl.style.borderColor = '#ef4444';
      feedbackDiv.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
      feedbackDiv.style.color = '#991b1b';
      feedbackDiv.innerHTML = `<strong>❌ Chưa đúng!</strong> Đáp án chính xác là <strong>${correctAnswer}</strong>. ${explanation}`;
    }
  }
}

const chatbot = new ChatbotModule();
