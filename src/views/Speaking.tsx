import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { callAI } from '../services/ai';
import { CloudSync } from '../services/cloudsync';
import { Send, MessageSquare } from 'lucide-react';

interface ChatBubble {
  role: 'user' | 'assistant';
  content: {
    response_english: string;
    explanation_vietnamese: string;
    correction?: string;
  };
}

export const Speaking: React.FC = () => {
  const { voiceGender, showToast, currentUser } = useApp();

  // ─── CHATBOT JANET STATES ────────────────────────────────────────────
  const [chatTopic, setChatTopic] = useState<'chat' | 'grammar'>('chat');
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatBubble[]>([]);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, aiLoading]);

  // Load chat history from JSONBin on mount or username change
  useEffect(() => {
    if (currentUser) {
      setAiLoading(true);
      CloudSync.getChatHistory(30).then(history => {
        if (history && history.length > 0) {
          const formatted: ChatBubble[] = history.map(h => {
            let parsedContent = { response_english: h.content, explanation_vietnamese: '' };
            if (h.role === 'assistant') {
              try {
                parsedContent = JSON.parse(h.content);
              } catch {
                parsedContent = { response_english: h.content, explanation_vietnamese: '' };
              }
            }
            return {
              role: h.role,
              content: parsedContent
            };
          });
          setChatMessages(formatted);
        } else {
          // Initialize welcome message
          setChatMessages([
            {
              role: 'assistant',
              content: {
                response_english: "Hello! I am Janet. Let's chat in English! I will check and correct your spelling and grammar as we converse. How is your day going?",
                explanation_vietnamese: "Xin chào! Mình là Janet. Chúng ta hãy cùng trò chuyện bằng tiếng Anh nhé! Mình sẽ kiểm tra và sửa lỗi chính tả, ngữ pháp cho bạn trong quá trình nói chuyện. Ngày hôm nay của bạn thế nào rồi?"
              }
            }
          ]);
        }
        setAiLoading(false);
      }).catch(() => {
        setAiLoading(false);
      });
    }
  }, [currentUser]);

  // ─── CHATBOT JANET LOGIC ─────────────────────────────────────────────
  const speakChatText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = voiceGender === 'female' ? 'en-US' : 'en-GB';
    utter.rate = 0.88;
    window.speechSynthesis.speak(utter);
  };

  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = chatInput.trim();
    if (!text || aiLoading) return;

    setChatInput('');
    const userMsg: ChatBubble = {
      role: 'user',
      content: { response_english: text, explanation_vietnamese: '' }
    };
    setChatMessages(prev => [...prev, userMsg]);

    // Save to Cloud
    if (currentUser) {
      CloudSync.saveChatMessage('user', text);
    }

    setAiLoading(true);

    try {
      const sysPrompt = chatTopic === 'grammar' 
        ? `Bạn là một trợ lý học tiếng Anh thân thiện tên là Janet. Nhiệm vụ của bạn là sửa lỗi ngữ pháp và giải thích chi tiết cho câu bạn học gửi. Trong giao tiếp bằng tiếng Việt, hãy xưng hô là "mình" và gọi đối phương là "bạn". Định dạng câu trả lời bằng JSON thuần giống hệt như sau: { "response_english": "corrected sentence + explanation", "explanation_vietnamese": "giải thích ngữ pháp bằng tiếng Việt", "correction": "câu đã sửa đúng ngữ pháp (để trống nếu câu đã đúng)" }`
        : `Bạn là một người bạn và trợ lý học tiếng Anh thân thiện tên là Janet. Nhiệm vụ của bạn: Trả lời bằng tiếng Anh trước, giải thích bằng tiếng Việt sau (xưng hô mình - bạn). Chỉ lỗi sai chính xác nếu có. Định dạng câu trả lời bắt buộc là JSON thuần: { "response_english": "câu trả lời tiếng Anh", "explanation_vietnamese": "giải thích tiếng Việt", "correction": "câu sửa lại nếu sai, hoặc để trống" }`;

      // Build recent history (keep last 10 messages)
      const historyStr = chatMessages
        .slice(-10)
        .map(h => `${h.role === 'user' ? 'Bạn học' : 'Janet'}: ${h.content.response_english}`)
        .join('\n');

      const response = await callAI(sysPrompt, `Lịch sử hội thoại:\n${historyStr}\n\nBạn học nói: ${text}`);

      let aiResult = { response_english: 'I apologize, I am experiencing server difficulties.', explanation_vietnamese: 'Mình đang gặp chút trục trặc kết nối. Bạn thử lại nhé.', correction: '' };
      
      if (response) {
        try {
          let cleanStr = response.trim();
          if (cleanStr.startsWith('```')) {
            cleanStr = cleanStr.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
          }
          aiResult = JSON.parse(cleanStr);
        } catch {
          aiResult = {
            response_english: response,
            explanation_vietnamese: 'Mình đã nhận được phản hồi từ Janet.',
            correction: ''
          };
        }
      }

      const aiMsg: ChatBubble = {
        role: 'assistant',
        content: aiResult
      };

      setChatMessages(prev => [...prev, aiMsg]);
      speakChatText(aiResult.response_english);

      // Save reply to Cloud
      if (currentUser) {
        CloudSync.saveChatMessage('assistant', JSON.stringify(aiResult));
      }

    } catch (err) {
      console.error(err);
      showToast('Không thể kết nối trợ lý AI Janet.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (window.confirm('Bạn có muốn xóa toàn bộ lịch sử hội thoại hiện tại?')) {
      setChatMessages([]);
      await CloudSync.clearChatHistory();
      showToast('Đã xóa lịch sử chat.', 'info');
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden animate-fadeIn">
      {/* Sidebar navigation settings */}
      <aside className="w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2.5 bg-slate-50/50 dark:bg-slate-900/30">
          <MessageSquare size={16} className="text-indigo-600" />
          <span className="text-[10px] font-bold text-slate-400">TRÒ CHUYỆN VỚI JANET</span>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-450 dark:text-slate-400">Chủ đề trò chuyện</label>
            <select
              value={chatTopic}
              onChange={(e) => {
                setChatTopic(e.target.value as any);
                setChatMessages([]);
              }}
              className="w-full p-2.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none text-slate-700 dark:text-slate-300"
            >
              <option value="chat">Trò chuyện tự do (Free Chat)</option>
              <option value="grammar">Sửa lỗi ngữ pháp (Grammar Correction)</option>
            </select>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Hãy đặt câu hỏi bằng tiếng Anh, Janet sẽ kiểm tra chính xác ngữ pháp, sửa lại câu và đối thoại tự nhiên cùng bạn.
          </p>
          <button
            onClick={handleClearChat}
            className="w-full py-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg hover:bg-rose-100 cursor-pointer transition"
          >
            Xóa lịch sử chat
          </button>
        </div>
      </aside>

      {/* Main Workspace Panel */}
      <main className="flex-grow bg-slate-50 dark:bg-slate-900 p-6 overflow-hidden">
        <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-112px)] bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Conversation Messages Box */}
          <div className="flex-grow overflow-y-auto p-6 space-y-6 scrollbar-thin flex flex-col">
            {chatMessages.map((msg, idx) => {
              const isAI = msg.role === 'assistant';
              return (
                <div
                  key={idx}
                  className={`flex gap-3 max-w-[85%] ${
                    isAI ? 'self-start' : 'self-end flex-row-reverse ml-auto'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 ${
                    isAI ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {isAI ? 'J' : 'U'}
                  </div>

                  {/* Bubble body */}
                  <div className={`rounded-2xl p-4 text-xs border ${
                    isAI
                      ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-850 space-y-3 text-left'
                      : 'bg-indigo-600 text-white border-indigo-600 text-left'
                  }`}>
                    {isAI ? (
                      <>
                        <div className="flex justify-between items-center gap-4 border-b border-slate-200/50 dark:border-slate-700 pb-1.5">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">Janet</span>
                          <button
                            onClick={() => speakChatText(msg.content.response_english)}
                            className="text-[10px] p-0.5 hover:bg-slate-250 dark:hover:bg-slate-700 rounded-full cursor-pointer transition"
                            title="Nghe nói"
                          >
                            🔊
                          </button>
                        </div>

                        <div className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                          {msg.content.response_english}
                        </div>

                        {msg.content.explanation_vietnamese && (
                          <div className="text-slate-450 dark:text-slate-400 text-[10px] leading-relaxed border-t border-slate-100 dark:border-slate-850 pt-2 whitespace-pre-line italic">
                            {msg.content.explanation_vietnamese}
                          </div>
                        )}

                        {msg.content.correction && (
                          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200/40 p-2.5 rounded-xl text-[10px] text-rose-500 font-bold leading-relaxed">
                            💡 <strong>Sửa câu:</strong> "{msg.content.correction}"
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="leading-relaxed whitespace-pre-line font-medium">
                        {msg.content.response_english}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* AI loading state */}
            {aiLoading && (
              <div className="flex gap-3 max-w-[85%] self-start animate-pulse">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">J</div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 text-xs border border-slate-100 dark:border-slate-850 text-slate-400 italic">
                  Janet đang soạn tin nhắn...
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Chat Send Form */}
          <form
            onSubmit={handleSendChatMessage}
            className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 flex gap-2 flex-shrink-0"
          >
            <input
              type="text"
              value={chatInput}
              disabled={aiLoading}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Trò chuyện bằng tiếng Anh với Janet..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition text-slate-700 dark:text-slate-350"
            />
            <button
              type="submit"
              disabled={aiLoading || !chatInput.trim()}
              className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center cursor-pointer transition shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Speaking;
