import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { LISTENING_DATA } from '../data/listeningData';
import { Play, Pause, RotateCcw, Volume2, Mic, CheckCircle, Eye, HelpCircle, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';

interface WordItem {
  key: number;
  type: 'TEXT' | 'PUNCTUATION' | 'BLANK' | string;
  value: string;
}

interface SentenceItem {
  key: number;
  start: number; // ms
  end: number; // ms
  content: string;
  contentVi: string;
  words: WordItem[];
}

interface QuizQuestion {
  id: string | number;
  type: 'multiple' | 'gapfill' | string;
  question: string;
  options?: string[];
  answer: string | number | any;
  explanation?: string;
}

interface Lesson {
  id: string;
  title: string;
  category?: string;
  description: string;
  audioFile: string;
  transcript: string;
  sentences?: SentenceItem[];
  quiz?: QuizQuestion[];
}

// Helper: Shadowing sentence splitter
const getShadowingSentences = (transcript: string) => {
  if (!transcript) return [];
  const lines = transcript.split('\n');
  const allSentences: string[] = [];
  const abbreviations = ['mr', 'mrs', 'dr', 'ms', 'vs', 'prof', 'sr', 'jr', 'co', 'ltd', 'inc', 'etc'];

  lines.forEach(line => {
    let text = line.trim();
    if (!text) return;
    const match = text.match(/^([A-Za-z0-9\s]+):(.*)/);
    if (match) text = match[2].trim();
    if (!text) return;

    const parts = text.split(/(?<=[.!?])\s+/);
    let current = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;
      current = current ? current + ' ' + part : part;

      const lastWordMatch = current.match(/(\b\w+)\.$/i);
      if (lastWordMatch) {
        const lastWord = lastWordMatch[1].toLowerCase();
        if (abbreviations.includes(lastWord)) continue;
      }

      const cleaned = current.replace(/^[\"'“”‘]+|[\"'“”’]+$/g, '').trim();
      if (cleaned && cleaned.match(/[a-zA-Z]/)) {
        allSentences.push(cleaned);
      }
      current = '';
    }
    if (current) {
      const cleaned = current.replace(/^[\"'“”‘]+|[\"'“”’]+$/g, '').trim();
      if (cleaned && cleaned.match(/[a-zA-Z]/)) allSentences.push(cleaned);
    }
  });
  return allSentences;
};

export const Listening: React.FC = () => {
  const { progress, saveProgress, showToast } = useApp();
  const [activeCategory, setActiveCategory] = useState<'ello' | 'ielts'>('ello');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'transcript' | 'shadow' | 'quiz' | 'dictation'>('transcript');
  const [elloTranslations, setElloTranslations] = useState<Record<number, string>>({});

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Shadowing state
  const [shadowingSentences, setShadowingSentences] = useState<string[]>([]);
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState<number>(-1);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [pronunciationScore, setPronunciationScore] = useState<number | null>(null);
  const [spokenText, setSpokenText] = useState<string>('');
  const [feedbackHtml, setFeedbackHtml] = useState<string>('');
  const [userAudioUrl, setUserAudioUrl] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Quiz evaluation state
  const [quizAnswers, setQuizAnswers] = useState<Record<string | number, string | number>>({});
  const [quizGraded, setQuizGraded] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Dictation (Chép chính tả) State
  const [dictationSentenceIdx, setDictationSentenceIdx] = useState<number>(0);
  const [dictationFillLevel, setDictationFillLevel] = useState<number>(100); // 25, 50, 75, 100
  const [dictationInputs, setDictationInputs] = useState<Record<number, string>>({});
  const [dictationChecked, setDictationChecked] = useState<boolean>(false);
  const [dictationShowHint, setDictationShowHint] = useState<boolean>(false);
  const [dictationSentenceStatus, setDictationSentenceStatus] = useState<Record<number, boolean>>({});

  // Filter lessons
  const filteredLessons = LISTENING_DATA.filter(l => (l.category || 'ello') === activeCategory);

  // Memoized active sentences list (resolves Ello transcripts dynamically or uses IELTS database list)
  const activeSentences = useMemo<any[]>(() => {
    if (!selectedLesson) return [];
    if (selectedLesson.sentences && selectedLesson.sentences.length > 0) {
      return selectedLesson.sentences;
    }

    if (!selectedLesson.transcript) return [];
    const rawSents = getShadowingSentences(selectedLesson.transcript);
    
    return rawSents.map((sentenceText, idx) => {
      let speaker = "Speaker";
      const lines = selectedLesson.transcript.split('\n');
      for (const line of lines) {
        if (line.includes(sentenceText)) {
          const match = line.match(/^([A-Za-z0-9\s]+):/);
          if (match) {
            speaker = match[1].trim();
            break;
          }
        }
      }

      // Split by alphanumeric words and keeping punctuation
      const tokens = sentenceText.split(/(\b[a-zA-Z0-9']+\b|[^a-zA-Z0-9'\s]+)/);
      let wordKeyCounter = 0;
      const words = tokens
        .map(tok => {
          const t = tok.trim();
          if (!t) return null;
          const isPunct = !/^[a-zA-Z0-9']/.test(t);
          return {
            key: `w-${idx}-${wordKeyCounter++}`, // unique key string
            value: t,
            type: (isPunct ? 'PUNCTUATION' : 'BLANK') as 'BLANK' | 'TEXT' | 'PUNCTUATION'
          };
        })
        .filter(Boolean);

      return {
        key: idx,
        speaker,
        start: 0,
        end: 0,
        content: sentenceText,
        contentVi: "",
        words
      };
    });
  }, [selectedLesson]);

  // Initialize SpeechRecognition on mount
  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      const rec = new SpeechRec();
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => setIsRecording(true);
      rec.onend = () => setIsRecording(false);
      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setSpokenText(transcript);
        analyzePronunciation(transcript);
      };
      rec.onerror = (err: any) => {
        console.error('Speech recognition error:', err);
        setIsRecording(false);
        showToast('Không nhận dạng được giọng nói. Hãy nói rõ ràng hơn.', 'error');
      };
      setRecognition(rec);
    }
  }, []);

  // Update states when lesson changes
  useEffect(() => {
    if (selectedLesson) {
      const sentences = getShadowingSentences(selectedLesson.transcript);
      setShadowingSentences(sentences);
      setSelectedSentenceIndex(-1);
      setPronunciationScore(null);
      setSpokenText('');
      setFeedbackHtml('');
      setUserAudioUrl('');
      setQuizGraded(false);
      setQuizAnswers({});
      setElloTranslations({});
      setIsPlaying(false);
      setCurrentTime(0);

      // Force reload audio element with new src
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.load();
        }
      }, 0);

      // Reset dictation states
      setDictationSentenceIdx(0);
      setDictationFillLevel(100);
      setDictationInputs({});
      setDictationChecked(false);
      setDictationShowHint(false);
      setDictationSentenceStatus({});

      // Set default sub tab for all categories
      if (activeSentences && activeSentences.length > 0) {
        setActiveSubTab('dictation');
      } else {
        setActiveSubTab('transcript');
      }
    }
  }, [selectedLesson, activeCategory]);

  // Fetch Ello sentence translation on-the-fly from Google Translate
  useEffect(() => {
    if (selectedLesson && !selectedLesson.sentences && activeSubTab === 'dictation') {
      const activeSent = activeSentences[dictationSentenceIdx];
      if (activeSent && !elloTranslations[dictationSentenceIdx]) {
        const textToTranslate = activeSent.content;
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(textToTranslate)}`;
        fetch(url)
          .then(res => res.json())
          .then(data => {
            if (data?.[0]?.[0]?.[0]) {
              const translation = data[0][0][0].trim();
              setElloTranslations(prev => ({ ...prev, [dictationSentenceIdx]: translation }));
            }
          })
          .catch(err => console.error("Translate error:", err));
      }
    }
  }, [selectedLesson, activeSubTab, dictationSentenceIdx, activeSentences, elloTranslations]);

  // Reset inputs when active dictation sentence changes
  useEffect(() => {
    if (selectedLesson && selectedLesson.sentences) {
      setDictationInputs({});
      setDictationChecked(false);
      setDictationShowHint(false);
    }
  }, [dictationSentenceIdx, dictationFillLevel]);

  // Handle timeupdate for segment playback
  const segmentListenerRef = useRef<(() => void) | null>(null);

  const cleanListeners = () => {
    if (audioRef.current && segmentListenerRef.current) {
      audioRef.current.removeEventListener('timeupdate', segmentListenerRef.current);
      segmentListenerRef.current = null;
    }
  };

  const playAudioSegment = (start: number, end: number) => {
    if (!audioRef.current) return;
    cleanListeners();

    audioRef.current.currentTime = start;
    setIsPlaying(true);
    audioRef.current.play().catch(console.error);

    const onTimeUpdate = () => {
      if (audioRef.current && audioRef.current.currentTime >= end) {
        audioRef.current.pause();
        setIsPlaying(false);
        cleanListeners();
      }
    };
    audioRef.current.addEventListener('timeupdate', onTimeUpdate);
    segmentListenerRef.current = onTimeUpdate;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    cleanListeners();

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const skipSeconds = (secs: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + secs));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const val = parseFloat(e.target.value);
    audioRef.current.currentTime = val;
    setCurrentTime(val);
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseFloat(e.target.value);
    setPlaybackSpeed(val);
    if (audioRef.current) {
      audioRef.current.playbackRate = val;
    }
  };

  const handleAudioLoaded = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    if (selectedLesson && quizGraded && quizScore >= 7) {
      saveProgress('listening', selectedLesson.id);
      showToast('🎉 Đã nghe hết và hoàn thành bài nghe!', 'success');
    }
  };



  const speakSelectedSentence = () => {
    if (selectedSentenceIndex === -1) {
      showToast('Vui lòng chọn một câu tiếng Anh trước!', 'warning');
      return;
    }
    const text = shadowingSentences[selectedSentenceIndex];
    if (selectedLesson && !selectedLesson.audioFile.startsWith('TTS_')) {
      const range = getSentenceTimeRange(selectedSentenceIndex);
      playAudioSegment(range.start, range.end);
    } else {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'en-US';
        utter.rate = 0.85;
        window.speechSynthesis.speak(utter);
      }
    }
  };

  const getSentenceTimeRange = (idx: number) => {
    if (!audioRef.current || isNaN(audioRef.current.duration)) return { start: 0, end: 0 };
    const dur = audioRef.current.duration;
    let totalChars = 0;
    const sentenceLengths = shadowingSentences.map(s => {
      totalChars += s.length;
      return s.length;
    });

    if (totalChars === 0) return { start: 0, end: 0 };
    let cumulativeChars = 0;
    for (let i = 0; i < idx; i++) {
      cumulativeChars += sentenceLengths[i];
    }

    const startRatio = cumulativeChars / totalChars;
    const endRatio = (cumulativeChars + sentenceLengths[idx]) / totalChars;

    let start = Math.max(0, startRatio * dur - 0.4);
    let end = Math.min(dur, endRatio * dur + 0.5);
    return { start, end };
  };

  const toggleRecording = () => {
    if (selectedSentenceIndex === -1) {
      showToast('Vui lòng chọn một câu tiếng Anh để ghi âm!', 'warning');
      return;
    }

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }

    if (isRecording) {
      if (recognition) {
        recognition.stop();
      } else if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      if (recognition) {
        recognition.start();
      } else {
        startAudioRecordingFallback();
      }
    }
  };

  const startAudioRecordingFallback = () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        setUserAudioUrl(URL.createObjectURL(blob));
        showToast('Đã ghi âm xong! Bạn có thể nghe lại phát âm của mình.', 'success');
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    }).catch(err => {
      console.error(err);
      showToast('Không truy cập được Micro. Vui lòng cấp quyền micro cho trình duyệt.', 'error');
    });
  };

  const playbackUserVoice = () => {
    if (userAudioUrl) {
      const audioObj = new Audio(userAudioUrl);
      audioObj.play();
    }
  };

  const analyzePronunciation = (spoken: string) => {
    const targetText = shadowingSentences[selectedSentenceIndex];
    const normalize = (t: string) => t.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '').trim().split(/\s+/);

    const targetWords = normalize(targetText);
    const spokenWords = normalize(spoken);

    let matchCount = 0;
    const wordsHtml = targetWords.map(tWord => {
      const idx = spokenWords.indexOf(tWord);
      if (idx !== -1) {
        matchCount++;
        spokenWords.splice(idx, 1);
        return `<span class="text-emerald-500 font-bold">${tWord}</span>`;
      }
      return `<span class="text-rose-500 font-bold line-through">${tWord}</span>`;
    });

    const score = Math.round((matchCount / targetWords.length) * 100);
    setPronunciationScore(score);
    setFeedbackHtml(wordsHtml.join(' '));
  };

  // Grade Listening Quiz
  const handleGradeQuiz = () => {
    if (!selectedLesson || !selectedLesson.quiz) return;
    let score = 0;
    selectedLesson.quiz.forEach(q => {
      const userAns = quizAnswers[q.id];
      if (q.type === 'multiple') {
        if (parseInt(String(userAns)) === q.answer) score++;
      } else {
        const cleanUser = String(userAns || '').toLowerCase().trim();
        const cleanAns = String(q.answer).toLowerCase().trim();
        if (cleanUser === cleanAns) score++;
      }
    });

    setQuizScore(score);
    setQuizGraded(true);

    if (score >= 7) {
      saveProgress('listening', selectedLesson.id);
      showToast(`🎉 Bài làm đạt ${score}/10 điểm! Bài học đã hoàn thành.`, 'success');
    } else {
      showToast(`Bạn chỉ đạt ${score}/10 điểm. Cần đạt tối thiểu 7/10 để hoàn thành bài nghe.`, 'warning');
    }
  };

  // Dictation Word Blank Decider
  const isWordBlank = (word: WordItem, index: number, fillLevel: number) => {
    if (word.type !== 'BLANK') return false;
    if (fillLevel === 100) return true;
    if (fillLevel === 75) return index % 4 !== 0;
    if (fillLevel === 50) return index % 2 === 0;
    if (fillLevel === 25) return index % 4 === 0;
    return true;
  };

  const playDictationSentence = (activeSent: any) => {
    if (!activeSent) return;
    if (activeCategory === 'ello') {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(activeSent.content);
        utter.lang = 'en-US';
        utter.rate = 0.85;
        window.speechSynthesis.speak(utter);
      }
    } else {
      playAudioSegment(activeSent.start / 1000, activeSent.end / 1000);
    }
  };

  // Check Dictation Sentence Correctness
  const checkSentenceCorrectness = (sent: any, inputs: Record<number, string>, fillLevel: number) => {
    let allCorrect = true;
    sent.words.forEach((word: any, wIdx: number) => {
      if (isWordBlank(word, wIdx, fillLevel)) {
        const userVal = (inputs[word.key] || '').trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '');
        const correctVal = word.value.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '');
        if (userVal !== correctVal) {
          allCorrect = false;
        }
      }
    });
    return allCorrect;
  };

  // Handle Check Dictation Action
  const handleCheckDictation = () => {
    if (!selectedLesson?.sentences) return;
    const activeSentence = activeSentences[dictationSentenceIdx];
    if (!activeSentence) return;

    if (dictationChecked) {
      const isAllCorrect = checkSentenceCorrectness(activeSentence, dictationInputs, dictationFillLevel);
      if (isAllCorrect) {
        handleNextDictationSentence();
        return;
      }
    }

    let allCorrect = true;
    activeSentence.words.forEach((word: any, wIdx: number) => {
      if (isWordBlank(word, wIdx, dictationFillLevel)) {
        const userVal = (dictationInputs[word.key] || '').trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '');
        const correctVal = word.value.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '');
        if (userVal !== correctVal) {
          allCorrect = false;
        }
      }
    });

    setDictationChecked(true);
    if (allCorrect) {
      showToast('Chính xác! Ấn Enter một lần nữa để sang câu tiếp theo.', 'success');
      setDictationSentenceStatus(prev => ({ ...prev, [dictationSentenceIdx]: true }));

      // Update total completion
      const totalSents = activeSentences.length;
      const completedCount = Object.keys(dictationSentenceStatus).filter(k => dictationSentenceStatus[parseInt(k)]).length + 1;
      if (completedCount === totalSents) {
        saveProgress('listening', selectedLesson.id);
        showToast('🎉 Chúc mừng! Bạn đã hoàn thành toàn bộ bài chép chính tả này!', 'success');
      }
    } else {
      showToast('Có từ chưa chính xác, hãy kiểm tra lại!', 'warning');
    }
  };

  const handleNextDictationSentence = () => {
    if (selectedLesson?.sentences && dictationSentenceIdx < activeSentences.length - 1) {
      setDictationSentenceIdx(prev => prev + 1);
    }
  };

  const handlePrevDictationSentence = () => {
    if (dictationSentenceIdx > 0) {
      setDictationSentenceIdx(prev => prev - 1);
    }
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden animate-fadeIn">
      {/* Sidebar: Lessons List */}
      <aside className="w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex gap-2 flex-shrink-0">
          <button
            onClick={() => { setActiveCategory('ello'); setSelectedLesson(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
              activeCategory === 'ello'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            Nghe Ello
          </button>
          <button
            onClick={() => { setActiveCategory('ielts'); setSelectedLesson(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg border transition cursor-pointer ${
              activeCategory === 'ielts'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            Luyện thi IELTS
          </button>
        </div>

        {/* Sidebar list items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredLessons.map((lesson, idx) => {
            const isCompleted = progress.listeningCompleted?.includes(lesson.id);
            const isSelected = selectedLesson?.id === lesson.id;

            return (
              <button
                key={lesson.id}
                onClick={() => setSelectedLesson(lesson)}
                className={`w-full text-left p-4 rounded-xl border transition flex flex-col gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500'
                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                  {idx + 1}. {lesson.title}
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                  <span>{activeCategory === 'ello' ? 'Ello Listening' : 'IELTS Practice'}</span>
                  {isCompleted ? (
                    <span className="text-emerald-500 font-bold">✓ Đã xong</span>
                  ) : (
                    <span>Chưa học</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-6">
        {!selectedLesson ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm">
            <span className="text-4xl mb-3">🎧</span>
            <h3 className="font-extrabold text-base text-slate-700 dark:text-slate-200">Vui lòng chọn một bài nghe từ danh sách bên trái</h3>
            <p className="text-xs text-slate-400 mt-1">Hệ thống hỗ trợ script đồng bộ và chấm điểm bài tập tự động.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 md:p-8 space-y-6">
            <audio
              ref={audioRef}
              src={`${import.meta.env.BASE_URL}${selectedLesson.audioFile.startsWith('audio/') ? selectedLesson.audioFile : 'audio/' + selectedLesson.audioFile}`}
              onLoadedMetadata={handleAudioLoaded}
              onDurationChange={handleAudioLoaded}
              onTimeUpdate={handleAudioTimeUpdate}
              onEnded={handleAudioEnded}
              className="hidden"
            />

            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                {selectedLesson.title}
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{selectedLesson.description}</p>
            </div>

            {/* Custom Audio Player */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center cursor-pointer transition shadow-md shadow-indigo-600/10"
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </button>
                  <button
                    onClick={() => skipSeconds(-10)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700 dark:text-slate-350"
                  >
                    -10s
                  </button>
                  <button
                    onClick={() => skipSeconds(10)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700 dark:text-slate-350"
                  >
                    +10s
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-bold">Tốc độ:</span>
                  <select
                    value={playbackSpeed}
                    onChange={handleSpeedChange}
                    className="p-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 focus:outline-none"
                  >
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1.0">1.0x</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                  </select>
                </div>
              </div>

              {/* Timeline */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono font-bold text-slate-400 w-10">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-[10px] font-mono font-bold text-slate-400 w-10">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Sub Tabs */}
            <div className="flex gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
              <button
                onClick={() => setActiveSubTab('transcript')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  activeSubTab === 'transcript'
                    ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                📜 Transcript
              </button>

              {activeCategory === 'ello' && (
                <button
                  onClick={() => setActiveSubTab('shadow')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    activeSubTab === 'shadow'
                      ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  🎙️ Shadowing
                </button>
              )}

              {activeSentences && activeSentences.length > 0 && (
                <button
                  onClick={() => setActiveSubTab('dictation')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    activeSubTab === 'dictation'
                      ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  ✍️ Chép chính tả
                </button>
              )}

              {selectedLesson.quiz && selectedLesson.quiz.length > 0 && (
                <button
                  onClick={() => setActiveSubTab('quiz')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    activeSubTab === 'quiz'
                      ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  ✍️ Bài tập
                </button>
              )}
            </div>

            {/* ── Tab Content: Transcript ── */}
            {activeSubTab === 'transcript' && (
              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                {selectedLesson.transcript.split('\n').map((line, idx) => {
                  if (!line.trim()) return null;
                  const match = line.match(/^([A-Za-z0-9\s]+):(.*)/);
                  if (match) {
                    const speaker = match[1];
                    const text = match[2];
                    return (
                      <div key={idx} className="text-xs leading-relaxed text-slate-700 dark:text-slate-350">
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400 mr-1.5">{speaker}:</span>
                        <span>{text}</span>
                      </div>
                    );
                  }
                  return (
                    <div key={idx} className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {line}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Tab Content: Shadowing (Ello only) ── */}
            {activeSubTab === 'shadow' && activeCategory === 'ello' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl max-h-[400px] overflow-y-auto p-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 mb-2">Danh sách câu nói (Nhấp vào câu để tập nói)</h4>
                  {shadowingSentences.map((sent, idx) => {
                    const isActive = selectedSentenceIndex === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedSentenceIndex(idx);
                          setPronunciationScore(null);
                          setFeedbackHtml('');
                          setUserAudioUrl('');
                        }}
                        className={`w-full text-left p-3 rounded-xl border text-xs leading-relaxed transition ${
                          isActive
                            ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 font-medium text-slate-800 dark:text-slate-100'
                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 hover:border-slate-200 text-slate-700 dark:text-slate-350'
                        }`}
                      >
                        {sent}
                      </button>
                    );
                  })}
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 flex flex-col gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Luyện phát âm (Shadowing)</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {selectedSentenceIndex !== -1 ? (
                        <>
                          Đang chọn câu {selectedSentenceIndex + 1}:<br />
                          <strong className="text-slate-700 dark:text-slate-200 font-bold">{shadowingSentences[selectedSentenceIndex]}</strong>
                        </>
                      ) : (
                        'Vui lòng chọn 1 câu ở phía bên trái để tập nói.'
                      )}
                    </p>
                  </div>

                  <div className="flex gap-2 items-center flex-wrap">
                    <button
                      onClick={speakSelectedSentence}
                      disabled={selectedSentenceIndex === -1}
                      className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 cursor-pointer disabled:opacity-50 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Volume2 size={14} />
                      Nghe mẫu
                    </button>
                    <button
                      onClick={toggleRecording}
                      disabled={selectedSentenceIndex === -1}
                      className={`px-3.5 py-2 rounded-lg cursor-pointer text-xs font-bold flex items-center gap-1.5 transition ${
                        isRecording
                          ? 'bg-rose-600 text-white hover:bg-rose-500'
                          : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow'
                      }`}
                    >
                      <Mic size={14} />
                      {isRecording ? 'Ghi âm...' : 'Bắt đầu nói'}
                    </button>
                    {userAudioUrl && (
                      <button
                        onClick={playbackUserVoice}
                        className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 cursor-pointer text-xs font-bold"
                      >
                        ▶️ Nghe lại bạn nói
                      </button>
                    )}
                  </div>

                  {pronunciationScore !== null && (
                    <div className="mt-2 space-y-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Điểm phát âm:</span>
                        <span
                          className={`text-2xl font-black ${
                            pronunciationScore >= 80
                              ? 'text-emerald-500'
                              : pronunciationScore >= 50
                              ? 'text-amber-500'
                              : 'text-rose-500'
                          }`}
                        >
                          {pronunciationScore}%
                        </span>
                        <span className="text-xs text-slate-400">
                          ({pronunciationScore >= 80 ? 'Xuất sắc!' : pronunciationScore >= 50 ? 'Khá tốt' : 'Chưa đạt'})
                        </span>
                      </div>
                      <div className="space-y-1 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 block">KẾT QUẢ ĐỐI CHIẾU:</span>
                        <div
                          className="text-xs leading-relaxed tracking-wide text-slate-700 dark:text-slate-300"
                          dangerouslySetInnerHTML={{ __html: feedbackHtml }}
                        />
                        <p className="text-[10px] text-slate-450 italic mt-2">Bạn đã nói: "{spokenText}"</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Tab Content: Dictation (Chép chính tả) ── */}
            {activeSubTab === 'dictation' && activeSentences && activeSentences.length > 0 && activeSentences[dictationSentenceIdx] && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Sentences list side-bar */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl max-h-[450px] overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-900/20">
                  <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 mb-3 flex items-center justify-between">
                    <span>DANH SÁCH CÂU (${activeSentences.length} câu)</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                      {Math.round((Object.keys(dictationSentenceStatus).filter(k => dictationSentenceStatus[parseInt(k)]).length / activeSentences.length) * 100)}%
                    </span>
                  </h4>
                  <div className="space-y-2">
                    {activeSentences.map((sent: any, idx: number) => {
                      const isCurrent = dictationSentenceIdx === idx;
                      const isDone = dictationSentenceStatus[idx];
                      return (
                        <div
                          key={sent.key}
                          onClick={() => setDictationSentenceIdx(idx)}
                          className={`w-full text-left p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                            isCurrent
                              ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 font-bold'
                              : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800/80 hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playAudioSegment(sent.start / 1000, sent.end / 1000);
                              }}
                              className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 cursor-pointer"
                            >
                              <Play size={10} className="ml-0.5" />
                            </button>
                            <span className="text-slate-400 font-mono text-[10px]">#{idx + 1}</span>
                            <span className="truncate text-[11px] text-slate-600 dark:text-slate-350">
                              {sent.content}
                            </span>
                          </div>
                          {isDone ? (
                            <span className="text-emerald-500 font-black text-xs">✓</span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-650 text-[10px]">--</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Main Interactive Dictation Workspace */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Controls Header */}
                  <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Mức độ trống:</span>
                      <select
                        value={dictationFillLevel}
                        onChange={(e) => setDictationFillLevel(parseInt(e.target.value))}
                        className="p-1 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="25">25% (Dễ)</option>
                        <option value="50">50% (Vừa)</option>
                        <option value="75">75% (Khó)</option>
                        <option value="100">100% (Thách thức)</option>
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handlePrevDictationSentence}
                        disabled={dictationSentenceIdx === 0}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-500 hover:bg-slate-50 flex items-center justify-center cursor-pointer disabled:opacity-50"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-xs font-extrabold flex items-center text-slate-600 dark:text-slate-300">
                        {dictationSentenceIdx + 1} / {activeSentences.length}
                      </span>
                      <button
                        onClick={handleNextDictationSentence}
                        disabled={dictationSentenceIdx === activeSentences.length - 1}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-500 hover:bg-slate-50 flex items-center justify-center cursor-pointer disabled:opacity-50"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Sentence interactive card */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-4">
                      <span className="text-[10px] font-black tracking-wider text-slate-400 block uppercase">
                        Khu vực nhập chép chính tả
                      </span>
                      <button
                        onClick={() => {
                          const activeSent = activeSentences[dictationSentenceIdx];
                          playDictationSentence(activeSent);
                        }}
                        className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Volume2 size={14} />
                        Nghe câu này
                      </button>
                    </div>

                    {/* Interactive Words Panel */}
                    <div className="flex flex-wrap items-baseline gap-y-3 gap-x-1.5 leading-loose">
                      {activeSentences[dictationSentenceIdx].words.map((word: any, wIdx: number) => {
                        const isBlank = isWordBlank(word, wIdx, dictationFillLevel);
                        if (isBlank) {
                          const userVal = (dictationInputs[word.key] || '').trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '');
                          const correctVal = word.value.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '');
                          const isCorrect = dictationChecked && userVal === correctVal;

                          return (
                            <div key={word.key} className="inline-flex flex-col items-center">
                              <input
                                type="text"
                                value={dictationInputs[word.key] || ''}
                                disabled={dictationChecked}
                                onChange={(e) => setDictationInputs(prev => ({ ...prev, [word.key]: e.target.value }))}
                                placeholder={dictationShowHint ? `${word.value[0]}...` : `(${wIdx + 1})`}
                                className={`mx-0.5 px-2 py-1 rounded border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-center transition-all ${
                                  dictationChecked
                                    ? isCorrect
                                      ? 'border-emerald-500 text-emerald-500 font-bold bg-emerald-50/20'
                                      : 'border-rose-500 text-rose-500 font-bold bg-rose-50/20'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100'
                                }`}
                                style={{ width: `${Math.max(55, word.value.length * 10 + 12)}px` }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleCheckDictation();
                                  }
                                }}
                              />
                              {dictationChecked && !isCorrect && (
                                <span className="text-[10px] text-emerald-500 font-extrabold mt-0.5">
                                  {word.value}
                                </span>
                              )}
                            </div>
                          );
                        }
                        return (
                          <span key={wIdx} className="text-slate-800 dark:text-slate-200 text-sm">
                            {word.value}
                          </span>
                        );
                      })}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 items-center justify-end border-t border-slate-100 dark:border-slate-700/80 pt-5">
                      <button
                        onClick={() => setDictationShowHint(prev => !prev)}
                        className="px-3.5 py-2 rounded-lg border border-slate-250 dark:border-slate-700 text-slate-500 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <HelpCircle size={14} />
                        {dictationShowHint ? 'Ẩn gợi ý' : 'Gợi ý ký tự'}
                      </button>

                      {dictationChecked ? (
                        <button
                          onClick={() => {
                            setDictationChecked(false);
                            setDictationInputs({});
                          }}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold cursor-pointer"
                        >
                          Làm lại câu này
                        </button>
                      ) : (
                        <button
                          onClick={handleCheckDictation}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer"
                        >
                          Kiểm tra (Enter)
                        </button>
                      )}

                      {dictationSentenceIdx < activeSentences.length - 1 && (
                        <button
                          onClick={handleNextDictationSentence}
                          className="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          Câu tiếp theo
                          <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Vietnamese translation block */}
                  <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2">
                    <span className="text-[10px] font-black text-indigo-500 tracking-wider uppercase block">
                      DỊCH NGHĨA TIẾNG VIỆT
                    </span>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-350 italic">
                      "{activeSentences[dictationSentenceIdx].contentVi || elloTranslations[dictationSentenceIdx] || (activeCategory === 'ello' ? 'Đang tải bản dịch...' : '')}"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab Content: Practice Quiz ── */}
            {activeSubTab === 'quiz' && (
              <div className="space-y-6">
                {!selectedLesson.quiz || selectedLesson.quiz.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs italic">
                    Bài tập điền từ đang được cập nhật cho bài nghe này. Hãy nghe và theo dõi transcript ở tab bên cạnh nhé!
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {selectedLesson.quiz.map((q, idx) => {
                        const userAns = quizAnswers[q.id];
                        const isCorrect = q.type === 'multiple'
                          ? parseInt(String(userAns)) === q.answer
                          : String(userAns || '').toLowerCase().trim() === String(q.answer).toLowerCase().trim();

                        return (
                          <div key={q.id} className="pb-5 border-b border-slate-100 dark:border-slate-700/50 space-y-3">
                            <h4 className="font-extrabold text-xs text-slate-700 dark:text-slate-300">
                              Câu {idx + 1}:
                            </h4>

                            {q.type === 'multiple' ? (
                              <div className="flex flex-col gap-2 pl-2">
                                {q.options?.map((opt, oIdx) => {
                                  const isSelected = userAns !== undefined && parseInt(String(userAns)) === oIdx;
                                  const showSuccess = quizGraded && oIdx === q.answer;
                                  const showFail = quizGraded && isSelected && !isCorrect;

                                  let labelClass = 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100';
                                  if (showSuccess) labelClass = 'text-emerald-500 font-bold';
                                  if (showFail) labelClass = 'text-rose-500 font-bold';

                                  return (
                                    <label key={oIdx} className={`flex items-center gap-2.5 text-xs cursor-pointer ${labelClass}`}>
                                      <input
                                        type="radio"
                                        name={`quiz-q-${q.id}`}
                                        disabled={quizGraded}
                                        checked={isSelected}
                                        onChange={() => setQuizAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                                        className="accent-indigo-600"
                                      />
                                      <span>{opt}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            ) : (
                              // Gap fill
                              <div className="pl-2 space-y-2">
                                <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-350">
                                  {q.question.split('________').map((part, pIdx, arr) => (
                                    <React.Fragment key={pIdx}>
                                      {part}
                                      {pIdx < arr.length - 1 && (
                                        <input
                                          type="text"
                                          disabled={quizGraded}
                                          value={String(quizAnswers[q.id] || '')}
                                          onChange={(e) => setQuizAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                          placeholder="Nhập từ..."
                                          className={`mx-1.5 px-2.5 py-1 rounded border bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 max-w-[120px] transition ${
                                            quizGraded
                                              ? isCorrect
                                                ? 'border-emerald-500 text-emerald-500 font-bold bg-emerald-50/20'
                                                : 'border-rose-500 text-rose-500 font-bold bg-rose-50/20'
                                              : 'border-slate-200 dark:border-slate-700'
                                          }`}
                                        />
                                      )}
                                    </React.Fragment>
                                  ))}
                                </div>
                                {quizGraded && !isCorrect && (
                                  <div className="text-[10px] text-slate-400">
                                    Đáp án đúng: <strong className="text-emerald-500 font-semibold">{q.answer}</strong>
                                  </div>
                                )}
                              </div>
                            )}

                            {quizGraded && q.explanation && (
                              <div className="text-[10px] bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-400 mt-2">
                                💡 <strong>Giải thích:</strong> {q.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {quizGraded && (
                      <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle className={quizScore >= 7 ? 'text-emerald-500' : 'text-rose-500'} size={20} />
                          <span className="font-bold">
                            Kết quả: {quizScore}/10 câu đúng
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {quizScore >= 7 ? '🎉 Đạt yêu cầu hoàn thành!' : 'Cần đạt 7/10 điểm để hoàn thành.'}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      {quizGraded ? (
                        <button
                          onClick={() => {
                            setQuizGraded(false);
                            setQuizAnswers({});
      setElloTranslations({});
                          }}
                          className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer transition text-slate-700 dark:text-slate-300"
                        >
                          Làm lại bài test
                        </button>
                      ) : (
                        <button
                          onClick={handleGradeQuiz}
                          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-md shadow-indigo-600/10"
                        >
                          Nộp bài và chấm điểm
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Listening;
