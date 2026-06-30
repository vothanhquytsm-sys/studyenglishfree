import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { IELTS_READING_TESTS as READING_TEST_DATA } from '../data/readingData';
import { Type, CheckCircle, HelpCircle, XCircle } from 'lucide-react';

interface Question {
  number: number;
  type: 'tfng' | 'mcq' | 'gapfill';
  text: string;
  options?: string[];
  answer: string;
  explanation: string;
  location: string;
}

interface Passage {
  title: string;
  text: string;
  questions: Question[];
}

interface ReadingTest {
  test_id: string;
  title: string;
  passages: Passage[];
}

export const Reading: React.FC = () => {
  const { progress, saveProgress, showToast } = useApp();

  const [currentView, setCurrentView] = useState<'dashboard' | 'simulator' | 'results'>('dashboard');
  const [selectedTest, setSelectedTest] = useState<ReadingTest | null>(null);
  const [currentPassageIdx, setCurrentPassageIdx] = useState<number>(0);
  const [fontSize, setFontSize] = useState<number>(1.1); // in em

  // Test states
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(3600); // 60 mins
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [highlightText, setHighlightText] = useState<string | null>(null);

  // References
  const timerRef = useRef<any>(null);
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const startTest = (test: ReadingTest) => {
    setSelectedTest(test);
    setCurrentPassageIdx(0);
    setUserAnswers({});
    setTimeRemaining(3600);
    setIsSubmitted(false);
    setIsReviewMode(false);
    setTimeSpent(0);
    setHighlightText(null);
    setCurrentView('simulator');
  };

  // Timer loop
  useEffect(() => {
    if (currentView === 'simulator' && !isSubmitted && !isReviewMode) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          setTimeSpent(s => s + 1);
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentView, isSubmitted, isReviewMode]);

  const handleAutoSubmit = () => {
    showToast('Hết giờ! Bài làm tự động nộp.', 'info');
    handleSubmit(true);
  };

  const confirmSubmit = () => {
    const totalQ = selectedTest?.passages.reduce((sum, p) => sum + p.questions.length, 0) || 40;
    const answeredCount = Object.keys(userAnswers).length;
    const unanswered = totalQ - answeredCount;

    if (unanswered > 0) {
      const confirm = window.confirm(`Bạn còn ${unanswered} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài?`);
      if (!confirm) return;
    }
    handleSubmit(false);
  };

  const handleSubmit = (auto = false) => {
    if (isSubmitted) return;
    setIsSubmitted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Calculate score
    let score = 0;
    const totalQ = selectedTest?.passages.reduce((sum, p) => sum + p.questions.length, 0) || 40;
    selectedTest?.passages.forEach(passage => {
      passage.questions.forEach(q => {
        const uAns = (userAnswers[q.number] || '').toLowerCase().trim();
        const cAns = (q.answer || '').toLowerCase().trim();
        if (uAns === cAns) score++;
      });
    });

    if (selectedTest) {
      saveProgress('reading', selectedTest.test_id);
    }

    setCurrentView('results');
  };

  const scoreToBand = (score: number, totalQ = 40) => {
    const percentage = score / totalQ;
    if (percentage >= 0.925) return 9.0;
    if (percentage >= 0.875) return 8.5;
    if (percentage >= 0.825) return 8.0;
    if (percentage >= 0.775) return 7.5;
    if (percentage >= 0.700) return 7.0;
    if (percentage >= 0.625) return 6.5;
    if (percentage >= 0.550) return 6.0;
    if (percentage >= 0.475) return 5.5;
    if (percentage >= 0.400) return 5.0;
    if (percentage >= 0.325) return 4.5;
    if (percentage >= 0.250) return 4.0;
    return 3.5;
  };

  const handleJumpToQuestion = (qNum: number) => {
    if (!selectedTest) return;
    // Find which passage this question is in
    for (let pIdx = 0; pIdx < selectedTest.passages.length; pIdx++) {
      const passage = selectedTest.passages[pIdx];
      const found = passage.questions.find(q => q.number === qNum);
      if (found) {
        if (pIdx !== currentPassageIdx) {
          setCurrentPassageIdx(pIdx);
          setHighlightText(null);
        }
        // Wait for DOM to render then scroll
        setTimeout(() => {
          const el = questionRefs.current[qNum];
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        break;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (qNum: number, value: string) => {
    setUserAnswers(prev => ({ ...prev, [qNum]: value }));
  };

  const getPassageTextWithHighlight = (passageText: string) => {
    if (!highlightText) return passageText.split('\n\n').map((p, i) => `<p key="${i}">${p}</p>`).join('');

    const paragraphs = passageText.split('\n\n');
    return paragraphs
      .map(pText => {
        // Simple exact match replacement with highlighted styling
        if (highlightText && pText.toLowerCase().includes(highlightText.toLowerCase())) {
          // Find case-sensitive text to preserve casing
          const idx = pText.toLowerCase().indexOf(highlightText.toLowerCase());
          const originalSnippet = pText.substring(idx, idx + highlightText.length);
          const replaced = pText.replace(
            originalSnippet,
            `<mark class="bg-yellow-300 dark:bg-amber-600/80 rounded px-1.5 py-0.5 border border-amber-400/30 text-slate-800 dark:text-slate-100 font-medium">${originalSnippet}</mark>`
          );
          return `<p>${replaced}</p>`;
        }
        return `<p>${pText}</p>`;
      })
      .join('');
  };

  const exitTest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedTest(null);
    setCurrentView('dashboard');
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'tfng': return 'TRUE / FALSE / NOT GIVEN';
      case 'mcq': return 'Multiple Choice';
      case 'gapfill': return 'Gap Fill / Sentence Completion';
      default: return 'Questions';
    }
  };

  // Score stats for completed test
  const totalQuestions = selectedTest?.passages.reduce((sum, p) => sum + p.questions.length, 0) || 40;
  let correctScore = 0;
  if (isSubmitted || isReviewMode) {
    selectedTest?.passages.forEach(passage => {
      passage.questions.forEach(q => {
        if ((userAnswers[q.number] || '').toLowerCase().trim() === (q.answer || '').toLowerCase().trim()) {
          correctScore++;
        }
      });
    });
  }

  const bandResult = scoreToBand(correctScore, totalQuestions);

  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-900 animate-fadeIn">
      {/* ── View 1: Test Selection Dashboard ── */}
      {currentView === 'dashboard' && (
        <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 font-sans">Luyện thi IELTS Reading (Academic)</h2>
            <p className="text-xs text-slate-400">
              Luyện tập với 10 đề thi Academic đầy đủ (3 Passages, 40 câu hỏi) giống như thi thật trên máy tính.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(READING_TEST_DATA as ReadingTest[]).map((test) => {
              const isCompleted = progress.readingCompleted?.includes(test.test_id);
              return (
                <div
                  key={test.test_id}
                  onClick={() => startTest(test)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900 cursor-pointer transition flex flex-col justify-between min-h-[160px] group"
                >
                  <div className="space-y-2">
                    <span className="text-2xl">📚</span>
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {test.title}
                    </h3>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-4 border-t border-slate-100 dark:border-slate-700/50 pt-3">
                    <span>Đề thi thử Mocktest</span>
                    {isCompleted ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-0.5">✓ Hoàn thành</span>
                    ) : (
                      <span>Chưa làm</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── View 2: Split-Pane Simulator ── */}
      {currentView === 'simulator' && selectedTest && (
        <div className="flex-1 flex flex-col overflow-hidden h-full">
          {/* Top Simulator Header */}
          <div className="h-14 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 px-4 flex items-center justify-between flex-shrink-0 gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={exitTest}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                ← Thoát
              </button>
              <span className="font-extrabold text-xs text-slate-500 hidden sm:inline-block">
                {selectedTest.title}
              </span>
            </div>

            {/* Passage tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
              {selectedTest.passages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentPassageIdx(idx);
                    setHighlightText(null);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-md cursor-pointer transition ${
                    currentPassageIdx === idx
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Passage {idx + 1}
                </button>
              ))}
            </div>

            {/* Font size + Timer controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden flex-shrink-0">
                <button
                  onClick={() => setFontSize(prev => Math.max(0.8, prev - 0.1))}
                  className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 text-[10px] font-bold hover:bg-slate-100 border-r border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  A-
                </button>
                <button
                  onClick={() => setFontSize(prev => Math.min(1.5, prev + 0.1))}
                  className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 text-[10px] font-bold hover:bg-slate-100 cursor-pointer"
                >
                  A+
                </button>
              </div>

              {!isReviewMode && (
                <div
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-mono text-xs font-bold flex-shrink-0 ${
                    timeRemaining <= 300
                      ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900'
                      : timeRemaining <= 600
                      ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900'
                  }`}
                >
                  <span>⏱️</span>
                  <span>{formatTime(timeRemaining)}</span>
                </div>
              )}

              {isReviewMode ? (
                <button
                  onClick={() => setCurrentView('results')}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow"
                >
                  ← Kết quả
                </button>
              ) : (
                <button
                  onClick={confirmSubmit}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow"
                >
                  Nộp bài
                </button>
              )}
            </div>
          </div>

          {/* Double Pane Splitted Workspace */}
          <div className="flex-1 flex overflow-hidden min-h-0 bg-white dark:bg-slate-900">
            {/* Left Pane: Passage Text */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white dark:bg-slate-850 border-r border-slate-200 dark:border-slate-700/50">
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 mb-6 border-b border-slate-100 dark:border-slate-700 pb-3">
                {selectedTest.passages[currentPassageIdx].title}
              </h2>
              <div
                className="passage-content font-serif text-slate-700 dark:text-slate-250 leading-relaxed space-y-4"
                style={{ fontSize: `${fontSize}em` }}
                dangerouslySetInnerHTML={{
                  __html: getPassageTextWithHighlight(selectedTest.passages[currentPassageIdx].text)
                }}
              />
            </div>

            {/* Right Pane: Questions List */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-50 dark:bg-slate-900">
              {/* Group questions by type sections */}
              {(() => {
                let currentType = '';
                return selectedTest.passages[currentPassageIdx].questions.map((q, idx) => {
                  const showHeader = q.type !== currentType;
                  currentType = q.type;

                  const userAnswer = userAnswers[q.number] || '';
                  const isCorrect = isReviewMode && userAnswer.toLowerCase().trim() === (q.answer || '').toLowerCase().trim();
                  const isWrong = isReviewMode && userAnswer && !isCorrect;

                  return (
                    <div key={q.number} className="space-y-4">
                      {showHeader && (
                        <div className="px-4 py-2 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold tracking-wide uppercase border border-indigo-100/30 dark:border-indigo-900/30 mt-4">
                          {getQuestionTypeLabel(q.type)}
                        </div>
                      )}

                      <div
                        ref={el => { questionRefs.current[q.number] = el; }}
                        className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3"
                      >
                        <div className="flex gap-2">
                          <span className="w-14 h-5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                            Câu {q.number}
                          </span>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                            {q.type === 'gapfill' ? (
                              // Replace blanks with inputs
                              q.text.split('______').map((part, pIdx, arr) => (
                                <React.Fragment key={pIdx}>
                                  {part}
                                  {pIdx < arr.length - 1 && (
                                    <input
                                      type="text"
                                      disabled={isSubmitted || isReviewMode}
                                      value={userAnswer}
                                      onChange={(e) => handleAnswerChange(q.number, e.target.value)}
                                      placeholder="Đáp án..."
                                      className={`mx-1 px-2.5 py-1 text-xs border rounded bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 max-w-[120px] transition ${
                                        isReviewMode
                                          ? isCorrect
                                            ? 'border-emerald-500 text-emerald-500 font-bold bg-emerald-50/10'
                                            : 'border-rose-500 text-rose-500 font-bold bg-rose-50/10'
                                          : 'border-slate-200 dark:border-slate-700'
                                      }`}
                                    />
                                  )}
                                </React.Fragment>
                              ))
                            ) : (
                              q.text
                            )}
                          </span>
                        </div>

                        {/* Options block for TFNG and MCQ */}
                        {q.type !== 'gapfill' && q.options && (
                          <div className="flex flex-col gap-2 pl-2">
                            {q.options.map((opt, oIdx) => {
                              const isSelected = userAnswer === opt;
                              const isCA = isReviewMode && opt === q.answer;
                              const isWA = isReviewMode && isSelected && opt !== q.answer;

                              let labelClass = 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-slate-200 dark:border-slate-750';
                              if (isReviewMode) {
                                if (isCA) labelClass = 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold';
                                else if (isWA) labelClass = 'bg-rose-50 dark:bg-rose-950/20 border-rose-500 text-rose-600 dark:text-rose-400 font-bold';
                              } else if (isSelected) {
                                labelClass = 'bg-indigo-50/50 border-indigo-500 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 font-bold';
                              }

                              return (
                                <label
                                  key={oIdx}
                                  className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition ${labelClass}`}
                                >
                                  <input
                                    type="radio"
                                    name={`q-${q.number}`}
                                    disabled={isSubmitted || isReviewMode}
                                    checked={isSelected}
                                    onChange={() => handleAnswerChange(q.number, opt)}
                                    className="accent-indigo-600"
                                  />
                                  <span>{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {/* Review explanation panel */}
                        {isReviewMode && (
                          <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-[10px] space-y-2">
                            <div className="flex items-center justify-between">
                              <span>📍 Vị trí trong bài đọc:</span>
                              {q.location && (
                                <button
                                  onClick={() => setHighlightText(q.location)}
                                  className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 underline hover:no-underline cursor-pointer"
                                >
                                  Xem vị trí đáp án
                                </button>
                              )}
                            </div>
                            <blockquote className="italic border-l-2 border-slate-300 dark:border-slate-700 pl-2 text-slate-500 dark:text-slate-400 py-0.5">
                              "{q.location}"
                            </blockquote>
                            <p className="text-slate-600 dark:text-slate-350 mt-1">
                              💡 <strong>Giải thích (Tiếng Việt):</strong> {q.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Bottom Navigator Panel */}
          <div className="h-16 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 px-4 flex items-center gap-4 flex-shrink-0">
            <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider whitespace-nowrap">BẢNG ĐÁP ÁN</span>
            <div className="flex gap-1.5 overflow-x-auto flex-1 py-1 pr-1.5 scrollbar-thin">
              {selectedTest.passages.map(p =>
                p.questions.map(q => {
                  const userAnswer = userAnswers[q.number];
                  const isCorrect = isReviewMode && userAnswer?.toLowerCase().trim() === q.answer.toLowerCase().trim();
                  const isWrong = isReviewMode && userAnswer && !isCorrect;

                  let dotClass = 'bg-white dark:bg-slate-850 text-slate-500 border-slate-200 dark:border-slate-700';
                  if (isReviewMode) {
                    if (isCorrect) {
                      dotClass = 'bg-emerald-500 text-white border-emerald-500 shadow shadow-emerald-500/20';
                    } else if (isWrong) {
                      dotClass = 'bg-rose-500 text-white border-rose-500 shadow shadow-rose-500/20';
                    } else {
                      dotClass = 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700';
                    }
                  } else if (userAnswer !== undefined && userAnswer !== '') {
                    dotClass = 'bg-indigo-600 text-white border-indigo-600 shadow shadow-indigo-600/20';
                  }

                  return (
                    <button
                      key={q.number}
                      onClick={() => handleJumpToQuestion(q.number)}
                      className={`w-8 h-8 rounded-full border text-center flex items-center justify-center text-xs font-bold flex-shrink-0 cursor-pointer hover:border-indigo-600 transition ${dotClass}`}
                    >
                      {q.number}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── View 3: Test results dashboard ── */}
      {currentView === 'results' && selectedTest && (
        <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full flex flex-col justify-center gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg p-8 md:p-10 flex flex-col items-center text-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex flex-col items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-[10px] font-black uppercase tracking-wider opacity-75">Band</span>
              <span className="text-3xl font-extrabold leading-tight">{bandResult.toFixed(1)}</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                {bandResult >= 7.0
                  ? '🎉 Xuất sắc! Kết quả tuyệt vời!'
                  : bandResult >= 5.5
                  ? '👏 Tốt lắm! Hãy tiếp tục luyện tập!'
                  : '💪 Cố gắng lên! Ôn luyện thêm nhé!'}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bạn đã trả lời đúng {correctScore}/{totalQuestions} câu hỏi.
                Thời gian hoàn thành đề: {formatTime(timeSpent)}.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center pt-2">
              <button
                onClick={() => {
                  setIsReviewMode(true);
                  setCurrentPassageIdx(0);
                  setHighlightText(null);
                  setCurrentView('simulator');
                }}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-bold shadow-lg shadow-indigo-600/10 cursor-pointer transition-all"
              >
                🔍 Xem giải thích chi tiết & Đáp án
              </button>
              <button
                onClick={() => {
                  setSelectedTest(null);
                  setCurrentView('dashboard');
                }}
                className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-full text-xs font-bold cursor-pointer transition"
              >
                📚 Luyện đề thi khác
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reading;
