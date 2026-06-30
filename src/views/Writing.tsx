import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { callAI } from '../services/ai';
import { HelpCircle, Clock, BookOpen, AlertTriangle } from 'lucide-react';

interface WritingTask {
  id: string;
  type: string;
  difficulty: string;
  title: string;
  question: string;
  wordLimit: number;
  timerMinutes: number;
  sampleEssay: string;
  chartData?: string;
}

const writingTasks: WritingTask[] = [
  {
    id: "task-1-internet",
    type: "Task 1",
    difficulty: "TRUNG BÌNH",
    title: "Internet Access in Households (2015-2025)",
    question: "The line graph below shows the percentage of households with internet access in three countries (Vietnam, UK, USA) from 2015 to 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    wordLimit: 150,
    timerMinutes: 20,
    sampleEssay: `The line graph illustrates the proportion of households with internet connection in Vietnam, the UK, and the USA over a ten-year period from 2015 to 2025.

Overall, it is clear that internet access became increasingly common in all three countries. Throughout the period, the USA maintained the highest rates of internet connectivity, while Vietnam experienced the most rapid growth.

In 2015, internet access was highest in the USA, with about 75% of households connected, compared to 60% in the UK and only 25% in Vietnam. Over the next five years, these figures rose steadily. By 2020, internet adoption in the USA reached 85%, and the UK saw an increase to 72%. Meanwhile, Vietnam's percentage doubled, reaching approximately 50%.

Between 2020 and 2025, the upward trend continued, though at a slightly slower pace for the developed countries. By 2025, household internet access peaked at 92% in the USA and 85% in the UK. Vietnam showed further dramatic growth, closing the gap with the UK by reaching a peak of 80% in 2025.`,
    chartData: `<svg viewBox="0 0 500 250" style="width:100%; height:100%;">
      <!-- Grid Lines -->
      <line x1="50" y1="30" x2="450" y2="30" stroke="currentColor" opacity="0.1" stroke-dasharray="3,3" />
      <line x1="50" y1="80" x2="450" y2="80" stroke="currentColor" opacity="0.1" stroke-dasharray="3,3" />
      <line x1="50" y1="130" x2="450" y2="130" stroke="currentColor" opacity="0.1" stroke-dasharray="3,3" />
      <line x1="50" y1="180" x2="450" y2="180" stroke="currentColor" opacity="0.1" stroke-dasharray="3,3" />
      
      <!-- Axes -->
      <line x1="50" y1="30" x2="50" y2="200" stroke="currentColor" stroke-width="1.5" />
      <line x1="50" y1="200" x2="450" y2="200" stroke="currentColor" stroke-width="1.5" />
      
      <!-- Y-Axis Labels -->
      <text x="40" y="35" fill="currentColor" opacity="0.7" font-size="9" text-anchor="end">100%</text>
      <text x="40" y="85" fill="currentColor" opacity="0.7" font-size="9" text-anchor="end">75%</text>
      <text x="40" y="135" fill="currentColor" opacity="0.7" font-size="9" text-anchor="end">50%</text>
      <text x="40" y="185" fill="currentColor" opacity="0.7" font-size="9" text-anchor="end">25%</text>
      <text x="40" y="205" fill="currentColor" opacity="0.7" font-size="9" text-anchor="end">0%</text>
      
      <!-- X-Axis Labels -->
      <text x="50" y="215" fill="currentColor" opacity="0.7" font-size="9" text-anchor="middle">2015</text>
      <text x="183" y="215" fill="currentColor" opacity="0.7" font-size="9" text-anchor="middle">2018</text>
      <text x="316" y="215" fill="currentColor" opacity="0.7" font-size="9" text-anchor="middle">2022</text>
      <text x="450" y="215" fill="currentColor" opacity="0.7" font-size="9" text-anchor="middle">2025</text>
      
      <!-- Data Lines: USA (Indigo) -->
      <path d="M 50 72.5 L 183 55 L 316 41.5 L 450 34" fill="none" stroke="#4f46e5" stroke-width="2.5" />
      <circle cx="50" cy="72.5" r="3.5" fill="#4f46e5" />
      <circle cx="450" cy="34" r="3.5" fill="#4f46e5" />
      
      <!-- Data Lines: UK (Purple) -->
      <path d="M 50 98 L 183 85 L 316 68 L 450 48.5" fill="none" stroke="#a855f7" stroke-width="2.5" />
      <circle cx="50" cy="98" r="3.5" fill="#a855f7" />
      <circle cx="450" cy="48.5" r="3.5" fill="#a855f7" />
      
      <!-- Data Lines: Vietnam (Green) -->
      <path d="M 50 162.5 L 183 130 L 316 95 L 450 59" fill="none" stroke="#10b981" stroke-width="2.5" />
      <circle cx="50" cy="162.5" r="3.5" fill="#10b981" />
      <circle cx="450" cy="59" r="3.5" fill="#10b981" />
      
      <!-- Legend -->
      <rect x="350" y="40" width="80" height="60" fill="currentColor" opacity="0.05" stroke="currentColor" stroke-width="0.5" rx="4"/>
      <line x1="360" y1="52" x2="380" y2="52" stroke="#4f46e5" stroke-width="2.5"/>
      <text x="388" y="55" fill="currentColor" font-size="9">USA</text>
      <line x1="360" y1="70" x2="380" y2="70" stroke="#a855f7" stroke-width="2.5"/>
      <text x="388" y="73" fill="currentColor" font-size="9">UK</text>
      <line x1="360" y1="88" x2="380" y2="88" stroke="#10b981" stroke-width="2.5"/>
      <text x="388" y="91" fill="currentColor" font-size="9">Vietnam</text>
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
    sampleEssay: `In contemporary society, there is an ongoing debate regarding the primary role of tertiary education. While one school of thought suggests that universities should focus on preparing students for their future careers, others argue that academic institutions should prioritize the pursuit of knowledge itself. In my opinion, universities ought to strike a balance between practical career preparation and academic exploration.

On the one hand, there are compelling reasons why universities should equip graduates with practical workplace skills. First and foremost, the job market has become highly competitive, and employers favor candidates who can contribute immediately without extensive training. Therefore, courses focusing on practical application, such as software engineering, accounting, and nursing, are highly beneficial. Furthermore, focusing on career readiness helps reduce youth unemployment rates and supports national economic development by ensuring a skilled workforce.

On the other hand, the value of learning for its own sake should not be underestimated. Pure academic research in fields like philosophy, theoretical physics, or history might not yield immediate commercial benefits, but it builds the cognitive foundation of human civilization. Major scientific breakthroughs often emerge from theoretical research that initially had no commercial purpose. If universities only offered job-oriented courses, society would lose its capacity for deep intellectual progress and critical thinking.

In conclusion, both functions of university education are vital. A university should not only act as a vocational training ground but also as a hub for academic curiosity. Therefore, the ideal tertiary education system should combine professional training with opportunities for academic enrichment.`
  }
];

export const Writing: React.FC = () => {
  const { saveProgress, showToast } = useApp();
  const [taskIdx, setTaskIdx] = useState<number>(0);
  const [essayText, setEssayText] = useState<string>('');
  const [isSampleShowing, setIsSampleShowing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('');

  // Timer states
  const [timeRemaining, setTimeRemaining] = useState<number>(1200);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  const currentTask = writingTasks[taskIdx];

  // Auto load draft or reset on task change
  useEffect(() => {
    const draft = localStorage.getItem(`ef_writing_draft_${currentTask.id}`) || '';
    setEssayText(draft);
    setFeedback('');
    setIsSampleShowing(false);
    
    // Stop active timer
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeRemaining(currentTask.timerMinutes * 60);
    setTimerActive(false);
  }, [taskIdx]);

  // Timer loop
  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerActive(false);
            showToast('Hết giờ làm bài!', 'warning');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, timeRemaining]);

  const handleEssayChange = (val: string) => {
    if (isSampleShowing) return;
    setEssayText(val);
    localStorage.setItem(`ef_writing_draft_${currentTask.id}`, val);
  };

  const toggleSampleEssay = () => {
    if (isSampleShowing) {
      const draft = localStorage.getItem(`ef_writing_draft_${currentTask.id}`) || '';
      setEssayText(draft);
      setIsSampleShowing(false);
      showToast('Đã quay lại bản nháp của bạn.', 'info');
    } else {
      setEssayText(currentTask.sampleEssay);
      setIsSampleShowing(true);
      showToast('Hiển thị bài luận mẫu IELTS Band 8.0 (Chỉ xem).', 'info');
    }
  };

  const handleStartTimer = () => {
    setTimerActive(prev => !prev);
  };

  const handleSubmitEssay = async () => {
    const text = essayText.trim();
    if (!text) {
      showToast('Vui lòng viết gì đó trước khi nộp!', 'warning');
      return;
    }

    setTimerActive(false);
    setLoading(true);
    setFeedback('');

    try {
      const sysPrompt = `You are a certified IELTS Writing Examiner grading an academic essay.
Analyze the user's essay for the prompt: "${currentTask.question}".
Provide a professional score sheet containing:
1. **Estimated IELTS Band Score** (e.g. Band 6.5)
2. **Task Achievement / Response** (word count check, key points covered)
3. **Coherence & Cohesion** (transition words usage, paragraphing structures)
4. **Lexical Resource** (spelling checks, vocab range improvements)
5. **Grammatical Range & Accuracy** (grammar errors correction)
6. **Polished Version** (Rewrite their essay to achieve Band 8.0+)
Output the feedback in Vietnamese so the user can easily study, but keep the technical English terms.`;

      const response = await callAI(sysPrompt, text);

      if (response) {
        // Parse bold lines and lines into HTML output formatting
        const formatted = response
          .replace(/\n/g, '<br>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        setFeedback(formatted);
        saveProgress('writing', currentTask.id);
        showToast('Đã nhận phản hồi và chấm điểm từ AI!', 'success');
      } else {
        // Run Local Fallback Evaluator
        runLocalFallbackGrader(text);
      }
    } catch (err) {
      console.error(err);
      runLocalFallbackGrader(text);
    } finally {
      setLoading(false);
    }
  };

  const runLocalFallbackGrader = (text: string) => {
    const wordCount = text.split(/\s+/).length;
    let score = 5.0;
    let taskFeedback = '';

    if (wordCount < currentTask.wordLimit) {
      score -= 1.0;
      taskFeedback = `Bài viết quá ngắn (${wordCount}/${currentTask.wordLimit} từ). Bạn bị trừ điểm vì không đạt số lượng từ tối thiểu.`;
    } else {
      score += 1.0;
      taskFeedback = `Đạt yêu cầu độ dài bài viết (${wordCount} từ). Đã phác thảo đầy đủ các ý chính.`;
    }

    const transitions = ["however", "furthermore", "moreover", "on the other hand", "in addition", "in conclusion", "therefore", "firstly"];
    const used = transitions.filter(t => text.toLowerCase().includes(t));
    let ccFeedback = '';
    if (used.length >= 4) {
      score += 1.0;
      ccFeedback = `Khả năng liên kết tốt. Bạn đã dùng các từ nối: ${used.join(', ')}.`;
    } else {
      ccFeedback = 'Bạn nên sử dụng thêm các từ nối liên kết như: However, Furthermore, On the other hand, In conclusion.';
    }

    score = Math.max(1.0, Math.min(9.0, score));

    const html = `
      <strong>Estimated Band Score: Band ${score.toFixed(1)} (Local Fallback)</strong><br><br>
      <strong>1. Task Achievement (Hoàn thành nhiệm vụ):</strong><br>
      ${taskFeedback}<br><br>
      <strong>2. Coherence & Cohesion (Độ mạch lạc):</strong><br>
      ${ccFeedback}<br><br>
      <strong>3. Lexical Resource (Từ vựng):</strong><br>
      Từ vựng ở mức cơ bản. Hãy trau dồi thêm từ vựng học thuật.<br><br>
      <span style="font-size: 0.8rem; opacity: 0.7;">*Chú ý: Máy chủ AI quá tải nên hệ thống đang sử dụng thang đánh giá cục bộ dự phòng.</span>
    `;
    setFeedback(html);
    saveProgress('writing', currentTask.id);
    showToast('Hoàn thành chấm điểm dự phòng.', 'info');
  };

  const formatTimer = (seconds: number) => {
    const min = Math.floor(seconds / 60).toString().padStart(2, '0');
    const sec = (seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  const wordCount = essayText.trim() ? essayText.trim().split(/\s+/).length : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Task Selector Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-3 flex-shrink-0">
        {writingTasks.map((t, idx) => (
          <button
            key={t.id}
            onClick={() => setTaskIdx(idx)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              taskIdx === idx
                ? 'bg-indigo-600 border-indigo-600 text-white shadow'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {t.type} - {t.title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Instructions, Graphic, and Prompt */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 px-2 py-0.5 rounded-full font-bold uppercase">
              {currentTask.type}
            </span>
            <span className="text-[10px] text-slate-400 font-bold">
              ĐỘ KHÓ: {currentTask.difficulty}
            </span>
          </div>

          <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100">{currentTask.title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">{currentTask.question}</p>

          {/* Render Task 1 Chart SVG if exists */}
          {currentTask.chartData && (
            <div
              className="bg-slate-50 dark:bg-slate-900/30 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl h-48 flex items-center justify-center text-slate-500 dark:text-slate-400"
              dangerouslySetInnerHTML={{ __html: currentTask.chartData }}
            />
          )}

          {/* Useful Tips */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-l-4 border-indigo-400 rounded-2xl space-y-1.5 text-xs">
            <h4 className="font-extrabold text-indigo-600 dark:text-indigo-400">💡 Gợi ý làm bài:</h4>
            <ul className="list-disc pl-4 space-y-1 text-slate-500 dark:text-slate-400">
              {currentTask.id === 'task-1-internet' ? (
                <>
                  <li>Viết Introduction bằng cách paraphrase đề bài (paraphrase 'shows' thành 'illustrates', 'percentage' thành 'proportion').</li>
                  <li>Viết Overview nêu bật 2 xu hướng chính: tỷ lệ truy cập tăng ở cả 3 nước và tỷ lệ của USA luôn cao nhất.</li>
                  <li>Chia Body thành 2 đoạn: Đoạn 1 miêu tả số liệu từ 2015 đến 2020, Đoạn 2 miêu tả từ 2020 đến 2025.</li>
                </>
              ) : (
                <>
                  <li>Mở bài 2 câu: Paraphrase cuộc tranh luận đại học và đưa lập trường của bạn.</li>
                  <li>Thân bài 1: Phân tích vì sao sinh viên cần kỹ năng thực hành nghề nghiệp khi ra trường.</li>
                  <li>Thân bài 2: Giải thích giá trị cốt lõi của nghiên cứu học thuật sâu rộng lý thuyết.</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Right Side: Text Editor and Live Counter */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 dark:border-slate-700 pb-3">
            {/* Word count */}
            <div className="flex gap-4 text-xs font-bold items-center">
              <span className="text-slate-400">Độ dài:</span>
              <span className={wordCount < currentTask.wordLimit ? 'text-rose-500' : 'text-emerald-500'}>
                {wordCount} / {currentTask.wordLimit} từ
              </span>
            </div>

            {/* Timers & sample button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleStartTimer}
                className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100 cursor-pointer flex items-center gap-1.5 text-slate-500"
              >
                <Clock size={14} />
                <span>{timerActive ? 'Dừng giờ' : 'Đếm giờ'} ({formatTimer(timeRemaining)})</span>
              </button>
              <button
                onClick={toggleSampleEssay}
                className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 text-xs font-bold rounded-lg border border-indigo-200/50 hover:bg-indigo-100 cursor-pointer flex items-center gap-1.5"
              >
                <BookOpen size={14} />
                <span>{isSampleShowing ? 'Bản nháp' : 'Bài mẫu'}</span>
              </button>
            </div>
          </div>

          {/* Text Area */}
          <textarea
            value={essayText}
            readOnly={isSampleShowing || loading}
            onChange={(e) => handleEssayChange(e.target.value)}
            placeholder="Viết bài luận IELTS của bạn bằng tiếng Anh tại đây..."
            rows={14}
            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition leading-relaxed"
          />

          <div className="flex justify-end pt-1">
            <button
              onClick={handleSubmitEssay}
              disabled={loading || isSampleShowing || !essayText.trim()}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 transition shadow"
            >
              Chấm điểm AI
            </button>
          </div>

          {/* AI Feedback Box */}
          {loading && (
            <div className="bg-slate-50 dark:bg-slate-900/30 p-5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-750 text-center animate-pulse text-xs text-slate-400 italic">
              AI đang đọc bài luận và lập bảng chấm điểm thi IELTS... Vui lòng đợi trong giây lát!
            </div>
          )}

          {feedback && !loading && (
            <div className="bg-slate-50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400">✍️ Phân tích đánh giá từ AI:</h4>
              <div
                className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 space-y-2 prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: feedback }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Writing;
