import React, { createContext, useContext, useState, useEffect } from 'react';
import { CloudSync } from '../services/cloudsync';
import type { ProgressData } from '../services/cloudsync';

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  id: number;
}

interface AppContextProps {
  currentUser: string | null;
  currentTab: string;
  theme: 'light' | 'dark';
  voiceGender: 'female' | 'male';
  progress: ProgressData;
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: number) => void;
  login: (username: string) => Promise<void>;
  logout: () => void;
  switchTab: (tab: string) => void;
  toggleDarkMode: () => void;
  setVoiceGender: (gender: 'female' | 'male') => void;
  saveProgress: (type: 'vocab' | 'listening' | 'reading' | 'speaking' | 'writing' | 'reflex', id: string | number) => void;
  updateVocabProgress: (topicId: string, nextBatchNum: number) => void;
  resetProgress: () => void;
  forceSync: () => Promise<void>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

const defaultProgress = (): ProgressData => ({
  wordsLearned: [],
  testsPassed: 0,
  listeningCompleted: [],
  readingCompleted: [],
  speakingCompleted: [],
  writingCompleted: [],
  reflexCompleted: [],
  vocabProgress: {
    emotion: 1, environment: 1, technology: 1, education: 1,
    business: 1, health: 1, celebrities: 1, travel: 1, society: 1,
    'phrasal-verbs': 1, A1: 1, A2: 1, B1: 1, B2: 1, PV: 1, ielts: 1
  },
  dailyLog: {}
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem('ef_current_user'));
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('ef_theme') as 'light' | 'dark') || 'light');
  const [voiceGender, setVoiceGenderState] = useState<'female' | 'male'>(() => (localStorage.getItem('ef_voice_gender') as 'female' | 'male') || 'female');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const [progress, setProgress] = useState<ProgressData>(() => {
    const user = localStorage.getItem('ef_current_user');
    const key = user ? `ef_progress_${user}` : 'ef_progress';
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure default structures are present
        parsed.wordsLearned = parsed.wordsLearned || [];
        parsed.listeningCompleted = parsed.listeningCompleted || [];
        parsed.readingCompleted = parsed.readingCompleted || [];
        parsed.speakingCompleted = parsed.speakingCompleted || [];
        parsed.writingCompleted = parsed.writingCompleted || [];
        parsed.reflexCompleted = parsed.reflexCompleted || [];
        parsed.vocabProgress = { ...defaultProgress().vocabProgress, ...parsed.vocabProgress };
        parsed.dailyLog = parsed.dailyLog || {};
        return parsed;
      } catch {
        return defaultProgress();
      }
    }
    return defaultProgress();
  });

  const showToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { message, type, id }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  };

  const dismissToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Sync theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('ef_theme', theme);
  }, [theme]);

  // Sync startup CloudSync if user already logged in
  useEffect(() => {
    if (currentUser) {
      CloudSync.init(currentUser).then(remoteProgress => {
        if (remoteProgress) {
          setProgress(local => {
            const merged = CloudSync.merge(local, remoteProgress);
            const key = `ef_progress_${currentUser}`;
            localStorage.setItem(key, JSON.stringify(merged));
            return merged;
          });
          const lastSync = CloudSync.lastSyncTime();
          showToast(`☁️ Tiến độ đã đồng bộ${lastSync ? ' lúc ' + lastSync : ''}`, 'success');
        }
      }).catch(err => {
        console.warn('[CloudSync] Startup init failed', err);
      });
    }
  }, [currentUser]);

  const login = async (username: string) => {
    const user = username.trim().toLowerCase();
    setCurrentUser(user);
    localStorage.setItem('ef_current_user', user);

    const progressKey = `ef_progress_${user}`;
    let userProgress = defaultProgress();
    const saved = localStorage.getItem(progressKey);
    if (saved) {
      try {
        userProgress = JSON.parse(saved);
      } catch {}
    }

    setProgress(userProgress);
    showToast(`Chào mừng ${user} đăng nhập thành công!`, 'success');

    // Fetch cloud progress
    try {
      const remote = await CloudSync.init(user);
      if (remote) {
        const merged = CloudSync.merge(userProgress, remote);
        localStorage.setItem(progressKey, JSON.stringify(merged));
        setProgress(merged);
        const lastSync = CloudSync.lastSyncTime();
        showToast(`☁️ Đã đồng bộ tiến độ từ đám mây${lastSync ? ' lúc ' + lastSync : ''}`, 'success');
      }
    } catch (e) {
      console.warn('[CloudSync] Login sync error', e);
    }
  };

  const logout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      localStorage.removeItem('ef_current_user');
      setCurrentUser(null);
      setProgress(defaultProgress());
      setCurrentTab('dashboard');
      window.location.reload();
    }
  };

  const switchTab = (tab: string) => {
    setCurrentTab(tab);
  };

  const toggleDarkMode = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const setVoiceGender = (gender: 'female' | 'male') => {
    setVoiceGenderState(gender);
    localStorage.setItem('ef_voice_gender', gender);
    showToast(`Đã đổi giọng đọc sang Giọng ${gender === 'female' ? 'Nữ' : 'Nam'}`, 'info');
  };

  const saveProgress = (
    type: 'vocab' | 'listening' | 'reading' | 'speaking' | 'writing' | 'reflex',
    id: string | number
  ) => {
    const today = new Date().toLocaleDateString('en-CA');
    const sid = String(id);

    setProgress(prev => {
      const next = { ...prev };
      next.dailyLog = next.dailyLog || {};
      next.dailyLog[today] = next.dailyLog[today] || { words: [], listening: [], reading: [], reflex: [] };
      const log = next.dailyLog[today];
      log.words = log.words || [];
      log.listening = log.listening || [];
      log.reading = log.reading || [];
      log.reflex = log.reflex || [];

      if (type === 'vocab') {
        if (!next.wordsLearned.includes(sid)) next.wordsLearned.push(sid);
        if (!log.words.includes(sid)) log.words.push(sid);
      } else if (type === 'listening') {
        if (!next.listeningCompleted.includes(sid)) next.listeningCompleted.push(sid);
        if (!log.listening.includes(sid)) log.listening.push(sid);
      } else if (type === 'reading') {
        if (!next.readingCompleted.includes(sid)) next.readingCompleted.push(sid);
        if (!log.reading.includes(sid)) log.reading.push(sid);
      } else if (type === 'speaking') {
        if (!next.speakingCompleted.includes(sid)) next.speakingCompleted.push(sid);
      } else if (type === 'writing') {
        if (!next.writingCompleted.includes(sid)) next.writingCompleted.push(sid);
      } else if (type === 'reflex') {
        if (!next.reflexCompleted.includes(sid)) next.reflexCompleted.push(sid);
        if (!log.reflex.includes(sid)) log.reflex.push(sid);
      }

      // Save locally
      const key = currentUser ? `ef_progress_${currentUser}` : 'ef_progress';
      localStorage.setItem(key, JSON.stringify(next));

      // Push to Cloud
      if (currentUser) {
        CloudSync.push(next);
      }

      return next;
    });
  };

  const updateVocabProgress = (topicId: string, nextBatchNum: number) => {
    setProgress(prev => {
      const next = { ...prev };
      next.vocabProgress = next.vocabProgress || {};
      next.vocabProgress[topicId] = Math.max(next.vocabProgress[topicId] || 1, nextBatchNum);

      const key = currentUser ? `ef_progress_${currentUser}` : 'ef_progress';
      localStorage.setItem(key, JSON.stringify(next));

      if (currentUser) {
        CloudSync.push(next);
      }

      return next;
    });
  };

  const resetProgress = () => {
    if (window.confirm('Bạn có chắc muốn đặt lại toàn bộ tiến độ học tập?')) {
      const cleared = defaultProgress();
      setProgress(cleared);
      const key = currentUser ? `ef_progress_${currentUser}` : 'ef_progress';
      localStorage.setItem(key, JSON.stringify(cleared));
      if (currentUser) {
        CloudSync.push(cleared, true);
      }
      showToast('Đã đặt lại tiến độ học tập của bạn!', 'success');
    }
  };

  const forceSync = async () => {
    if (currentUser) {
      showToast('Đang đồng bộ dữ liệu lên cloud...', 'info');
      const promise = CloudSync.push(progress, true);
      if (promise) {
        const ok = await promise;
        if (ok) {
          showToast('Đồng bộ cloud thành công!', 'success');
        } else {
          showToast('Lỗi đồng bộ cloud. Vui lòng kiểm tra lại!', 'error');
        }
      }
    } else {
      showToast('Đồng bộ cloud chưa được cấu hình!', 'warning');
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentTab,
        theme,
        voiceGender,
        progress,
        toasts,
        showToast,
        dismissToast,
        login,
        logout,
        switchTab,
        toggleDarkMode,
        setVoiceGender,
        saveProgress,
        updateVocabProgress,
        resetProgress,
        forceSync
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
