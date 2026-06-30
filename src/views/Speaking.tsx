import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { REFLEX_SENTENCES } from '../data/reflexData';
import { callAI } from '../services/ai';
import { CloudSync } from '../services/cloudsync';
import { Mic, Send, RefreshCw, CheckCircle, AlertTriangle, Play } from 'lucide-react';

interface ChatBubble {
  role: 'user' | 'assistant';
  content: {
    response_english: string;
    explanation_vietnamese: string;
    correction?: string;
  };
}

export const Speaking: React.FC = () => {
  const { progress, saveProgress, voiceGender, showToast, currentUser } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'reflex' | 'janet'>('reflex');

  // ─── SPEAKING REFLEX STATES ─────────────────────────────────────────
  const [currentReflexIdx, setCurrentReflexIdx] = useState<number>(0);
  const [userReflexInput, setUserReflexInput] = useState<string>('');
  const [reflexHintVisible, setReflexHintVisible] = useState<boolean>(false);
  const [reflexGradeState, setReflexGradeState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [shakeReflex, setShakeReflex] = useState<boolean>(false);

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
    if (activeSubTab === 'janet' && currentUser) {
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
  }, [activeSubTab, currentUser]);

  // ─── REFLEX LOGIC ────────────────────────────────────────────────────
  const currentSentence = REFLEX_SENTENCES[currentReflexIdx];

  const handleCheckReflex = () => {
    const inputClean = userReflexInput.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '').toLowerCase().trim();
    const correctClean = currentSentence.en.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '').toLowerCase().trim();

    if (!inputClean) {
      setShakeReflex(true);
      showToast('Vui lòng nhập câu trả lời dịch của bạn!', 'warning');
      setTimeout(() => setShakeReflex(false), 400);
      return;
    }

    if (inputClean === correctClean) {
      setReflexGradeState('correct');
      saveProgress('reflex', currentReflexIdx);
      speakReflexAnswer(currentSentence.en);
      showToast('Chính xác! Cấu trúc ngữ pháp hoàn hảo.', 'success');
    } else {
      setReflexGradeState('wrong');
      setShakeReflex(true);
      showToast('Chưa chính xác rồi. Hãy thử lại hoặc bấm gợi ý.', 'error');
      setTimeout(() => setShakeReflex(false), 400);
    }
  };

  const speakReflexAnswer = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-GB'; // UK accent
    utter.rate = 0.85;
    window.speechSynthesis.speak(utter);
  };

  const handleNextReflex = () => {
    if (currentReflexIdx < REFLEX_SENTENCES.length - 1) {
      setCurrentReflexIdx(prev => prev + 1);
      setUserReflexInput('');
      setReflexHintVisible(false);
      setReflexGradeState('idle');
    } else {
      showToast('Chúc mừng bạn đã hoàn thành 100 câu luyện phản xạ!', 'success');
    }
  };

  const handleKeyDownReflex = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCheckReflex();
    }
  };

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
      {/* Sidebar navigation for sub-modules */}
      <aside className="w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex gap-2 flex-shrink-0">
          <button
            onClick={() => setActiveSubTab('reflex')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
              activeSubTab === 'reflex'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            Luyện Phản Xạ
          </button>
          <button
            onClick={() => setActiveSubTab('janet')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
              activeSubTab === 'janet'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            Chatbot Janet
          </button>
        </div>

        {/* Sidebar dynamic details */}
        {activeSubTab === 'reflex' ? (
          <div className="flex-grow flex flex-col min-h-0">
            {/* Reflex sentences list */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
              <span className="text-[10px] font-bold text-slate-400">100 CÂU PHẢN XẠ</span>
              <span className="text-[10px] font-bold text-indigo-600">
                Đạt: {progress.reflexCompleted?.length || 0}/100
              </span>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-1.5">
              {REFLEX_SENTENCES.map((s, idx) => {
                const isMastered = progress.reflexCompleted?.includes(String(idx));
                const isCurrent = currentReflexIdx === idx;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentReflexIdx(idx);
                      setUserReflexInput('');
                      setReflexHintVisible(false);
                      setReflexGradeState('idle');
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition flex justify-between items-center cursor-pointer ${
                      isCurrent
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 font-semibold'
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 hover:border-slate-200'
                    }`}
                  >
                    <span className="line-clamp-1">{idx + 1}. {s.vi}</span>
                    {isMastered && <span className="text-emerald-500 font-bold ml-1.5 flex-shrink-0">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          // Chat settings
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Chủ đề trò chuyện</label>
              <select
                value={chatTopic}
                onChange={(e) => {
                  setChatTopic(e.target.value as any);
                  setChatMessages([]);
                }}
                className="w-full p-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none"
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
        )}
      </aside>

      {/* Main Workspace Panel */}
      <main className="flex-grow bg-slate-50 dark:bg-slate-900 p-6 overflow-y-auto">
        {/* ─── Speaking Reflex View ─── */}
        {activeSubTab === 'reflex' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
                <span className="text-xs font-extrabold text-indigo-600">Câu {currentReflexIdx + 1}/100</span>
                {progress.reflexCompleted?.includes(String(currentReflexIdx)) && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                    ✅ Đã thành thạo
                  </span>
                )}
              </div>

              {/* VI prompt */}
              <div className="space-y-1 text-center">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">DỊCH CÂU SAU SANG TIẾNG ANH:</span>
                <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100 pt-1">
                  {currentSentence.vi}
                </p>
              </div>

              {/* Translation Area */}
              <div
                className={`space-y-3 transition-transform ${
                  shakeReflex ? 'animate-shake' : ''
                }`}
              >
                <textarea
                  value={userReflexInput}
                  disabled={reflexGradeState === 'correct'}
                  onChange={(e) => setUserReflexInput(e.target.value)}
                  onKeyDown={handleKeyDownReflex}
                  placeholder="Gõ bản dịch tiếng Anh của bạn tại đây... (Nhấn Enter để kiểm tra)"
                  rows={3}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />

                <div className="flex justify-between items-center gap-3">
                  <div>
                    {reflexGradeState === 'wrong' && (
                      <button
                        onClick={() => setReflexHintVisible(true)}
                        className="px-3.5 py-2 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-lg border border-amber-200/50 hover:bg-amber-100 cursor-pointer transition"
                      >
                        Gợi ý cấu trúc
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {reflexGradeState !== 'correct' ? (
                      <button
                        onClick={handleCheckReflex}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow"
                      >
                        Kiểm tra
                      </button>
                    ) : (
                      <button
                        onClick={handleNextReflex}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow"
                      >
                        Câu tiếp theo →
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Gợi ý panel */}
              {reflexHintVisible && (
                <div className="p-4 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/30 rounded-xl space-y-2 text-xs">
                  <p className="text-slate-600 dark:text-slate-350">
                    💡 <strong>Gợi ý ngữ pháp:</strong> <span dangerouslySetInnerHTML={{ __html: currentSentence.tip }} />
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    Từ khóa: <strong className="text-indigo-600 font-semibold">{currentSentence.highlight}</strong>
                  </p>
                </div>
              )}

              {/* Grade output feedback */}
              {reflexGradeState === 'correct' && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200/40 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle size={16} />
                      Đáp án chính xác!
                    </span>
                    <button
                      onClick={() => speakReflexAnswer(currentSentence.en)}
                      className="text-base p-1 hover:bg-emerald-100/50 rounded-full cursor-pointer transition"
                      title="Nghe phát âm"
                    >
                      🔊
                    </button>
                  </div>
                  <blockquote className="font-serif italic font-bold text-slate-800 dark:text-slate-200 border-l-2 border-emerald-400 pl-2 py-0.5">
                    "{currentSentence.en}"
                  </blockquote>
                  <p className="text-[10px] text-slate-400">
                    💡 <strong>Giải cấu trúc:</strong> <span dangerouslySetInnerHTML={{ __html: currentSentence.tip }} />
                  </p>
                </div>
              )}

              {reflexGradeState === 'wrong' && (
                <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-200/40 text-xs space-y-2">
                  <span className="font-bold text-rose-500 flex items-center gap-1">
                    <AlertTriangle size={16} />
                    Chưa chính xác rồi. Hãy điều chỉnh bản dịch và thử lại.
                  </span>
                  <button
                    onClick={() => {
                      setReflexGradeState('idle');
                      setUserReflexInput('');
                    }}
                    className="text-[10px] font-bold text-indigo-600 underline cursor-pointer hover:no-underline"
                  >
                    Nhập lại bản dịch
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Chatbot Janet View ─── */}
        {activeSubTab === 'janet' && (
          <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-120px)] bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Conversation Messages Box */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
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
                              className="text-[10px] p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full cursor-pointer transition"
                              title="Nghe nói"
                            >
                              🔊
                            </button>
                          </div>

                          <div className="text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                            {msg.content.response_english}
                          </div>

                          {msg.content.explanation_vietnamese && (
                            <div className="text-slate-400 text-[10px] leading-relaxed border-t border-slate-100 dark:border-slate-850 pt-2 whitespace-pre-line italic">
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
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
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
        )}
      </main>
    </div>
  );
};

export default Speaking;
