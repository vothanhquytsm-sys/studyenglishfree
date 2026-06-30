import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import * as fflate from 'fflate';

interface DictDefinition {
  word: string;
  translation: string;
  phonetic?: string;
  ipa?: string;
  enDefinition?: string;
}

export const Dictionary: React.FC = () => {
  const { showToast } = useApp();
  const [definition, setDefinition] = useState<DictDefinition | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<Record<string, string>>({});
  const popoverRef = useRef<HTMLDivElement>(null);

  // Load cache from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ef_dict_cache');
      if (saved) cacheRef.current = JSON.parse(saved);
    } catch {}
  }, []);

  const saveCache = (word: string, translation: string) => {
    cacheRef.current[word] = translation;
    try {
      localStorage.setItem('ef_dict_cache', JSON.stringify(cacheRef.current));
    } catch {}
  };

  const getPrefix = (word: string): string | null => {
    const w = word.trim().toLowerCase();
    if (!w) return null;
    if (w.length === 1) return w + 'a';
    const charCode0 = w.charCodeAt(0);
    if (charCode0 < 97 || charCode0 > 122) return '11';
    const prefix = w.substring(0, 2);
    const charCode1 = prefix.charCodeAt(1);
    if (charCode1 < 97 || charCode1 > 122) return prefix[0] + 'a';
    return prefix;
  };

  const lookupLocalDict = async (word: string): Promise<string | null> => {
    const prefix = getPrefix(word);
    if (!prefix) return null;
    try {
      // Use import.meta.env.BASE_URL to resolve paths correctly in subfolders
      const response = await fetch(`${import.meta.env.BASE_URL}dict/${prefix}.html`);
      if (!response.ok) return null;

      const arrayBuffer = await response.arrayBuffer();
      const gzipData = new Uint8Array(arrayBuffer);
      const decompressed = fflate.gunzipSync(gzipData);
      const htmlText = new TextDecoder('utf-8').decode(decompressed);

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');

      const safeWord = word.replace(/["\\]/g, '\\$&');
      let target = doc.querySelector(`a[name="${safeWord}"], variant[name="${safeWord}"]`);

      if (!target) {
        const anchors = doc.getElementsByTagName('a');
        for (let i = 0; i < anchors.length; i++) {
          if (anchors[i].getAttribute('name') === word) {
            target = anchors[i];
            break;
          }
        }
      }

      if (!target) return null;
      const wElement = target.closest('w');
      if (!wElement) return null;

      const clone = wElement.cloneNode(true) as HTMLElement;
      clone.querySelector('var')?.remove();
      clone.querySelector('a')?.remove();
      clone.querySelectorAll('span, div, p').forEach(el => {
        if (el.textContent?.includes('sachxy.com')) el.remove();
      });

      return clone.innerHTML.trim();
    } catch (err) {
      console.warn(`Error looking up "${word}" locally:`, err);
      return null;
    }
  };

  const lookupWord = async (word: string) => {
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").toLowerCase().trim();
    if (!cleanWord) return;

    setLoading(true);

    // 1. Check cache
    if (cacheRef.current[cleanWord]) {
      setDefinition({
        word: cleanWord,
        translation: cacheRef.current[cleanWord]
      });
      setLoading(false);
      return;
    }

    let translation = '';
    let phonetic = '';
    let enDefinition = '';

    // 2. Check local dict
    try {
      const localDef = await lookupLocalDict(cleanWord);
      if (localDef) {
        translation = localDef;
        saveCache(cleanWord, translation);
        setDefinition({ word: cleanWord, translation });
        setLoading(false);
        return;
      }
    } catch {}

    // 3. Check Google Translate
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(cleanWord)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data?.[0]?.[0]?.[0]) {
          translation = data[0][0][0].trim();
        }
      }
    } catch {}

    // 4. Check English dictionary API for definitions & phonetic
    if (cleanWord.split(/\s+/).length === 1) {
      try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.[0]) {
            phonetic = data[0].phonetic || data[0].phonetics?.[0]?.text || '';
            enDefinition = data[0].meanings?.[0]?.definitions?.[0]?.definition || '';
          }
        }
      } catch {}
    }

    const finalDef: DictDefinition = {
      word: cleanWord,
      translation: translation || 'Không tìm thấy bản dịch.',
      phonetic,
      enDefinition
    };

    saveCache(cleanWord, finalDef.translation);
    setDefinition(finalDef);
    setLoading(false);
  };

  const triggerSearch = async () => {
    const selection = window.getSelection();
    if (!selection) return;

    const text = selection.toString().trim();
    if (!text || !/[a-zA-Z]/.test(text)) return;

    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setPosition({
        x: rect.left + window.scrollX,
        y: rect.bottom + window.scrollY + 8
      });

      await lookupWord(text);
    }
  };

  useEffect(() => {
    // Pressing Shift triggers translation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        triggerSearch();
      }
    };

    // Clicking elsewhere hides the definition popover
    const handleMouseDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setDefinition(null);
        setPosition(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const speak = () => {
    if (!definition?.word) return;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(definition.word);
      utter.lang = 'en-US';
      window.speechSynthesis.speak(utter);
    }
  };

  if (!position) return null;

  return (
    <div
      ref={popoverRef}
      style={{
        position: 'absolute',
        left: Math.min(position.x, window.innerWidth - 320),
        top: position.y,
        zIndex: 9999
      }}
      className="w-72 max-w-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-4 transition-all animate-fadeIn"
    >
      {loading ? (
        <div className="flex items-center justify-center py-4 gap-2 text-sm text-slate-500">
          <svg className="animate-spin h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Đang tra từ...
        </div>
      ) : definition ? (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-1.5">
            <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400 capitalize">{definition.word}</span>
            <button
              onClick={speak}
              className="text-base p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full cursor-pointer transition"
              title="Nghe phát âm"
            >
              🔊
            </button>
          </div>

          {definition.phonetic && (
            <span className="text-xs font-mono text-slate-400">{definition.phonetic}</span>
          )}

          {definition.enDefinition && (
            <div className="text-xs italic text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
              {definition.enDefinition}
            </div>
          )}

          <div
            className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 max-h-48 overflow-y-auto pr-1"
            dangerouslySetInnerHTML={{ __html: definition.translation }}
          />
        </div>
      ) : null}
    </div>
  );
};

export default Dictionary;
