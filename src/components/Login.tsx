import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const Login: React.FC = () => {
  const { login, showToast } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allowedUsers: Record<string, string> = {
      'thanhquy': '12345678',
      'hangni': '12345678'
    };

    const user = username.trim().toLowerCase();
    if (allowedUsers[user] && allowedUsers[user] === password) {
      await login(user);
    } else {
      setShake(true);
      showToast('Tài khoản hoặc mật khẩu không chính xác!', 'error');
      setTimeout(() => {
        setShake(false);
      }, 400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div
        className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-8 overflow-hidden animate-scaleIn transition-transform ${
          shake ? 'animate-shake' : ''
        }`}
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl mx-auto mb-4 shadow-lg shadow-indigo-500/30">E</div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Đăng nhập EnglishFree</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Học IELTS cùng trợ lý AI. Vui lòng đăng nhập bằng tài khoản học viên để lưu tiến trình học.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Tên tài khoản (học viên)</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ví dụ: thanhquy, hangni"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all cursor-pointer mt-2"
          >
            Đăng nhập
          </button>
        </form>

        <div className="text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-700/50 pt-4 mt-6 leading-relaxed">
          Tài khoản mẫu: <strong className="text-indigo-600 dark:text-indigo-400">thanhquy</strong> hoặc <strong className="text-indigo-600 dark:text-indigo-400">hangni</strong><br />
          Mật khẩu mặc định: <strong className="text-slate-600 dark:text-slate-300">12345678</strong>
        </div>
      </div>
    </div>
  );
};

export default Login;
