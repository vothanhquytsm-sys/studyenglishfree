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
      }
    }
    return null;
  }

  async handleDictionaryTrigger() {
    const selection = window.getSelection();
    if (!selection) return;
    
    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    // Check if selection is within target containers
    const anchorNode = selection.anchorNode;
    if (!anchorNode) return;
    const parentEl = anchorNode.parentElement;
    if (!parentEl) return;

    const withinReading = parentEl.closest('#reading-read-pane') || parentEl.closest('#reading-sentences-container');
    const withinListening = parentEl.closest('#listening-transcript-content');

    if (!withinReading && !withinListening) return;

    const lessonKey = this.getLessonKey();
    if (!lessonKey) return;

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

      try {
        range.surroundContents(mark);
        selection.removeAllRanges();
      } catch (err) {
        console.warn("surroundContents failed, extracting range contents instead", err);
        try {
          const contents = range.extractContents();
          mark.appendChild(contents);
          range.insertNode(mark);
          selection.removeAllRanges();
        } catch (e) {
          console.error("Text selection wrapping failed completely", e);
          return;
        }
      }

      // Call translation
      await this.translateSelectedText(selectedText, mark, lessonKey);
    }
  }

  async translateSelectedText(text, markElement, lessonKey) {
    let translation = "";
    const cleanText = text.replace(/[.,\/#!$%\^&\*;:{}=\-_~()?]/g, "").toLowerCase().trim();

    // 1. Check global translation cache first (0ms)
    if (this.globalCache && this.globalCache[cleanText]) {
      translation = this.globalCache[cleanText];
    }

    // 2. Check local database next (0ms)
    if (!translation && typeof VOCABULARY_DATA !== 'undefined') {
      const found = VOCABULARY_DATA.find(v => v.word.toLowerCase() === cleanText);
      if (found) {
        translation = `${found.translation} - Từ vựng CEFR ${found.level}`;
        this.globalCache[cleanText] = translation;
        localStorage.setItem('ef_dict_cache', JSON.stringify(this.globalCache));
      }
    }

    // 3. Fallback to Online API calls (Google Translate + Free Dictionary API) - keyless, lightning-fast
    if (!translation) {
      try {
        // Fetch translation from Google Translate (extremely fast, CORS-enabled, no key required)
        const gTranslateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(cleanText)}`;
        const gResponse = await fetch(gTranslateUrl);
        let viTranslation = "";
        if (gResponse.ok) {
          const gData = await gResponse.json();
          if (gData && gData[0] && gData[0][0] && gData[0][0][0]) {
            viTranslation = gData[0][0][0].trim();
          }
        }

        // Fetch English definition & pronunciation from Free Dictionary API (CORS-enabled, no key required)
        let enDef = "";
        let phonetic = "";
        if (cleanText.split(/\s+/).length === 1) { // only lookup single words in dictionary
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

        // Assemble translation
        if (viTranslation) {
          translation = viTranslation;
          if (phonetic) {
            translation += ` ${phonetic}`;
          }
          if (enDef) {
            const shortDef = enDef.length > 80 ? enDef.substring(0, 77) + "..." : enDef;
            translation += ` — Def: ${shortDef}`;
          }
          
          this.globalCache[cleanText] = translation;
          localStorage.setItem('ef_dict_cache', JSON.stringify(this.globalCache));
        }
      } catch (apiErr) {
        console.error("Online API translation failed:", apiErr);
      }
    }

    // 4. Ultimate fallback to Gemini API if online APIs failed and key is available
    if (!translation && typeof app !== 'undefined' && app.apiKey) {
      const systemPrompt = `You are a helpful English-Vietnamese dictionary. Provide a precise, concise Vietnamese translation and a short explanation for the given word or phrase.
Output format: '[Vietnamese Translation] - [Short explanation (under 15 words) in Vietnamese]'.
Example: for 'curriculum', output: 'chương trình học - Các môn học được giảng dạy tại trường'.`;
      
      try {
        const reply = await app.callGemini(systemPrompt, text, 60);
        if (reply) {
          translation = reply.trim();
          this.globalCache[cleanText] = translation;
          localStorage.setItem('ef_dict_cache', JSON.stringify(this.globalCache));
        }
      } catch (e) {
        console.error("Gemini dictionary backup call error", e);
      }
    }

    if (!translation) {
      translation = "Dịch nghĩa chưa khả dụng (Hãy kiểm tra kết nối mạng)";
    }

    // Save annotation for this lesson
    this.loadAnnotations();
    if (!this.annotations[lessonKey]) {
      this.annotations[lessonKey] = {};
    }
    this.annotations[lessonKey][text] = translation;
    localStorage.setItem(this.getAnnotationsKey(), JSON.stringify(this.annotations));

    // Update element
    markElement.setAttribute('data-meaning', translation);

    // Show tooltip immediately
    this.showTooltip(markElement, translation);
  }

  showTooltip(element, text) {
    this.removeTooltip();

    const rect = element.getBoundingClientRect();
    const wordText = element.getAttribute('data-word') || '';

    const tooltip = document.createElement('div');
    tooltip.id = 'dict-tooltip';
    
    // HTML contents with Play and Delete buttons
    tooltip.innerHTML = `
      <div style="font-weight: 700; color: var(--primary-color); border-bottom: 1px solid var(--border-color); padding-bottom: 4px; margin-bottom: 6px; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
        <span>📖 ${wordText}</span>
        <div style="display: flex; gap: 8px;">
          <button id="tooltip-btn-speak" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1rem; padding:0;" title="Phát âm">🔊</button>
          <button id="tooltip-btn-delete" style="background:none; border:none; color:var(--danger-color); cursor:pointer; font-size:1rem; padding:0;" title="Xóa chú thích">🗑️</button>
        </div>
      </div>
      <div style="font-size: 0.85rem; line-height: 1.4; color: var(--text-color);">${text}</div>
    `;

    // Tooltip style settings
    Object.assign(tooltip.style, {
      position: 'absolute',
      zIndex: '10000',
      backgroundColor: 'var(--panel-bg)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 12px',
      boxShadow: 'var(--shadow-lg)',
      maxWidth: '280px',
      pointerEvents: 'auto',
      opacity: '0',
      transition: 'opacity 0.2s ease',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'left'
    });

    document.body.appendChild(tooltip);
    this.activeTooltip = tooltip;

    // Hook up button listeners
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
    if (deleteBtn) {
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        this.deleteAnnotation(wordText, element);
      };
    }

    // Position coordinates
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

    // Trigger transition
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
