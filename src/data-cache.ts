export type BootstrapSnapshot = {
  version: 1;
  savedAt: number;
  data: {
    cards: unknown[];
    transactions: unknown[];
    apps: unknown[];
    dashboard: unknown;
    payments: unknown[];
    statements: unknown[];
    settings: { monthly_budget_minor: number | string; categories?: string[] };
  };
};

export type LocalEntity = 'transaction' | 'payment' | 'card' | 'upi-app' | 'setting';

export type LocalRecord<T = unknown> = {
  /** Authenticated account owner; prevents cross-account local data exposure. */
  ownerId: string;
  entity: LocalEntity;
  id: string;
  data: T;
  updatedAt: number;
  serverVersion?: string | number | null;
  syncState: 'pending' | 'syncing' | 'synced' | 'failed';
};

export type OutboxStatus = 'pending' | 'syncing' | 'failed';

export type OutboxOperation<T = unknown> = {
  /** Authenticated account owner; operations are only replayed for this account. */
  ownerId: string;
  /** Stable client-generated identifier; also intended as the server idempotency key. */
  opId: string;
  entity: LocalEntity;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  payload: T;
  status: OutboxStatus;
  createdAt: number;
  updatedAt: number;
  attempts: number;
  nextAttemptAt: number;
  dependencies: string[];
  lastError?: string;
};

export type SyncMetadata = {
  key: string;
  value: unknown;
  updatedAt: number;
};

const DB_NAME = 'card-ledger-private-cache';
const DB_VERSION = 2;
const SNAPSHOT_STORE = 'snapshots';
const RECORD_STORE = 'records';
const OUTBOX_STORE = 'outbox';
const META_STORE = 'sync_metadata';
const CACHE_KEY = 'authenticated-bootstrap-v1';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable in this browser.'));
      return;
    }
    // Version 2 adds durable local records and an outbox. Existing v1 snapshots
    // are retained by IndexedDB's version upgrade; no store is deleted.
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) db.createObjectStore(SNAPSHOT_STORE);
      if (!db.objectStoreNames.contains(RECORD_STORE)) {
        const records = db.createObjectStore(RECORD_STORE, { keyPath: ['ownerId', 'entity', 'id'] });
        records.createIndex('by-owner-entity', ['ownerId', 'entity'], { unique: false });
        records.createIndex('by-sync-state', 'syncState', { unique: false });
        records.createIndex('by-updated-at', 'updatedAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
        const outbox = db.createObjectStore(OUTBOX_STORE, { keyPath: 'opId' });
        outbox.createIndex('by-status', 'status', { unique: false });
        outbox.createIndex('by-created-at', 'createdAt', { unique: false });
        outbox.createIndex('by-entity-id', ['ownerId', 'entity', 'entityId'], { unique: false });
        outbox.createIndex('by-owner-status', ['ownerId', 'status'], { unique: false });
        outbox.createIndex('by-owner-created-at', ['ownerId', 'createdAt'], { unique: false });
      }
      if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE, { keyPath: 'key' });
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => reject(request.error || new Error('Could not open local cache.'));
    request.onblocked = () => reject(new Error('Local cache upgrade is blocked by another tab. Close other app tabs and retry.'));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed.'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction was aborted.'));
  });
}

function makeOperationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `op_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
}

export async function readBootstrapCache(): Promise<BootstrapSnapshot | null> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(SNAPSHOT_STORE, 'readonly');
    const value = await requestResult(tx.objectStore(SNAPSHOT_STORE).get(CACHE_KEY)) as BootstrapSnapshot | undefined;
    if (!value || value.version !== 1 || !value.data || !Array.isArray(value.data.transactions)) return null;
    if (!Number.isFinite(value.savedAt) || Date.now() - value.savedAt > MAX_AGE_MS) {
      await clearBootstrapCache();
      return null;
    }
    return value;
  } finally {
    db.close();
  }
}

export async function writeBootstrapCache(snapshot: BootstrapSnapshot): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(SNAPSHOT_STORE, 'readwrite');
    tx.objectStore(SNAPSHOT_STORE).put(snapshot, CACHE_KEY);
    await transactionDone(tx);
  } finally {
    db.close();
  }
}

/**
 * Clears only the authenticated bootstrap snapshot. The durable records and
 * outbox intentionally survive logout so pending financial changes can resume
 * after the same user signs in again.
 */
export async function clearBootstrapCache(): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(SNAPSHOT_STORE, 'readwrite');
    tx.objectStore(SNAPSHOT_STORE).delete(CACHE_KEY);
    await transactionDone(tx);
  } finally {
    db.close();
  }
}

export async function putLocalRecord<T>(record: LocalRecord<T>): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(RECORD_STORE, 'readwrite');
    tx.objectStore(RECORD_STORE).put(record);
    await transactionDone(tx);
  } finally {
    db.close();
  }
}

export async function getLocalRecord<T = unknown>(ownerId: string, entity: LocalEntity, id: string): Promise<LocalRecord<T> | null> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(RECORD_STORE, 'readonly');
    return (await requestResult(tx.objectStore(RECORD_STORE).get([ownerId, entity, id])) as LocalRecord<T> | undefined) ?? null;
  } finally {
    db.close();
  }
}

export async function listLocalRecords<T = unknown>(ownerId: string, entity?: LocalEntity): Promise<LocalRecord<T>[]> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(RECORD_STORE, 'readonly');
    const store = tx.objectStore(RECORD_STORE);
    const values = entity
      ? await requestResult(store.index('by-owner-entity').getAll([ownerId, entity]))
      : await requestResult(store.getAll());
    return (values as LocalRecord<T>[]).filter(record => record.ownerId === ownerId);
  } finally {
    db.close();
  }
}

export async function deleteLocalRecord(ownerId: string, entity: LocalEntity, id: string): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(RECORD_STORE, 'readwrite');
    tx.objectStore(RECORD_STORE).delete([ownerId, entity, id]);
    await transactionDone(tx);
  } finally {
    db.close();
  }
}

/** Atomically persists a local record and its corresponding outbox operation. */
export async function enqueueLocalMutation<T>(input: {
  ownerId: string;
  entity: LocalEntity;
  entityId: string;
  action: OutboxOperation<T>['action'];
  payload: T;
  record?: LocalRecord;
  dependencies?: string[];
}): Promise<OutboxOperation<T>> {
  if (!input.ownerId.trim()) throw new Error('An authenticated account owner is required to queue a local change.');
  if (input.record && input.record.ownerId !== input.ownerId) throw new Error('Local record owner does not match the queued operation.');
  const now = Date.now();
  const operation: OutboxOperation<T> = {
    ownerId: input.ownerId,
    opId: makeOperationId(),
    entity: input.entity,
    entityId: input.entityId,
    action: input.action,
    payload: input.payload,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    attempts: 0,
    nextAttemptAt: now,
    dependencies: input.dependencies ?? [],
  };
  const db = await openDatabase();
  try {
    const stores = input.record ? [RECORD_STORE, OUTBOX_STORE] : [OUTBOX_STORE];
    const tx = db.transaction(stores, 'readwrite');
    if (input.record) tx.objectStore(RECORD_STORE).put(input.record);
    tx.objectStore(OUTBOX_STORE).add(operation);
    await transactionDone(tx);
    return operation;
  } finally {
    db.close();
  }
}

export async function listOutboxOperations(ownerId: string, status?: OutboxStatus): Promise<OutboxOperation[]> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(OUTBOX_STORE, 'readonly');
    const store = tx.objectStore(OUTBOX_STORE);
    const values = status
      ? await requestResult(store.index('by-owner-status').getAll([ownerId, status]))
      : await requestResult(store.getAll());
    return (values as OutboxOperation[]).filter(operation => operation.ownerId === ownerId).sort((a, b) => a.createdAt - b.createdAt);
  } finally {
    db.close();
  }
}

export async function updateOutboxOperation(
  ownerId: string,
  opId: string,
  patch: Partial<Pick<OutboxOperation, 'status' | 'updatedAt' | 'attempts' | 'nextAttemptAt' | 'lastError'>>,
): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(OUTBOX_STORE, 'readwrite');
    const store = tx.objectStore(OUTBOX_STORE);
    const current = await requestResult(store.get(opId)) as OutboxOperation | undefined;
    if (!current || current.ownerId !== ownerId) throw new Error(`Outbox operation not found for this account: ${opId}`);
    store.put({ ...current, ...patch, updatedAt: patch.updatedAt ?? Date.now() });
    await transactionDone(tx);
  } finally {
    db.close();
  }
}

export async function removeOutboxOperation(ownerId: string, opId: string): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(OUTBOX_STORE, 'readwrite');
    const store = tx.objectStore(OUTBOX_STORE);
    const current = await requestResult(store.get(opId)) as OutboxOperation | undefined;
    if (current?.ownerId === ownerId) store.delete(opId);
    await transactionDone(tx);
  } finally {
    db.close();
  }
}

export async function getSyncMetadata<T = unknown>(key: string): Promise<T | null> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(META_STORE, 'readonly');
    const value = await requestResult(tx.objectStore(META_STORE).get(key)) as SyncMetadata | undefined;
    return value ? value.value as T : null;
  } finally {
    db.close();
  }
}

export async function setSyncMetadata(key: string, value: unknown): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(META_STORE, 'readwrite');
    tx.objectStore(META_STORE).put({ key, value, updatedAt: Date.now() } satisfies SyncMetadata);
    await transactionDone(tx);
  } finally {
    db.close();
  }
}

export async function getPendingOperationCount(ownerId: string): Promise<number> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(OUTBOX_STORE, 'readonly');
    return (await requestResult(tx.objectStore(OUTBOX_STORE).index('by-owner-created-at').count(IDBKeyRange.bound([ownerId, 0], [ownerId, Number.MAX_SAFE_INTEGER]))));
  } finally {
    db.close();
  }
}
