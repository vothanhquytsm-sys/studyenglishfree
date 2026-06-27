// ╔══════════════════════════════════════════════════════════════════════╗
// ║  EnglishFree — Cloud Sync Module (cloudsync.js)                    ║
// ║  Backend: JSONBin.io (free tier, no user signup required)          ║
// ║  Stores per-user progress + chat history across devices/cache      ║
// ╚══════════════════════════════════════════════════════════════════════╝
//
// SETUP: Đăng ký miễn phí tại https://jsonbin.io/
//   1. Vào Dashboard → API Keys → copy X-Master-Key
//   2. Thay giá trị JSONBIN_MASTER_KEY bên dưới
//   3. Push lên GitHub → tự động hoạt động cho mọi người dùng

const JSONBIN_MASTER_KEY = '$2a$10$fvbde7Fbo7IRLPtVTc2CSOaCDSyplRTbUax5g1/hFd4Yk3Zrwr9Ny';
const JSONBIN_BASE       = 'https://api.jsonbin.io/v3';
const JSONBIN_COLLECTION = ''; // optional: collection ID để nhóm bins

const CloudSync = (() => {
  // ── Private state ──────────────────────────────────────────────────────
  let _username    = null;
  let _progressBin = null; // { id, version }
  let _chatBin     = null;
  let _pushTimer   = null;
  let _ready       = false;
  let _keyMissing  = JSONBIN_MASTER_KEY.includes('REPLACE_WITH') || JSONBIN_MASTER_KEY.length < 30;

  // ── Headers ───────────────────────────────────────────────────────────
  const _headers = () => ({
    'Content-Type':  'application/json',
    'X-Master-Key':  JSONBIN_MASTER_KEY,
    'X-Bin-Private': 'true',
  });

  // ── Internal helpers ──────────────────────────────────────────────────

  /** Lấy key localStorage cho bin ID của user */
  const _binKey      = (type) => `ef_cloud_bin_${type}_${_username}`;
  const _localBinId  = (type) => localStorage.getItem(_binKey(type));
  const _saveBinId   = (type, id) => localStorage.setItem(_binKey(type), id);

  /** Tạo bin mới với nội dung JSON */
  async function _createBin(name, data) {
    if (_keyMissing) return null;
    try {
      const body = {
        name,
        private: true,
        ...(JSONBIN_COLLECTION ? { collectionId: JSONBIN_COLLECTION } : {}),
      };
      const res = await fetch(`${JSONBIN_BASE}/b`, {
        method: 'POST',
        headers: { ..._headers(), 'X-Bin-Name': name },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        console.warn('[CloudSync] createBin failed', res.status);
        return null;
      }
      const json = await res.json();
      return json.metadata?.id || null;
    } catch (e) {
      console.warn('[CloudSync] createBin error', e);
      return null;
    }
  }

  /** Đọc bin */
  async function _readBin(id) {
    if (_keyMissing || !id) return null;
    try {
      const res = await fetch(`${JSONBIN_BASE}/b/${id}/latest`, {
        headers: _headers(),
      });
      if (!res.ok) {
        if (res.status === 404) return null; // bin bị xóa
        console.warn('[CloudSync] readBin failed', res.status);
        return null;
      }
      const json = await res.json();
      return json.record ?? null;
    } catch (e) {
      console.warn('[CloudSync] readBin error', e);
      return null;
    }
  }

  /** Ghi bin */
  async function _writeBin(id, data) {
    if (_keyMissing || !id) return false;
    try {
      const res = await fetch(`${JSONBIN_BASE}/b/${id}`, {
        method: 'PUT',
        headers: _headers(),
        body: JSON.stringify(data),
      });
      return res.ok;
    } catch (e) {
      console.warn('[CloudSync] writeBin error', e);
      return false;
    }
  }

  /** Tìm bin theo tên (dùng Search API nếu không có local ID) */
  async function _findBinByName(name) {
    if (_keyMissing) return null;
    try {
      // Lấy danh sách bin trong account (tối đa 20)
      const res = await fetch(`${JSONBIN_BASE}/b`, { headers: _headers() });
      if (!res.ok) return null;
      const json = await res.json();
      const match = (json.result || []).find(b => b.snippetMeta?.name === name || b.record?._name === name);
      return match?.snippetMeta?.id || null;
    } catch (e) {
      return null;
    }
  }

  // ── Status badge UI ───────────────────────────────────────────────────

  function _setStatus(state, detail = '') {
    const el = document.getElementById('cloud-sync-badge');
    if (!el) return;
    const map = {
      ready:   { icon: '☁️',  text: 'Đã lưu cloud',   color: 'var(--success-color)' },
      syncing: { icon: '⏳', text: 'Đang lưu...',      color: 'var(--primary-color)' },
      error:   { icon: '⚠️',  text: 'Lỗi lưu cloud',   color: 'var(--danger-color)'  },
      offline: { icon: '📴', text: 'Chưa cấu hình',    color: 'var(--text-muted)'    },
    };
    const s = map[state] || map.offline;
    el.innerHTML = `${s.icon} <span style="font-size:0.72rem;">${detail || s.text}</span>`;
    el.style.color = s.color;
  }

  // ── Merge helpers ─────────────────────────────────────────────────────

  function _mergeProgress(local, remote) {
    if (!remote) return local;
    const merged = { ...local };

    // Arrays: union (dedup)
    const arrFields = [
      'wordsLearned', 'listeningCompleted', 'readingCompleted',
      'speakingCompleted', 'writingCompleted', 'reflexCompleted',
    ];
    arrFields.forEach(k => {
      merged[k] = Array.from(new Set([...(local[k] || []), ...(remote[k] || [])]));
    });

    // Numbers: max
    merged.testsPassed = Math.max(local.testsPassed || 0, remote.testsPassed || 0);

    // vocabProgress: max per key
    merged.vocabProgress = {};
    const vKeys = new Set([
      ...Object.keys(local.vocabProgress || {}),
      ...Object.keys(remote.vocabProgress || {}),
    ]);
    vKeys.forEach(k => {
      merged.vocabProgress[k] = Math.max(
        (local.vocabProgress || {})[k] || 1,
        (remote.vocabProgress || {})[k] || 1,
      );
    });

    // dailyLog: union per date
    merged.dailyLog = {};
    const dates = new Set([
      ...Object.keys(local.dailyLog || {}),
      ...Object.keys(remote.dailyLog || {}),
    ]);
    dates.forEach(d => {
      const lL = (local.dailyLog || {})[d]  || {};
      const rL = (remote.dailyLog || {})[d] || {};
      const subFields = ['words', 'listening', 'reading', 'reflex'];
      merged.dailyLog[d] = {};
      subFields.forEach(f => {
        merged.dailyLog[d][f] = Array.from(new Set([...(lL[f] || []), ...(rL[f] || [])]));
      });
    });

    return merged;
  }

  // ══════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Khởi tạo CloudSync cho một user.
   * Gọi ngay sau khi đăng nhập thành công.
   * @param {string} username
   * @returns {Promise<object|null>} remote progress để merge, hoặc null
   */
  async function init(username) {
    _username = username;
    _ready    = false;

    if (_keyMissing) {
      console.info('[CloudSync] Master key not configured — sync disabled.');
      _setStatus('offline');
      return null;
    }

    _setStatus('syncing', 'Kết nối cloud...');

    // ── Progress bin ──────────────────────────────────────────────────
    const progBinName = `ef_progress_${username}`;
    let progId = _localBinId('progress');

    if (!progId) {
      // Tìm trên server
      progId = await _findBinByName(progBinName);
      if (progId) _saveBinId('progress', progId);
    }

    let remoteProgress = null;
    if (progId) {
      remoteProgress = await _readBin(progId);
      if (!remoteProgress && progId) {
        // Bin bị xóa trên server
        localStorage.removeItem(_binKey('progress'));
        progId = null;
      }
    }

    if (!progId) {
      // Tạo bin mới
      progId = await _createBin(progBinName, { _name: progBinName, _created: Date.now() });
      if (progId) _saveBinId('progress', progId);
    }

    _progressBin = progId;

    // ── Chat bin ──────────────────────────────────────────────────────
    const chatBinName = `ef_chat_${username}`;
    let chatId = _localBinId('chat');

    if (!chatId) {
      chatId = await _findBinByName(chatBinName);
      if (chatId) _saveBinId('chat', chatId);
    }

    if (!chatId) {
      chatId = await _createBin(chatBinName, { _name: chatBinName, messages: [] });
      if (chatId) _saveBinId('chat', chatId);
    }

    _chatBin = chatId;
    _ready   = true;

    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    _setStatus('ready', `Đã lưu lúc ${timeStr}`);

    console.info(`[CloudSync] Ready. progress bin=${_progressBin}, chat bin=${_chatBin}`);
    return remoteProgress; // caller merges this with local
  }

  /**
   * Upload progress lên cloud (debounced 3s để tránh spam).
   * @param {object} progress
   */
  function push(progress) {
    if (!_ready || !_progressBin || _keyMissing) return;

    _setStatus('syncing', 'Đang lưu...');

    clearTimeout(_pushTimer);
    _pushTimer = setTimeout(async () => {
      const ok = await _writeBin(_progressBin, { ...progress, _user: _username, _updated: Date.now() });
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      if (ok) {
        _setStatus('ready', `Đã lưu lúc ${timeStr}`);
        localStorage.setItem(`ef_cloud_last_sync_${_username}`, timeStr);
      } else {
        _setStatus('error');
      }
    }, 3000);
  }

  /**
   * Fetch progress từ cloud và trả về object thô.
   * @returns {Promise<object|null>}
   */
  async function pull() {
    if (!_ready || !_progressBin || _keyMissing) return null;
    return _readBin(_progressBin);
  }

  /**
   * Merge remote progress vào local và trả về merged object.
   * @param {object} local
   * @param {object} remote
   * @returns {object}
   */
  function merge(local, remote) {
    return _mergeProgress(local, remote);
  }

  /**
   * Lưu một cặp tin nhắn chatbot.
   * @param {'user'|'assistant'} role
   * @param {string} content
   */
  async function saveChatMessage(role, content) {
    if (!_ready || !_chatBin || _keyMissing) return;

    // Đọc history hiện tại
    const data = await _readBin(_chatBin) || { messages: [] };
    const messages = Array.isArray(data.messages) ? data.messages : [];

    messages.push({
      role,
      content: content.substring(0, 2000), // trim rất dài
      ts: Date.now(),
    });

    // Giữ 100 tin nhắn gần nhất
    if (messages.length > 100) messages.splice(0, messages.length - 100);

    await _writeBin(_chatBin, { _name: `ef_chat_${_username}`, messages });
  }

  /**
   * Lấy lịch sử chat gần nhất (mặc định 50 tin nhắn).
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  async function getChatHistory(limit = 50) {
    if (!_chatBin || _keyMissing) return [];
    const data = await _readBin(_chatBin);
    if (!data || !Array.isArray(data.messages)) return [];
    return data.messages.slice(-limit);
  }

  /**
   * Xóa toàn bộ lịch sử chat (khi user chuyển topic).
   */
  async function clearChatHistory() {
    if (!_chatBin || _keyMissing) return;
    await _writeBin(_chatBin, { _name: `ef_chat_${_username}`, messages: [] });
  }

  /**
   * Kiểm tra xem sync có được cấu hình chưa.
   */
  function isConfigured() {
    return !_keyMissing;
  }

  /**
   * Lấy thời gian sync lần cuối.
   */
  function lastSyncTime() {
    if (!_username) return null;
    return localStorage.getItem(`ef_cloud_last_sync_${_username}`);
  }

  // Expose public API
  return {
    init,
    push,
    pull,
    merge,
    saveChatMessage,
    getChatHistory,
    clearChatHistory,
    isConfigured,
    lastSyncTime,
  };
})();
