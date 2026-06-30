import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import Login from './components/Login';
import Dictionary from './components/Dictionary';
import Dashboard from './views/Dashboard';
import Vocabulary from './views/Vocabulary';
import Listening from './views/Listening';
import Reading from './views/Reading';
import Speaking from './views/Speaking';
import Writing from './views/Writing';
import { X } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, currentTab, toasts, dismissToast } = useApp();

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard': return <Dashboard />;
      case 'vocab': return <Vocabulary />;
      case 'listening': return <Listening />;
      case 'reading': return <Reading />;
      case 'speaking': return <Speaking />;
      case 'writing': return <Writing />;
      default: return <Dashboard />;
    }
  };

  return (
    <>
      {!currentUser ? (
        <Login />
      ) : (
        <Layout>
          {renderActiveView()}
        </Layout>
      )}

      {/* Hover Selection Dictionary lookup trigger */}
      {currentUser && <Dictionary />}

      {/* Floating Toast Notification Stack */}
      <div className="fixed bottom-4 right-4 z-[99999] flex flex-col gap-2 max-w-sm w-full">
        {toasts.map(toast => {
          let typeColor = 'border-indigo-500 bg-white dark:bg-slate-800';
          if (toast.type === 'success') {
            typeColor = 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/20';
          } else if (toast.type === 'error') {
            typeColor = 'border-rose-500 bg-rose-50/10 dark:bg-rose-950/20';
          } else if (toast.type === 'warning') {
            typeColor = 'border-amber-500 bg-amber-50/10 dark:bg-amber-950/20';
          }

          return (
            <div
              key={toast.id}
              className={`p-4 rounded-xl border-l-4 shadow-lg flex justify-between items-start gap-3 backdrop-blur-md transition-all duration-300 animate-slideIn ${typeColor}`}
            >
              <span className="text-xs font-semibold leading-relaxed text-slate-800 dark:text-slate-200">
                {toast.message}
              </span>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 cursor-pointer p-0.5"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
