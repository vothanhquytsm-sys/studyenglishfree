import React from 'react';
import { useApp } from '../context/AppContext';

export const Dashboard: React.FC = () => {
  const { switchTab, progress } = useApp();

  const cards = [
    {
      id: 'vocab',
      icon: '📖',
      title: 'Từ vựng',
      desc: 'Học 3000 từ vựng IELTS thông dụng chia theo chủ đề cùng hệ thống flashcard thông minh và bài test đánh giá.',
      bg: 'bg-indigo-50 dark:bg-indigo-950/20',
      color: 'text-indigo-600 dark:text-indigo-400'
    },
    {
      id: 'listening',
      icon: '🎧',
      title: 'Listening',
      desc: 'Luyện nghe IELTS Cambridge, theo dõi script chính xác, làm bài tập điền từ hoặc trắc nghiệm (10 câu).',
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      color: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      id: 'reading',
      icon: '📚',
      title: 'IELTS Reading',
      desc: 'Luyện thi với 10 đề Reading Academic đầy đủ (3 Passages, 40 câu hỏi), tính giờ 60 phút, chấm điểm band tự động và xem giải thích chi tiết.',
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      color: 'text-amber-600 dark:text-amber-400'
    },
    {
      id: 'speaking',
      icon: '💬',
      title: 'Speaking (Janet)',
      desc: 'Giao tiếp trực tiếp với Trợ lý AI Janet theo chủ đề thi nói IELTS và nhận phản hồi, sửa lỗi chính tả ngữ pháp.',
      bg: 'bg-pink-50 dark:bg-pink-950/20',
      color: 'text-pink-600 dark:text-pink-400'
    },
    {
      id: 'reflex',
      icon: '🔊',
      title: 'Luyện phản xạ',
      desc: 'Rèn luyện phản xạ dịch 100 câu tiếng Anh giao tiếp thông dụng từ Việt sang Anh và luyện phát âm.',
      bg: 'bg-rose-50 dark:bg-rose-950/20',
      color: 'text-rose-600 dark:text-rose-400'
    },
    {
      id: 'writing',
      icon: '✍️',
      title: 'Writing',
      desc: 'Luyện viết Task 1 (miêu tả biểu đồ trực quan) và Task 2 (bình luận luận điểm) từ Dễ đến Khó với AI chấm điểm.',
      bg: 'bg-purple-50 dark:bg-purple-950/20',
      color: 'text-purple-600 dark:text-purple-400'
    }
  ];

  // Prepare daily log list
  const dailyLogEntries = Object.entries(progress.dailyLog || {}).sort(
    (a, b) => b[0].localeCompare(a[0])
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100">Chào mừng đến với EnglishFree!</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed">
          Hệ thống tự học IELTS Cambridge miễn phí 4 kỹ năng kết hợp cùng công nghệ Trợ lý AI và Đồng bộ đám mây đám mây tự động.
        </p>
      </div>

      {/* Grid Menu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(card => (
          <div
            key={card.id}
            onClick={() => switchTab(card.id)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900 cursor-pointer transition flex flex-col gap-3 group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${card.bg} ${card.color} group-hover:scale-105 transition`}>
              {card.icon}
            </div>
            <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
              {card.title}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 leading-relaxed">
              {card.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Study History Logs */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            📅 Nhật ký học tập hàng ngày
          </h3>
          <p className="text-xs text-slate-400">
            Ghi nhận số lượng từ vựng học mới, số lượng bài nghe/bài đọc bạn hoàn thành mỗi ngày.
          </p>
        </div>

        <div className="space-y-3">
          {dailyLogEntries.length === 0 ? (
            <div className="text-center text-slate-400 dark:text-slate-500 py-8 px-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/30 text-xs italic">
              Chưa có nhật ký học tập cho ngày hôm nay. Hãy bắt đầu học nhé!
            </div>
          ) : (
            dailyLogEntries.map(([dateStr, entry]) => {
              const wordsCount = entry.words?.length || 0;
              const listeningCount = entry.listening?.length || 0;
              const readingCount = entry.reading?.length || 0;
              const reflexCount = entry.reflex?.length || 0;

              const dateParts = dateStr.split('-');
              const formattedDate = `Ngày ${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

              if (wordsCount === 0 && listeningCount === 0 && readingCount === 0 && reflexCount === 0) return null;

              return (
                <div
                  key={dateStr}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-xl gap-3 text-xs"
                >
                  <span className="font-bold text-slate-700 dark:text-slate-300">📅 {formattedDate}</span>
                  <div className="flex flex-wrap gap-2">
                    {wordsCount > 0 && (
                      <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100/50 dark:border-indigo-900/50 rounded-full">
                        📖 {wordsCount} từ vựng
                      </span>
                    )}
                    {listeningCount > 0 && (
                      <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-100/50 dark:border-emerald-900/50 rounded-full">
                        🎧 {listeningCount} bài nghe
                      </span>
                    )}
                    {readingCount > 0 && (
                      <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold border border-amber-100/50 dark:border-amber-900/50 rounded-full">
                        📚 {readingCount} bài đọc
                      </span>
                    )}
                    {reflexCount > 0 && (
                      <span className="px-2.5 py-1 bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 font-bold border border-pink-100/50 dark:border-pink-900/50 rounded-full">
                        ⚡ {reflexCount} phản xạ
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
