// EnglishFree - Interactive Dictionary & Annotation Service

class VocabularyDictionary {
  constructor() {
    this.annotations = {};
    this.tooltipTimeout = null;
    this.activeTooltip = null;
    this.globalCache = JSON.parse(localStorage.getItem('ef_dict_cache')) || {};
  }

  getAnnotationsKey() {
    if (typeof app !== 'undefined' && app.currentUser) {
      return `ef_annotations_${app.currentUser}`;
    }
    return 'ef_annotations';
  }

  loadAnnotations() {
    const key = this.getAnnotationsKey();
    this.annotations = JSON.parse(localStorage.getItem(key)) || {};
    return this.annotations;
  }

  init() {
    // Listen for Shift key
    window.addEventListener('keydown', async (e) => {
      if (e.key === 'Shift') {
        await this.handleDictionaryTrigger();
      }
    });

    // Hover event delegation with preservation timeout
    window.addEventListener('mouseover', (e) => {
      const mark = e.target.closest('.dict-highlight');
      const tooltip = e.target.closest('#dict-tooltip');
      
      if (mark) {
        clearTimeout(this.tooltipTimeout);
        const meaning = mark.getAttribute('data-meaning');
        this.showTooltip(mark, meaning);
      } else if (tooltip) {
        clearTimeout(this.tooltipTimeout);
      }
    });

    window.addEventListener('mouseout', (e) => {
      const mark = e.target.closest('.dict-highlight');
      const tooltip = e.target.closest('#dict-tooltip');
      
      if (mark || tooltip) {
        clearTimeout(this.tooltipTimeout);
        this.tooltipTimeout = setTimeout(() => {
          this.removeTooltip();
        }, 300);
      }
    });
  }

  getLessonKey() {
    if (typeof app !== 'undefined') {
      if (app.currentTab === 'reading' && typeof reading !== 'undefined' && reading.currentStory) {
        return `reading_${reading.currentStory.id}`;
      } else if (app.currentTab === 'listening' && typeof listening !== 'undefined' && listening.currentLesson) {
        return `listening_${listening.currentLesson.id}`;
      } else {
        return `${app.currentTab}_general`;
      }
    }
    return 'general';
  }

  async handleDictionaryTrigger() {
    const selection = window.getSelection();
    if (!selection) return;
    
    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    // Must contain at least one letter
    if (!/[a-zA-Z]/.test(selectedText)) return;

    const anchorNode = selection.anchorNode;
    if (!anchorNode) return;
    const parentEl = anchorNode.parentElement;
    if (!parentEl) return;

    // Exclude input, textarea, and contenteditable fields from text wrapping
    const isEditable = parentEl.closest('input') || parentEl.closest('textarea') || parentEl.closest('[contenteditable="true"]');
    
    const lessonKey = this.getLessonKey();

    if (isEditable) {
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        await this.translateSelectedTextNoWrap(selectedText, range, lessonKey);
      }
      return;
    }

    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const mark = document.createElement('mark');
      mark.className = 'dict-highlight';
      mark.style.backgroundColor = '#ffeaa7';
      mark.style.color = '#2d3436';
      mark.style.cursor = 'pointer';
      mark.style.borderRadius = '3px';
      mark.style.padding = '0 2px';
      mark.style.position = 'relative';
      
      mark.setAttribute('data-word', selectedText);
      mark.setAttribute('data-meaning', 'Đang dịch...');
      
      let wrapped = false;
      try {
        range.surroundContents(mark);
        selection.removeAllRanges();
        wrapped = true;
      } catch (err) {
        console.warn("surroundContents failed, extracting range contents instead", err);
        try {
          const contents = range.extractContents();
          mark.appendChild(contents);
          range.insertNode(mark);
          selection.removeAllRanges();
          wrapped = true;
        } catch (e) {
          console.error("Text selection wrapping failed completely", e);
        }
      }

