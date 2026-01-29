// ============================================
// IndexedDB 儲存層
// ============================================

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { MeetingSession, Suggestion } from '../types';

/** 資料庫 Schema */
interface MeetingAdvisorDB extends DBSchema {
  sessions: {
    key: string;
    value: MeetingSession;
    indexes: {
      'by-startTime': string;
      'by-mode': string;
    };
  };
  suggestions: {
    key: string;
    value: Suggestion & { sessionId: string };
    indexes: {
      'by-sessionId': string;
      'by-type': string;
      'by-timestamp': string;
    };
  };
}

const DB_NAME = 'meeting-advisor-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<MeetingAdvisorDB>> | null = null;

/**
 * 取得資料庫連線
 */
export async function getDB(): Promise<IDBPDatabase<MeetingAdvisorDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MeetingAdvisorDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionsStore = db.createObjectStore('sessions', {
            keyPath: 'id',
          });
          sessionsStore.createIndex('by-startTime', 'startTime');
          sessionsStore.createIndex('by-mode', 'mode');
        }

        // Suggestions store
        if (!db.objectStoreNames.contains('suggestions')) {
          const suggestionsStore = db.createObjectStore('suggestions', {
            keyPath: 'id',
          });
          suggestionsStore.createIndex('by-sessionId', 'sessionId');
          suggestionsStore.createIndex('by-type', 'type');
          suggestionsStore.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
}

// ============ Sessions 操作 ============

/**
 * 儲存 Session
 */
export async function saveSession(session: MeetingSession): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}

/**
 * 取得 Session
 */
export async function getSession(id: string): Promise<MeetingSession | undefined> {
  const db = await getDB();
  return db.get('sessions', id);
}

/**
 * 取得所有 Sessions
 */
export async function getAllSessions(): Promise<MeetingSession[]> {
  const db = await getDB();
  return db.getAllFromIndex('sessions', 'by-startTime');
}

/**
 * 取得最近的 Sessions
 */
export async function getRecentSessions(limit: number = 10): Promise<MeetingSession[]> {
  const db = await getDB();
  const tx = db.transaction('sessions', 'readonly');
  const index = tx.store.index('by-startTime');

  const sessions: MeetingSession[] = [];
  let cursor = await index.openCursor(null, 'prev');

  while (cursor && sessions.length < limit) {
    sessions.push(cursor.value);
    cursor = await cursor.continue();
  }

  return sessions;
}

/**
 * 刪除 Session
 */
export async function deleteSession(id: string): Promise<void> {
  const db = await getDB();

  // 刪除 session
  await db.delete('sessions', id);

  // 刪除相關的 suggestions
  const tx = db.transaction('suggestions', 'readwrite');
  const index = tx.store.index('by-sessionId');
  let cursor = await index.openCursor(IDBKeyRange.only(id));

  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
}

/**
 * 刪除過期的 Sessions
 */
export async function deleteExpiredSessions(retentionDays: number): Promise<number> {
  const db = await getDB();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  const cutoffISO = cutoffDate.toISOString();

  const tx = db.transaction(['sessions', 'suggestions'], 'readwrite');
  const sessionsStore = tx.objectStore('sessions');
  const suggestionsStore = tx.objectStore('suggestions');

  let deletedCount = 0;
  let cursor = await sessionsStore.index('by-startTime').openCursor();

  while (cursor) {
    if (cursor.value.startTime < cutoffISO) {
      const sessionId = cursor.value.id;

      // 刪除 suggestions
      const suggestionsCursor = await suggestionsStore
        .index('by-sessionId')
        .openCursor(IDBKeyRange.only(sessionId));

      while (suggestionsCursor) {
        await suggestionsCursor.delete();
        await suggestionsCursor.continue();
      }

      // 刪除 session
      await cursor.delete();
      deletedCount++;
    }
    cursor = await cursor.continue();
  }

  return deletedCount;
}

// ============ Suggestions 操作 ============

/**
 * 儲存 Suggestion
 */
export async function saveSuggestion(
  suggestion: Suggestion,
  sessionId: string
): Promise<void> {
  const db = await getDB();
  await db.put('suggestions', { ...suggestion, sessionId });
}

/**
 * 取得 Session 的所有 Suggestions
 */
export async function getSessionSuggestions(sessionId: string): Promise<Suggestion[]> {
  const db = await getDB();
  return db.getAllFromIndex('suggestions', 'by-sessionId', sessionId);
}

/**
 * 更新 Suggestion 回饋
 */
export async function updateSuggestionFeedback(
  id: string,
  feedback: 'helpful' | 'not_helpful'
): Promise<void> {
  const db = await getDB();
  const suggestion = await db.get('suggestions', id);
  if (suggestion) {
    await db.put('suggestions', { ...suggestion, feedback });
  }
}

// ============ 統計 ============

/**
 * 取得統計資料
 */
export async function getStats(): Promise<{
  totalSessions: number;
  totalSuggestions: number;
  helpfulRate: number;
}> {
  const db = await getDB();

  const sessions = await db.getAll('sessions');
  const suggestions = await db.getAll('suggestions');

  const helpfulCount = suggestions.filter((s) => s.feedback === 'helpful').length;
  const feedbackCount = suggestions.filter((s) => s.feedback).length;

  return {
    totalSessions: sessions.length,
    totalSuggestions: suggestions.length,
    helpfulRate: feedbackCount > 0 ? helpfulCount / feedbackCount : 0,
  };
}

// ============ 資料庫管理 ============

/**
 * 清除所有資料
 */
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await db.clear('sessions');
  await db.clear('suggestions');
}

/**
 * 匯出所有資料
 */
export async function exportAllData(): Promise<{
  sessions: MeetingSession[];
  suggestions: (Suggestion & { sessionId: string })[];
}> {
  const db = await getDB();
  return {
    sessions: await db.getAll('sessions'),
    suggestions: await db.getAll('suggestions'),
  };
}

/**
 * 匯入資料
 */
export async function importData(data: {
  sessions: MeetingSession[];
  suggestions: (Suggestion & { sessionId: string })[];
}): Promise<void> {
  const db = await getDB();

  const tx = db.transaction(['sessions', 'suggestions'], 'readwrite');

  for (const session of data.sessions) {
    await tx.objectStore('sessions').put(session);
  }

  for (const suggestion of data.suggestions) {
    await tx.objectStore('suggestions').put(suggestion);
  }

  await tx.done;
}
