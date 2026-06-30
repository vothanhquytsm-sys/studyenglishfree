// ╔══════════════════════════════════════════════════════════════════════╗
// ║  EnglishFree — Cloud Sync Module (cloudsync.ts)                     ║
// ║  Backend: JSONBin.io (free tier, no user signup required)          ║
// ║  Stores per-user progress + chat history across devices/cache      ║
// ╚══════════════════════════════════════════════════════════════════════╝

const JSONBIN_MASTER_KEY = '$2a$10$fvbde7Fbo7IRLPtVTc2CSOaCDSyplRTbUax5g1/hFd4Yk3Zrwr9Ny';
const JSONBIN_BASE       = 'https://api.jsonbin.io/v3';
const JSONBIN_COLLECTION = '';

export interface ProgressData {
  wordsLearned: string[];
  testsPassed: number;
  listeningCompleted: string[];
  readingCompleted: string[];
  speakingCompleted: string[];
  writingCompleted: string[];
  reflexCompleted: string[];
  vocabProgress: Record<string, number>;
  dailyLog: Record<string, {
    words?: string[];
    listening?: string[];
    reading?: string[];
    reflex?: string[];
  }>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  ts: number;
}

class CloudSyncService {
  private username: string | null = null;
  private progressBin: string | null = null;
  private chatBin: string | null = null;
  private pushTimer: any = null;
  private ready = false;
  private keyMissing = JSONBIN_MASTER_KEY.includes('REPLACE_WITH') || JSONBIN_MASTER_KEY.length < 30;

  private get headers() {
    return {
      'Content-Type': 'application/json',
      'X-Master-Key': JSONBIN_MASTER_KEY,
      'X-Bin-Private': 'true',
    };
  }

  private binKey(type: 'progress' | 'chat') {
    return `ef_cloud_bin_${type}_${this.username}`;
  }

  private getLocalBinId(type: 'progress' | 'chat') {
    return localStorage.getItem(this.binKey(type));
  }

  private saveBinId(type: 'progress' | 'chat', id: string) {
    localStorage.setItem(this.binKey(type), id);
  }

