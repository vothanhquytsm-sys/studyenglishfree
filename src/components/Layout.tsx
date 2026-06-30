import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VOCABULARY_DATA } from '../data/vocabularyData';
import {
  Home,
  BookOpen,
  Headphones,
  FileText,
  MessageSquare,
  PenTool,
  Sun,
  Moon,
  Settings,
  LogOut,
  X,
  Volume2,
  RefreshCw
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    currentUser,
    currentTab,
    theme,
    voiceGender,
    progress,
    logout,
    switchTab,
    toggleDarkMode,
    setVoiceGender,
    forceSync,
    resetProgress
  } = useApp();

  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Calculate overall progress percentage
  const wordsLearnedCount = progress.wordsLearned?.length || 0;
  const totalWords = VOCABULARY_DATA ? VOCABULARY_DATA.length : 1000;
  
  const vocabWeight = (wordsLearnedCount / totalWords) * 40;
  const listeningWeight = Math.min(((progress.listeningCompleted?.length || 0) / 5) * 12, 12);
  const readingWeight = Math.min(((progress.readingCompleted?.length || 0) / 5) * 12, 12);
  const speakingWeight = Math.min(((progress.speakingCompleted?.length || 0) / 3) * 12, 12);
  const reflexWeight = Math.min(((progress.reflexCompleted?.length || 0) / 100) * 12, 12);
  const writingWeight = Math.min(((progress.writingCompleted?.length || 0) / 3) * 12, 12);

  const totalPercentage = Math.round(vocabWeight + listeningWeight + readingWeight + speakingWeight + reflexWeight + writingWeight);

  const navItems = [
    { id: 'dashboard', name: 'Trang chủ', icon: Home },
    { id: 'vocab', name: 'Từ vựng', icon: BookOpen },
    { id: 'listening', name: 'Listening', icon: Headphones },
    { id: 'reading', name: 'Reading', icon: FileText },
    { id: 'speaking', name: 'Speaking (Janet)', icon: MessageSquare },
    { id: 'reflex', name: 'Luyện phản xạ', icon: Volume2 },
    { id: 'writing', name: 'Writing', icon: PenTool },
  ];

  const getSectionTitle = () => {
    switch (currentTab) {
      case 'dashboard': return 'Trang chủ';
      case 'vocab': return 'Từ vựng';
      case 'listening': return 'Listening';
      case 'reading': return 'IELTS Reading Simulator';
      case 'speaking': return 'Speaking với Janet';
      case 'reflex': return 'Luyện phản xạ dịch';
      case 'writing': return 'Writing với AI';
      default: return 'EnglishFree';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-300">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Logo */}
          <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">E</div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">EnglishFree</span>
          </div>

          {/* Profile badge */}
          {currentUser && (
            <div className="p-4 mx-3 my-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-lg uppercase">
                {currentUser.charAt(0)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm truncate capitalize">{currentUser}</span>
                <span className="text-xs text-slate-400">Học viên IELTS</span>
                <div id="cloud-sync-badge" className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                  ☁️ <span>Đồng bộ tự động</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation items */}
          <nav className="px-3 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => switchTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            {theme === 'light' ? (
              <>
                <Moon size={14} />
                <span>Chế độ tối</span>
              </>
            ) : (
              <>
                <Sun size={14} />
                <span>Chế độ sáng</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => setShowSettingsModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <Settings size={14} />
            <span>Cấu hình</span>
          </button>

          {currentUser && (
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition border-none cursor-pointer"
            >
              <LogOut size={14} />
              <span>Đăng xuất</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-6 flex-shrink-0 z-10">
          <h2 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">{getSectionTitle()}</h2>
          
          {/* Progress fill */}
          {currentUser && (
            <div className="flex items-center gap-3 w-48 sm:w-60">
              <div className="flex flex-col text-right flex-shrink-0">
                <span className="text-xs font-bold">Tiến độ học</span>
                <span className="text-[10px] text-slate-400 font-mono">{totalPercentage}%</span>
              </div>
              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500"
                  style={{ width: `${totalPercentage}%` }}
                />
              </div>
            </div>
          )}
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto min-h-0 relative">
          {children}
        </main>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden animate-scaleIn">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">Cấu hình hệ thống</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full cursor-pointer text-slate-400 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Voice preference */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <Volume2 size={16} />
                  Giọng đọc IELTS Examiner
                </h4>
                <div className="relative">
                  <select
                    value={voiceGender}
                    onChange={(e) => setVoiceGender(e.target.value as 'female' | 'male')}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="female">Giọng Nữ (UK/US)</option>
                    <option value="male">Giọng Nam (UK/US)</option>
                  </select>
                </div>
              </div>

              {/* Cloud Sync Status */}
              <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                <h4 className="font-bold text-sm text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  ☁️ Đồng bộ tự động (Cloud)
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tiến độ học của bạn được <strong>tự động lưu lên cloud</strong> mỗi khi bạn học — không cần cấu hình gì thêm. Đăng nhập trên bất kỳ thiết bị nào, xóa cache → vẫn học tiếp được.
                </p>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">Trạng thái đồng bộ</span>
                    <span id="sync-status-text" className="text-[10px] text-slate-400 font-mono">Đang kiểm tra...</span>
                  </div>
                  <button
                    onClick={forceSync}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg border border-indigo-200/50 dark:border-indigo-900/50 hover:bg-indigo-100 cursor-pointer transition"
                  >
                    <RefreshCw size={12} />
                    Đồng bộ ngay
                  </button>
                </div>
              </div>

              {/* Reset Data */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-rose-500">💾 Đặt lại dữ liệu</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Xóa toàn bộ từ vựng đã học, bài làm nghe đọc, và kết quả kiểm tra khỏi bộ nhớ thiết bị và đám mây.
                </p>
                <button
                  onClick={resetProgress}
                  className="px-4 py-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50 text-xs font-bold rounded-lg hover:bg-rose-100 cursor-pointer transition"
                >
                  Xóa tiến độ
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-500 cursor-pointer transition"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
