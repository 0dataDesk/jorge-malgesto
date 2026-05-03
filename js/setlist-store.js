/* ============================================================
   setlist-store.js — Wrapper de IndexedDB para jorge-malgesto
   ============================================================ */

const DB_NAME    = 'jorge-malgesto-setlists';
const DB_VERSION = 1;

let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) { resolve(db); return; }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = e => {
      const database = e.target.result;

      if (!database.objectStoreNames.contains('songs')) {
        const songs = database.createObjectStore('songs', { keyPath: 'id' });
        songs.createIndex('projectTag', 'projectTag', { unique: false });
        songs.createIndex('updatedAt',  'updatedAt',  { unique: false });
      }

      if (!database.objectStoreNames.contains('setlists')) {
        const setlists = database.createObjectStore('setlists', { keyPath: 'id' });
        setlists.createIndex('projectTag', 'projectTag', { unique: false });
        setlists.createIndex('updatedAt',  'updatedAt',  { unique: false });
      }
    };

    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror   = e => reject(e.target.error);
  });
}

function tx(storeName, mode = 'readonly') {
  return db.transaction(storeName, mode).objectStore(storeName);
}

function all(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = e => reject(e.target.error);
  });
}

function get(store, id) {
  return new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror   = e => reject(e.target.error);
  });
}

function put(store, record) {
  return new Promise((resolve, reject) => {
    const req = store.put(record);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = e => reject(e.target.error);
  });
}

function del(store, id) {
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = e => reject(e.target.error);
  });
}

const SetlistStore = {

  async init() {
    await openDB();
  },

  /* ── Canciones ───────────────────────────────────────── */

  async getAllSongs({ projectTag } = {}) {
    await openDB();
    const songs = await all(tx('songs'));
    if (projectTag) return songs.filter(s => s.projectTag === projectTag);
    return songs.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async getSong(id) {
    await openDB();
    return get(tx('songs'), id);
  },

  async saveSong(song) {
    await openDB();
    const now = Date.now();
    const record = {
      ...song,
      updatedAt: now,
      createdAt: song.createdAt || now,
    };
    await put(tx('songs', 'readwrite'), record);
    return record;
  },

  async deleteSong(id) {
    await openDB();
    await del(tx('songs', 'readwrite'), id);
  },

  /* ── Setlists ────────────────────────────────────────── */

  async getAllSetlists() {
    await openDB();
    const lists = await all(tx('setlists'));
    return lists.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async getSetlist(id) {
    await openDB();
    return get(tx('setlists'), id);
  },

  async saveSetlist(setlist) {
    await openDB();
    const now = Date.now();
    const record = {
      ...setlist,
      updatedAt: now,
      createdAt: setlist.createdAt || now,
    };
    await put(tx('setlists', 'readwrite'), record);
    return record;
  },

  async deleteSetlist(id) {
    await openDB();
    await del(tx('setlists', 'readwrite'), id);
  },

  /* ── Import / Export ─────────────────────────────────── */

  async exportAll() {
    await openDB();
    const [songs, setlists] = await Promise.all([
      all(tx('songs')),
      all(tx('setlists')),
    ]);
    return { songs, setlists, exportedAt: Date.now(), version: DB_VERSION };
  },

  async importAll(data, { mode = 'merge' } = {}) {
    await openDB();

    if (!data || !Array.isArray(data.songs) || !Array.isArray(data.setlists)) {
      throw new Error('Formato de importación inválido.');
    }

    if (mode === 'replace') {
      const songStore    = tx('songs',    'readwrite');
      const setlistStore = tx('setlists', 'readwrite');
      await new Promise((res, rej) => {
        const r = songStore.clear();
        r.onsuccess = res; r.onerror = rej;
      });
      await new Promise((res, rej) => {
        const r = setlistStore.clear();
        r.onsuccess = res; r.onerror = rej;
      });
    }

    for (const song of data.songs) {
      await put(tx('songs', 'readwrite'), song);
    }
    for (const setlist of data.setlists) {
      await put(tx('setlists', 'readwrite'), setlist);
    }
  },
};

export default SetlistStore;