  private async createBin(name: string, data: any): Promise<string | null> {
    if (this.keyMissing) return null;
    try {
      const res = await fetch(`${JSONBIN_BASE}/b`, {
        method: 'POST',
        headers: { ...this.headers, 'X-Bin-Name': name },
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

  private async readBin(id: string): Promise<any | null> {
    if (this.keyMissing || !id) return null;
    try {
      const res = await fetch(`${JSONBIN_BASE}/b/${id}/latest`, {
        headers: this.headers,
      });
      if (!res.ok) {
        if (res.status === 404) return null;
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

  private async writeBin(id: string, data: any): Promise<boolean> {
    if (this.keyMissing || !id) return false;
    try {
      const res = await fetch(`${JSONBIN_BASE}/b/${id}`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify(data),
      });
      return res.ok;
    } catch (e) {
      console.warn('[CloudSync] writeBin error', e);
      return false;
    }
  }

  private async findBinByName(name: string): Promise<string | null> {
    if (this.keyMissing) return null;
    try {
      const res = await fetch(`${JSONBIN_BASE}/b`, { headers: this.headers });
      if (!res.ok) return null;
      const json = await res.json();
      const match = (json.result || []).find((b: any) => b.snippetMeta?.name === name);
      return match?.snippetMeta?.id || null;
    } catch (e) {
      return null;
    }
  }

  private setStatus(state: 'ready' | 'syncing' | 'error' | 'offline', detail = '') {
    const el = document.getElementById('cloud-sync-badge');
    const map = {
      ready: { icon: '☁️', text: 'Đã lưu cloud', color: 'var(--success-color)' },
      syncing: { icon: '⏳', text: 'Đang lưu...', color: 'var(--primary-color)' },
      error: { icon: '⚠️', text: 'Lỗi lưu cloud', color: 'var(--danger-color)' },
      offline: { icon: '📴', text: 'Chưa cấu hình', color: 'var(--text-muted)' },
    };
    const s = map[state] || map.offline;
    if (el) {
      el.innerHTML = `${s.icon} <span style="font-size:0.72rem;">${detail || s.text}</span>`;
      el.style.color = s.color;
    }
    const el2 = document.getElementById('sync-status-text');
    if (el2) {
      el2.textContent = detail || s.text;
      el2.style.color = s.color;
    }
  }

  public merge(local: ProgressData, remote: ProgressData | null): ProgressData {
    if (!remote) return local;
    const merged = { ...local };

    const arrFields: (keyof ProgressData)[] = [
      'wordsLearned', 'listeningCompleted', 'readingCompleted',
      'speakingCompleted', 'writingCompleted', 'reflexCompleted',
    ];
    arrFields.forEach(k => {
      const localArr = (local[k] as string[]) || [];
      const remoteArr = (remote[k] as string[]) || [];
      (merged[k] as string[]) = Array.from(new Set([...localArr, ...remoteArr]));
    });

    merged.testsPassed = Math.max(local.testsPassed || 0, remote.testsPassed || 0);

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

    merged.dailyLog = {};
    const dates = new Set([
      ...Object.keys(local.dailyLog || {}),
      ...Object.keys(remote.dailyLog || {}),
    ]);
    dates.forEach(d => {
      const lL = (local.dailyLog || {})[d] || {};
      const rL = (remote.dailyLog || {})[d] || {};
      merged.dailyLog[d] = {
        words: Array.from(new Set([...(lL.words || []), ...(rL.words || [])])),
        listening: Array.from(new Set([...(lL.listening || []), ...(rL.listening || [])])),
        reading: Array.from(new Set([...(lL.reading || []), ...(rL.reading || [])])),
        reflex: Array.from(new Set([...(lL.reflex || []), ...(rL.reflex || [])])),
      };
    });

    return merged;
  }

  public async init(username: string): Promise<ProgressData | null> {
    this.username = username;
    this.ready = false;

    if (this.keyMissing) {
      this.setStatus('offline');
      return null;
    }

    this.setStatus('syncing', 'Kết nối cloud...');

    const progBinName = `ef_progress_${username}`;
    let progId = this.getLocalBinId('progress');

    if (!progId) {
      progId = await this.findBinByName(progBinName);
      if (progId) this.saveBinId('progress', progId);
    }

    let remoteProgress: ProgressData | null = null;
    if (progId) {
      remoteProgress = await this.readBin(progId);
      if (!remoteProgress) {
        localStorage.removeItem(this.binKey('progress'));
        progId = null;
      }
    }

    if (!progId) {
      progId = await this.createBin(progBinName, { _name: progBinName, _created: Date.now() });
      if (progId) this.saveBinId('progress', progId);
    }

    this.progressBin = progId;

    const chatBinName = `ef_chat_${username}`;
    let chatId = this.getLocalBinId('chat');

    if (!chatId) {
      chatId = await this.findBinByName(chatBinName);
      if (chatId) this.saveBinId('chat', chatId);
    }

    if (!chatId) {
      chatId = await this.createBin(chatBinName, { _name: chatBinName, messages: [] });
      if (chatId) this.saveBinId('chat', chatId);
    }

    this.chatBin = chatId;
    this.ready = true;

    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    this.setStatus('ready', `Đã lưu lúc ${timeStr}`);

    return remoteProgress;
  }

  public push(progress: ProgressData, force = false): Promise<boolean> | void {
    if (!this.ready || !this.progressBin || this.keyMissing) return;

    this.setStatus('syncing', 'Đang lưu...');

    clearTimeout(this.pushTimer);

    const saveFn = async () => {
      const ok = await this.writeBin(this.progressBin!, { ...progress, _user: this.username, _updated: Date.now() });
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      if (ok) {
        this.setStatus('ready', `Đã lưu lúc ${timeStr}`);
        localStorage.setItem(`ef_cloud_last_sync_${this.username}`, timeStr);
        return true;
      } else {
        this.setStatus('error');
        return false;
      }
    };

    if (force) {
      return saveFn();
    } else {
      this.pushTimer = setTimeout(saveFn, 3000);
    }
  }

  public async pull(): Promise<ProgressData | null> {
    if (!this.ready || !this.progressBin || this.keyMissing) return null;
    return this.readBin(this.progressBin);
  }

  public async saveChatMessage(role: 'user' | 'assistant', content: string) {
    if (!this.ready || !this.chatBin || this.keyMissing) return;

    const data = await this.readBin(this.chatBin) || { messages: [] };
    const messages: ChatMessage[] = Array.isArray(data.messages) ? data.messages : [];

    messages.push({
      role,
      content: content.substring(0, 2000),
      ts: Date.now(),
    });

    if (messages.length > 100) messages.splice(0, messages.length - 100);

    await this.writeBin(this.chatBin, { _name: `ef_chat_${this.username}`, messages });
  }

  public async getChatHistory(limit = 50): Promise<ChatMessage[]> {
    if (!this.chatBin || this.keyMissing) return [];
    const data = await this.readBin(this.chatBin);
    if (!data || !Array.isArray(data.messages)) return [];
    return data.messages.slice(-limit);
  }

  public async clearChatHistory() {
    if (!this.chatBin || this.keyMissing) return;
    await this.writeBin(this.chatBin, { _name: `ef_chat_${this.username}`, messages: [] });
  }

  public isConfigured() {
    return !this.keyMissing;
  }

  public lastSyncTime() {
    if (!this.username) return null;
    return localStorage.getItem(`ef_cloud_last_sync_${this.username}`);
  }
}

export const CloudSync = new CloudSyncService();
export default CloudSync;
