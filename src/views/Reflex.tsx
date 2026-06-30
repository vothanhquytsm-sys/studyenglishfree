import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { REFLEX_SENTENCES } from '../data/reflexData';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export const Reflex: React.FC = () => {
  const { progress, saveProgress, showToast } = useApp();

  const [currentReflexIdx, setCurrentReflexIdx] = useState<number>(0);
  const [userReflexInput, setUserReflexInput] = useState<string>('');
  const [reflexHintVisible, setReflexHintVisible] = useState<boolean>(false);
  const [reflexGradeState, setReflexGradeState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [shakeReflex, setShakeReflex] = useState<boolean>(false);

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

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden animate-fadeIn">
      {/* Sidebar: 100 Sentences List */}
      <aside className="w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
          <span className="text-[10px] font-bold text-slate-400">100 CÂU PHẢN XẠ DỊCH</span>
          <span className="text-[10px] font-bold text-indigo-600">
            Đạt: {progress.reflexCompleted?.length || 0}/100
          </span>
        </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-1.5 scrollbar-thin">
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
                    ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 font-semibold text-indigo-600 dark:text-indigo-400'
                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 hover:border-slate-200 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="line-clamp-1">{idx + 1}. {s.vi}</span>
                {isMastered && <span className="text-emerald-500 font-bold ml-1.5 flex-shrink-0">✓</span>}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Workspace Panel */}
      <main className="flex-grow bg-slate-50 dark:bg-slate-900 p-6 overflow-y-auto">
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

            {/* Grade output feedback wrong */}
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
      </main>
    </div>
  );
};

export default Reflex;