      if (wrapped) {
        await this.translateSelectedText(selectedText, mark, lessonKey);
      } else {
        await this.translateSelectedTextNoWrap(selectedText, range, lessonKey);
      }
    }
  }

  getPrefix(word) {
    word = word.trim().toLowerCase();
    if (!word) return null;
    if (word.length === 1) {
      return word + 'a';
    }
    const charCode0 = word.charCodeAt(0);
    if (charCode0 < 97 || charCode0 > 122) { // not a-z
      return '11';
    }
    const prefix = word.substring(0, 2);
    const charCode1 = prefix.charCodeAt(1);
    if (charCode1 < 97 || charCode1 > 122) { // second char is not a-z
      return prefix[0] + 'a';
    }
    return prefix;
  }

  async lookupLocalDict(word) {
    const prefix = this.getPrefix(word);
    if (!prefix) return null;

    try {
      const response = await fetch(`dict/${prefix}.html`);
      if (!response.ok) {
        console.warn(`Local dictionary shard not found for prefix: ${prefix}`);
        return null;
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const gzipData = new Uint8Array(arrayBuffer);
      
      if (typeof fflate === 'undefined') {
        console.error('fflate library is not loaded');
        return null;
      }
      
      const decompressed = fflate.gunzipSync(gzipData);
      const htmlText = new TextDecoder('utf-8').decode(decompressed);
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      
      let target = null;
      try {
        const safeWord = word.replace(/["\\]/g, '\\$&'); // escape for selector
        target = doc.querySelector(`a[name="${safeWord}"], variant[name="${safeWord}"]`);
      } catch (selErr) {
        console.warn("querySelector failed, falling back to manual search", selErr);
      }
      
      if (!target) {
        const anchors = doc.getElementsByTagName('a');
        for (let i = 0; i < anchors.length; i++) {
          if (anchors[i].getAttribute('name') === word) {
            target = anchors[i];
            break;
          }
        }
      }
      if (!target) {
        const variants = doc.getElementsByTagName('variant');
        for (let i = 0; i < variants.length; i++) {
          if (variants[i].getAttribute('name') === word) {
            target = variants[i];
            break;
          }
        }
      }
      
      if (!target) {
        return null;
      }
      
      const wElement = target.closest('w');
      if (!wElement) return null;
      
      const clone = wElement.cloneNode(true);
      
      const varEl = clone.querySelector('var');
      if (varEl) varEl.remove();
      
      const aEl = clone.querySelector('a');
      if (aEl) aEl.remove();
      
      clone.querySelectorAll('span, div, p').forEach(el => {
        if (el.textContent.includes('sachxy.com')) {
          el.remove();
        }
      });
      
      return clone.innerHTML.trim();
    } catch (err) {
      console.error(`Error looking up word "${word}" in local dict:`, err);
      return null;
    }
  }

  async lookupTranslation(text) {
    let translation = "";
    const cleanText = text.replace(/[.,\/#!$%\^&\*;:{}=\-_~()?]/g, "").toLowerCase().trim();

    // 1. Check global translation cache first (0ms)
    if (this.globalCache && this.globalCache[cleanText]) {
      return this.globalCache[cleanText];
    }

    // 2. Check local database next (0ms)
    if (typeof VOCABULARY_DATA !== 'undefined') {
      const found = VOCABULARY_DATA.find(v => v.word.toLowerCase() === cleanText);
      if (found) {
        translation = `${found.translation} - Từ vựng CEFR ${found.level}`;
        this.globalCache[cleanText] = translation;
        localStorage.setItem('ef_dict_cache', JSON.stringify(this.globalCache));
        return translation;
      }
    }

    // 3. Check local compressed dictionary next (~2-5ms)
    try {
      const localDef = await this.lookupLocalDict(cleanText);
      if (localDef) {
        translation = localDef;
        this.globalCache[cleanText] = translation;
        localStorage.setItem('ef_dict_cache', JSON.stringify(this.globalCache));
        return translation;
      }
    } catch (localDictErr) {
      console.warn("Local compressed dictionary lookup failed:", localDictErr);
    }

    // 4. Fallback to Online API calls
    try {
      const gTranslateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(cleanText)}`;
      const gResponse = await fetch(gTranslateUrl);
      let viTranslation = "";
      if (gResponse.ok) {
        const gData = await gResponse.json();
        if (gData && gData[0] && gData[0][0] && gData[0][0][0]) {
          viTranslation = gData[0][0][0].trim();
        }
      }

      let enDef = "";
      let phonetic = "";
      if (cleanText.split(/\s+/).length === 1) {
        try {
          const dictUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanText)}`;
          const dictResponse = await fetch(dictUrl);
          if (dictResponse.ok) {
            const dictData = await dictResponse.json();
            if (dictData && dictData[0]) {
              phonetic = dictData[0].phonetic || (dictData[0].phonetics && dictData[0].phonetics[0] ? dictData[0].phonetics[0].text : "");
              if (dictData[0].meanings && dictData[0].meanings[0] && dictData[0].meanings[0].definitions && dictData[0].meanings[0].definitions[0]) {
                enDef = dictData[0].meanings[0].definitions[0].definition;
              }
            }
          }
        } catch (dictErr) {
          console.warn("Free Dictionary API failed:", dictErr);
        }
      }

      if (viTranslation) {
        translation = viTranslation;
        if (phonetic) translation += ` ${phonetic}`;
        if (enDef) {
          const shortDef = enDef.length > 80 ? enDef.substring(0, 77) + "..." : enDef;
          translation += ` — Def: ${shortDef}`;
        }
        this.globalCache[cleanText] = translation;
        localStorage.setItem('ef_dict_cache', JSON.stringify(this.globalCache));
        return translation;
      }
    } catch (apiErr) {
      console.error("Online API translation failed:", apiErr);
    }

    // 5. Ultimate fallback to AI API
    if (typeof app !== 'undefined') {
      const systemPrompt = `You are a helpful English-Vietnamese dictionary. Provide a precise, concise Vietnamese translation and a short explanation for the given word or phrase.
Output format: '[Vietnamese Translation] - [Short explanation (under 15 words) in Vietnamese]'.`;
      try {
        const reply = await app.callAI(systemPrompt, text, 60);
        if (reply) {
          translation = reply.trim();
          this.globalCache[cleanText] = translation;
          localStorage.setItem('ef_dict_cache', JSON.stringify(this.globalCache));
          return translation;
        }
      } catch (e) {
        console.error("Gemini dictionary backup call error", e);
      }
    }

    return "Dịch nghĩa chưa khả dụng (Hãy kiểm tra kết nối mạng)";
  }

  async translateSelectedText(text, markElement, lessonKey) {
    const translation = await this.lookupTranslation(text);

    // Save annotation only if it's a persistent lesson key
    if (lessonKey && lessonKey !== "general_lookup" && !lessonKey.endsWith("_general")) {
      this.loadAnnotations();
      if (!this.annotations[lessonKey]) {
        this.annotations[lessonKey] = {};
      }
      this.annotations[lessonKey][text] = translation;
      localStorage.setItem(this.getAnnotationsKey(), JSON.stringify(this.annotations));
    }

    // Update element
    markElement.setAttribute('data-meaning', translation);

    // Show tooltip
    this.showTooltip(markElement, translation);
  }

  async translateSelectedTextNoWrap(text, range, lessonKey) {
    const translation = await this.lookupTranslation(text);

    // Save annotation only if it's a persistent lesson key
    if (lessonKey && lessonKey !== "general_lookup" && !lessonKey.endsWith("_general")) {
      this.loadAnnotations();
      if (!this.annotations[lessonKey]) {
        this.annotations[lessonKey] = {};
      }
      this.annotations[lessonKey][text] = translation;
      localStorage.setItem(this.getAnnotationsKey(), JSON.stringify(this.annotations));
    }

    // Show tooltip pointing directly to range bounds
    this.showTooltip(range, translation, text);
  }

  showTooltip(target, text, wordText = '') {
    this.removeTooltip();

    const rect = target.getBoundingClientRect();
    if (!wordText && target.getAttribute) {
      wordText = target.getAttribute('data-word') || '';
    }

    const tooltip = document.createElement('div');
    tooltip.id = 'dict-tooltip';
    
    const isMark = target.classList && target.classList.contains('dict-highlight');
    const deleteButtonHtml = isMark 
      ? `<button id="tooltip-btn-delete" style="background:none; border:none; color:var(--danger-color); cursor:pointer; font-size:1rem; padding:0;" title="Xóa chú thích">🗑️</button>`
      : '';

    tooltip.innerHTML = `
      <div style="font-weight: 700; color: var(--primary-color); border-bottom: 1px solid var(--border-color); padding-bottom: 4px; margin-bottom: 6px; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
        <span>📖 ${wordText}</span>
        <div style="display: flex; gap: 8px;">
          <button id="tooltip-btn-speak" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1rem; padding:0;" title="Phát âm">🔊</button>
          ${deleteButtonHtml}
        </div>
      </div>
      <div style="font-size: 0.85rem; line-height: 1.4; color: var(--text-color); max-height: 250px; overflow-y: auto; padding-right: 4px;">${text}</div>
    `;

    Object.assign(tooltip.style, {
      position: 'absolute',
      zIndex: '10000',
      backgroundColor: 'var(--panel-bg)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 12px',
      boxShadow: 'var(--shadow-lg)',
      maxWidth: '320px',
      pointerEvents: 'auto',
      opacity: '0',
      transition: 'opacity 0.2s ease',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'left'
    });

    document.body.appendChild(tooltip);
    this.activeTooltip = tooltip;

    const speakBtn = tooltip.querySelector("#tooltip-btn-speak");
    if (speakBtn) {
      speakBtn.onclick = (e) => {
        e.stopPropagation();
        if (typeof app !== 'undefined') {
          app.speak(wordText, 0.85);
        }
      };
    }

    const deleteBtn = tooltip.querySelector("#tooltip-btn-delete");
    if (deleteBtn && isMark) {
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        this.deleteAnnotation(wordText, target);
      };
    }

    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;

    let left = rect.left + window.scrollX + (rect.width - tooltipWidth) / 2;
    let top = rect.top + window.scrollY - tooltipHeight - 8;

    if (left < 10) left = 10;
    if (left + tooltipWidth > window.innerWidth - 10) {
      left = window.innerWidth - tooltipWidth - 10;
    }
    if (top < window.scrollY + 10) {
      top = rect.bottom + window.scrollY + 8;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;

    setTimeout(() => {
      tooltip.style.opacity = '1';
    }, 10);
  }

  removeTooltip() {
    const existing = document.getElementById('dict-tooltip');
    if (existing) {
      existing.remove();
      this.activeTooltip = null;
    }
  }

  deleteAnnotation(wordText, element) {
    const lessonKey = this.getLessonKey();
    this.loadAnnotations();
    if (lessonKey && this.annotations[lessonKey]) {
      delete this.annotations[lessonKey][wordText];
      localStorage.setItem(this.getAnnotationsKey(), JSON.stringify(this.annotations));
    }

    // Unwrap element
    const parent = element.parentNode;
    if (parent) {
      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
      }
      parent.removeChild(element);
    }
    
    this.removeTooltip();
    if (typeof app !== 'undefined') {
      app.showToast('Đã xóa chú thích từ vựng!', 'info');
    }
  }

  applySavedAnnotations(containerId, lessonKey) {
    const container = document.getElementById(containerId);
    if (!container) return;

    this.loadAnnotations();
    const levelAnnotations = this.annotations[lessonKey] || {};
    if (Object.keys(levelAnnotations).length === 0) return;

    this.wrapTextNodes(container, levelAnnotations);
  }

  wrapTextNodes(node, annotations) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue;
      const parent = node.parentNode;
      
      if (!parent || parent.closest('mark') || parent.closest('button') || parent.closest('.speaker-name')) return;
      
      const sortedPhrases = Object.keys(annotations).sort((a, b) => b.length - a.length);
      
      for (const phrase of sortedPhrases) {
        const escaped = phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
        
        if (regex.test(text)) {
          const meaning = annotations[phrase];
          const escapedMeaning = meaning.replace(/"/g, '&quot;');
          const replacedText = text.replace(regex, (match) => {
            return `<mark class="dict-highlight" data-word="${match}" data-meaning="${escapedMeaning}" style="background-color: #ffeaa7; color: #2d3436; cursor: pointer; border-radius: 3px; padding: 0 2px; position: relative;">${match}</mark>`;
          });
          
          const temp = document.createElement('div');
          temp.innerHTML = replacedText;
          
          const fragment = document.createDocumentFragment();
          while (temp.firstChild) {
            fragment.appendChild(temp.firstChild);
          }
          
          parent.replaceChild(fragment, node);
          break; // Stop matching this text node since it's replaced
        }
      }
    } else {
      if (node.id === 'dict-tooltip' || node.classList.contains('dict-highlight')) return;
      const children = Array.from(node.childNodes);
      children.forEach(child => this.wrapTextNodes(child, annotations));
    }
  }
}

// Global dictionary instance
const vocabDictionary = new VocabularyDictionary();
window.addEventListener('DOMContentLoaded', () => vocabDictionary.init());
