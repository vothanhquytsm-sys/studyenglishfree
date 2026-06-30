import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { VOCABULARY_DATA } from '../data/vocabularyData';

interface Topic {
  id: string;
  nameVi: string;
  nameEn: string;
  description: string;
  emoji: string;
}

const topics: Topic[] = [
  {
    id: "emotion",
    nameVi: "Cảm xúc & Tâm lý",
    nameEn: "Emotion & Feelings",
    description: "Các từ vựng về trạng thái cảm xúc, phản ứng tâm lý và cách diễn tả tâm trạng trong IELTS.",
    emoji: "🧠"
  },
  {
    id: "environment",
    nameVi: "Môi trường & Biến đổi khí hậu",
    nameEn: "Environment & Climate Change",
    description: "Từ vựng học thuật quan trọng về hệ sinh thái, bảo tồn thiên nhiên và biến đổi khí hậu.",
    emoji: "🌍"
  },
  {
    id: "technology",
    nameVi: "Công nghệ & Đời sống xã hội",
    nameEn: "Technology & Society",
    description: "Các thuật ngữ về sự đổi mới kỹ thuật số, tự động hóa và tác động xã hội.",
    emoji: "💻"
  },
  {
    id: "education",
    nameVi: "Giáo dục & Trường học",
    nameEn: "Education & Schooling",
    description: "Các từ vựng thiết yếu về học tập, phương pháp giảng dạy, thi cử và môi trường sư phạm.",
    emoji: "📚"
  },
  {
    id: "business",
    nameVi: "Công việc & Kinh doanh",
    nameEn: "Work & Business",
    description: "Các thuật ngữ quan trọng về quản lý doanh nghiệp, tài chính, nhân sự và việc làm.",
    emoji: "💼"
  },
  {
    id: "health",
    nameVi: "Sức khỏe & Thể thao",
    nameEn: "Health & Sports",
    description: "Từ vựng học thuật về chăm sóc y tế, phòng ngừa bệnh tật và các hoạt động thể thao.",
    emoji: "🏥"
  },
  {
    id: "celebrities",
    nameVi: "Người nổi tiếng & Giải trí",
    nameEn: "Celebrities & Entertainment",
    description: "Từ vựng học thuật về truyền thông, người nổi tiếng, phim ảnh, thời trang và giới giải trí.",
    emoji: "⭐"
  },
  {
    id: "travel",
    nameVi: "Du lịch & Đô thị",
    nameEn: "Travel & Urban Life",
    description: "Các chủ đề về giao thông, điểm đến, chỗ ở và cuộc sống tại các thị trấn, thành phố lớn.",
    emoji: "✈️"
  },
  {
    id: "society",
    nameVi: "Xã hội & Chính trị",
    nameEn: "Society & Politics",
    description: "Từ vựng nâng cao về chính phủ, luật pháp, các vấn đề xã hội và quan hệ hôn nhân gia đình.",
    emoji: "👥"
  },
  {
    id: "phrasal-verbs",
    nameVi: "Cụm động từ thông dụng",
    nameEn: "Common Phrasal Verbs",
    description: "100 cụm động từ tự nhiên và hữu ích nhất giúp tăng điểm tiêu chí Lexical Resource.",
    emoji: "💬"
  }
];

interface WordObj {
  word: string;
  partOfSpeech: string;
  ipaUk: string;
  ipaUs: string;
  translation: string;
  example: string;
  exampleVi: string;
  topic: string;
  imageId?: string;
  level?: string;
}

interface QuizQuestion {
  word: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}

export const Vocabulary: React.FC = () => {
  const { progress, saveProgress, updateVocabProgress, showToast } = useApp();

  const [currentView, setCurrentView] = useState<'topics' | 'batches' | 'flashcards' | 'quiz'>('topics');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [topicWords, setTopicWords] = useState<WordObj[]>([]);
  const [selectedBatchIndex, setSelectedBatchIndex] = useState<number>(0);
  const [batchWords, setBatchWords] = useState<WordObj[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);

  // Quiz States
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizAnswered, setQuizAnswered] = useState<boolean>(false);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);

  // Load words when a topic is selected
  const handleSelectTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    const words = VOCABULARY_DATA.filter(w => w.topic === topic.id);
    setTopicWords(words);
    setCurrentView('batches');
  };

  const handleSelectBatch = (batchIndex: number) => {
    setSelectedBatchIndex(batchIndex);
    const start = batchIndex * 10;
    const words = topicWords.slice(start, start + 10);
    setBatchWords(words);
    setCurrentCardIndex(0);
    setCurrentView('flashcards');

    // Mark first word as seen
    if (words[0]) {
      saveProgress('vocab', words[0].word);
    }
  };

  const handleNextCard = () => {
    if (currentCardIndex < batchWords.length - 1) {
      const nextIdx = currentCardIndex + 1;
      setCurrentCardIndex(nextIdx);
      saveProgress('vocab', batchWords[nextIdx].word);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const getBlankedExample = (example: string, word: string) => {
    const parts = word.toLowerCase().split(' ');
    const irregularMap: Record<string, string> = {
      'go': '\\b(go|went|gone|going|goes)\\b',
      'be': '\\b(be|was|were|been|being|is|am|are)\\b',
      'take': '\\b(take|took|taken|taking|takes)\\b',
      'make': '\\b(make|made|making|makes)\\b',
      'do': '\\b(do|did|done|doing|does)\\b',
      'run': '\\b(run|ran|running|runs)\\b',
      'cut': '\\b(cut|cutting|cuts)\\b',
      'catch': '\\b(catch|caught|catching|catches)\\b',
      'drop': '\\b(drop|dropped|dropping|drops)\\b',
      'die': '\\b(die|died|dying|dies)\\b',
      'get': '\\b(get|got|gotten|getting|gets)\\b',
      'leave': '\\b(leave|left|leaving|leaves)\\b'
    };

    const firstWord = parts[0];
    if (parts.length > 1) {
      const rest = parts.slice(1).join(' ');
      const pattern = irregularMap[firstWord] || `\\b${firstWord}(ed|ing|s|es|d)?`;
      const regex = new RegExp(`${pattern}\\s+${rest}\\b`, 'gi');
      if (regex.test(example)) {
        return example.replace(regex, '_____');
      }
    }

    const pattern = irregularMap[firstWord] || `\\b${firstWord}(ed|ing|s|es|d)?\\b`;
    const regex = new RegExp(pattern, 'gi');
    return example.replace(regex, '_____');
  };

  const handleStartQuiz = () => {
    const questions: QuizQuestion[] = [];
    const quizWords = [...batchWords].sort(() => 0.5 - Math.random());

    quizWords.forEach(correct => {
      const type = Math.floor(Math.random() * 3); // 0: EN->VI, 1: VI->EN, 2: Fill Blank
      const others = VOCABULARY_DATA.filter(w => w.word !== correct.word && w.topic === correct.topic);
      const shuffledOthers = others.sort(() => 0.5 - Math.random());
      const distractorOptions = [correct, shuffledOthers[0], shuffledOthers[1], shuffledOthers[2]].sort(
        () => 0.5 - Math.random()
      );
      const correctIdx = distractorOptions.indexOf(correct);

      let questionText = '';
      let optionTexts: string[] = [];

      if (type === 0) {
        questionText = `Từ "${correct.word}" có nghĩa tiếng Việt là gì?`;
        optionTexts = distractorOptions.map(o => o.translation);
      } else if (type === 1) {
        questionText = `Từ tiếng Anh nào có nghĩa là: "${correct.translation}"?`;
        optionTexts = distractorOptions.map(o => `${o.word} (${o.partOfSpeech})`);
      } else {
        const blankExample = getBlankedExample(correct.example, correct.word);
        questionText = `Chọn từ thích hợp điền vào chỗ trống:\n"${blankExample}"\n(${correct.exampleVi})`;
        optionTexts = distractorOptions.map(o => o.word);
      }

      questions.push({
        word: correct.word,
        questionText,
        options: optionTexts,
        correctAnswerIndex: correctIdx
      });
    });

    setQuizQuestions(questions);
    setQuizIndex(0);
    setQuizScore(0);
    setQuizAnswered(false);
    setSelectedOptionIndex(null);
    setCurrentView('quiz');
  };

  const handleOptionClick = (index: number) => {
    if (quizAnswered) return;
    setQuizAnswered(true);
    setSelectedOptionIndex(index);

    const correctIdx = quizQuestions[quizIndex].correctAnswerIndex;
    if (index === correctIdx) {
      setQuizScore(prev => prev + 1);
      showToast('Chính xác!', 'success');
    } else {
      showToast('Chưa đúng rồi!', 'error');
    }
  };

  const handleNextQuizQuestion = () => {
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex(prev => prev + 1);
      setQuizAnswered(false);
      setSelectedOptionIndex(null);
    } else {
      // Completed Quiz
      const passed = quizScore === quizQuestions.length; // Must score 10/10
      if (passed && selectedTopic) {
        const nextUnlocked = selectedBatchIndex + 2; // Unlock next level (+1 to current index is +2 since batchIndex starts at 0)
        updateVocabProgress(selectedTopic.id, nextUnlocked);
        showToast('🎉 Tuyệt vời! Bạn đã vượt qua bài test và mở khóa cụm từ tiếp theo!', 'success');
      } else {
        showToast(`Bạn trả lời đúng ${quizScore}/10 câu. Cần đạt 10/10 để mở khóa cụm tiếp theo.`, 'warning');
      }
      setCurrentView('batches');
    }
  };

  // Text-To-Speech Pronunciation helpers
  const speakAccent = (accent: 'uk' | 'us') => {
    const word = batchWords[currentCardIndex]?.word;
    if (!word || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = accent === 'uk' ? 'en-GB' : 'en-US';
    utter.rate = 0.85;
    window.speechSynthesis.speak(utter);
  };

  const speakExample = () => {
    const example = batchWords[currentCardIndex]?.example;
    if (!example || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(example);
    utter.lang = 'en-US';
    utter.rate = 0.85;
    window.speechSynthesis.speak(utter);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* ── View 1: Topics Selection ── */}
      {currentView === 'topics' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Từ vựng IELTS theo chủ đề</h2>
            <p className="text-xs text-slate-400">
              Học từ vựng chia theo chủ đề Academic, phân nhóm 10 từ mỗi cụm, kiểm tra sau mỗi cụm.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map(topic => {
              const count = VOCABULARY_DATA.filter(w => w.topic === topic.id).length;
              return (
                <div
                  key={topic.id}
                  onClick={() => handleSelectTopic(topic)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900 cursor-pointer transition flex flex-col gap-3 group"
                >
                  <div className="text-3xl group-hover:scale-110 transition duration-300">{topic.emoji}</div>
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    {topic.nameVi}
                  </h3>
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">{topic.nameEn} ({count} từ)</span>
                  <p className="text-xs text-slate-400 leading-relaxed">{topic.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── View 2: Batches list inside topic ── */}
      {currentView === 'batches' && selectedTopic && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentView('topics')}
              className="px-4 py-2 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer transition"
            >
              ← Chọn chủ đề khác
            </button>
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{selectedTopic.nameVi}</h2>
            <div className="w-24"></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: Math.ceil(topicWords.length / 10) }).map((_, idx) => {
              const highestUnlocked = progress.vocabProgress?.[selectedTopic.id] || 1;
              const isLocked = idx + 1 > highestUnlocked;

              return (
                <button
                  key={idx}
                  disabled={isLocked}
                  onClick={() => handleSelectBatch(idx)}
                  className={`p-6 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-2 relative ${
                    isLocked
                      ? 'bg-slate-100/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-600 hover:shadow cursor-pointer text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <span className="text-2xl">{isLocked ? '🔒' : '🎯'}</span>
                  <span className="font-extrabold text-xs block">Cụm {idx + 1}</span>
                  <span className="text-[9px] text-slate-400 font-mono block">Từ {idx * 10 + 1} - {idx * 10 + 10}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── View 3: Flashcards study ── */}
      {currentView === 'flashcards' && selectedTopic && batchWords.length > 0 && (
        <div className="flex flex-col items-center space-y-6">
          <div className="flex justify-between items-center w-full max-w-2xl">
            <button
              onClick={() => setCurrentView('batches')}
              className="px-3.5 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer transition"
            >
              ← Danh sách cụm từ
            </button>
            <span className="font-bold text-xs text-slate-400">
              {selectedTopic.nameVi} - Cụm {selectedBatchIndex + 1}
            </span>
            <span className="font-mono text-xs font-extrabold text-indigo-600">
              {currentCardIndex + 1}/{batchWords.length}
            </span>
          </div>

          {/* Flashcard panel */}
          <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg p-8 md:p-10 flex flex-col gap-6 relative min-h-[380px]">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full uppercase tracking-wider">
                {selectedTopic.id}
              </span>
              <span className="text-xs text-slate-400 italic">
                {batchWords[currentCardIndex].partOfSpeech}
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                {batchWords[currentCardIndex].word}
              </h2>
              {/* Pronunciation block */}
              <div className="flex gap-4 items-center flex-wrap pt-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => speakAccent('uk')}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded font-bold cursor-pointer transition"
                  >
                    🇬🇧 UK
                  </button>
                  <span className="font-mono text-slate-400">{batchWords[currentCardIndex].ipaUk}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => speakAccent('us')}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded font-bold cursor-pointer transition"
                  >
                    🇺🇸 US
                  </button>
                  <span className="font-mono text-slate-400">{batchWords[currentCardIndex].ipaUs}</span>
                </div>
              </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-700" />

            <div>
              <h3 className="font-extrabold text-lg text-indigo-600 dark:text-indigo-400">
                {batchWords[currentCardIndex].translation}
              </h3>
            </div>

            {/* Example sentence */}
            <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border-l-4 border-indigo-400 flex justify-between items-start gap-4">
              <div className="space-y-1">
                <p className="text-slate-700 dark:text-slate-300 text-xs italic leading-relaxed">
                  "{batchWords[currentCardIndex].example}"
                </p>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  {batchWords[currentCardIndex].exampleVi}
                </p>
              </div>
              <button
                onClick={speakExample}
                className="text-base p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full cursor-pointer transition flex-shrink-0"
                title="Nghe ví dụ"
              >
                🔊
              </button>
            </div>
          </div>

          {/* Nav buttons */}
          <div className="flex gap-4 justify-center items-center">
            <button
              onClick={handlePrevCard}
              disabled={currentCardIndex === 0}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition text-xs font-bold"
            >
              ← Trước
            </button>
            <button
              onClick={handleNextCard}
              disabled={currentCardIndex === batchWords.length - 1}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition text-xs font-bold"
            >
              Tiếp theo →
            </button>
          </div>

          <button
            onClick={handleStartQuiz}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold text-sm shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 cursor-pointer transition-all mt-4"
          >
            🎯 Làm bài test cụm từ (10 câu)
          </button>
        </div>
      )}

      {/* ── View 4: Quiz Mode ── */}
      {currentView === 'quiz' && quizQuestions.length > 0 && (
        <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg p-6 md:p-8 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Bài kiểm tra cụm từ</h2>
            <p className="text-[10px] text-rose-500 font-bold">Bạn cần trả lời đúng 10/10 câu hỏi để mở cụm tiếp theo!</p>
          </div>

          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-400">Câu hỏi: {quizIndex + 1}/10</span>
            <span className="text-indigo-600">Đúng: {quizScore}</span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${((quizIndex + 1) / quizQuestions.length) * 100}%` }}
            />
          </div>

          {/* Question Text */}
          <div className="bg-slate-50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
              {quizQuestions[quizIndex].questionText}
            </h3>
          </div>

          {/* Answer Options */}
          <div className="flex flex-col gap-3">
            {quizQuestions[quizIndex].options.map((optText, index) => {
              const isCorrect = index === quizQuestions[quizIndex].correctAnswerIndex;
              const isSelected = index === selectedOptionIndex;

              let btnClass = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50';
              if (quizAnswered) {
                if (isCorrect) {
                  btnClass = 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-600 dark:text-emerald-400';
                } else if (isSelected) {
                  btnClass = 'bg-rose-50 dark:bg-rose-950/20 border-rose-500 text-rose-600 dark:text-rose-400';
                }
              }

              return (
                <button
                  key={index}
                  disabled={quizAnswered}
                  onClick={() => handleOptionClick(index)}
                  className={`w-full p-4 rounded-xl border text-left text-xs font-semibold transition flex justify-between items-center ${btnClass} ${
                    !quizAnswered ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <span>{optText}</span>
                  {quizAnswered && isCorrect && <span className="text-emerald-500 font-bold">✓</span>}
                  {quizAnswered && isSelected && !isCorrect && <span className="text-rose-500 font-bold">✗</span>}
                </button>
              );
            })}
          </div>

          {quizAnswered && (
            <div className="flex justify-end">
              <button
                onClick={handleNextQuizQuestion}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs cursor-pointer transition shadow-md shadow-indigo-600/10"
              >
                {quizIndex < quizQuestions.length - 1 ? 'Câu tiếp theo' : 'Hoàn tất'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Vocabulary;
