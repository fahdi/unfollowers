import { InjectionToken, Injectable, computed, inject, signal } from '@angular/core';
import {
  RelationshipReport,
  SnapshotChange,
  compareFollowerSnapshots,
  compareRelationships,
} from './analysis';
import { readInstagramArchive } from './archive';
import { InstagramAccount, parseRelationshipSource } from './export-parser';

/** Where the previous follower list is kept between visits. */
export const SNAPSHOT_STORAGE_KEY = 'unfollowers.follower-snapshot.v1';

/**
 * Probes for a usable `localStorage`.
 *
 * Reaching for the global directly is not safe: private browsing throws on
 * write, server rendering has no storage at all, and Node 26 defines a global
 * `localStorage` that is `undefined` unless the process was started with
 * `--localstorage-file`. Returning `null` lets callers degrade quietly.
 */
function browserStorage(): Storage | null {
  try {
    const storage = globalThis.localStorage as Storage | undefined;
    if (!storage) {
      return null;
    }

    // A read-only or full store only reveals itself when written to.
    const probe = `${SNAPSHOT_STORAGE_KEY}.probe`;
    storage.setItem(probe, '1');
    storage.removeItem(probe);

    return storage;
  } catch {
    return null;
  }
}

/**
 * Where follower history is kept. Injected rather than reached for, so tests
 * and non-browser environments can supply their own or none at all.
 */
export const RELATIONSHIP_STORAGE = new InjectionToken<Storage | null>(
  'unfollowers.relationship-storage',
  { providedIn: 'root', factory: browserStorage },
);

/** Where an import has got to. */
export type ImportStatus = 'idle' | 'reading' | 'ready' | 'error';

interface StoredSnapshot {
  readonly capturedAt: string;
  readonly followers: readonly InstagramAccount[];
}

function readStoredSnapshot(storage: Storage | null): StoredSnapshot | null {
  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(SNAPSHOT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as StoredSnapshot).followers)
    ) {
      return parsed as StoredSnapshot;
    }
  } catch {
    // A snapshot we cannot read is worth exactly as much as no snapshot, and
    // it must never stop the import the person actually asked for.
  }

  return null;
}

function writeStoredSnapshot(
  storage: Storage | null,
  followers: readonly InstagramAccount[],
  capturedAt: string,
): void {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(
      SNAPSHOT_STORAGE_KEY,
      JSON.stringify({
        capturedAt,
        // Only the handle and link are kept — the rest of the export is read
        // and discarded.
        followers: followers.map(({ username, href }) => ({ username, href })),
      } satisfies StoredSnapshot),
    );
  } catch {
    // Private browsing and full quotas both land here. Losing history is a
    // smaller failure than losing the report.
  }
}

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : 'That file could not be read.';
}

/**
 * Owns the imported relationship data for the whole app.
 *
 * Every byte stays on the device: the archive is unzipped in the browser, and
 * the only thing written to storage is the follower handle list needed to spot
 * who leaves before the next export.
 */
@Injectable({ providedIn: 'root' })
export class UnfollowersService {
  private readonly storage = inject(RELATIONSHIP_STORAGE);

  private readonly currentStatus = signal<ImportStatus>('idle');
  private readonly currentReport = signal<RelationshipReport | null>(null);
  private readonly currentChange = signal<SnapshotChange | null>(null);
  private readonly currentError = signal<string | null>(null);
  private readonly comparedAgainst = signal<string | null>(null);

  readonly status = this.currentStatus.asReadonly();
  readonly report = this.currentReport.asReadonly();
  /** Who left and who arrived since the previous import, once there is one. */
  readonly change = this.currentChange.asReadonly();
  readonly error = this.currentError.asReadonly();
  /** When the export this report is compared against was imported. */
  readonly comparedAgainstDate = this.comparedAgainst.asReadonly();

  readonly hasReport = computed(() => this.currentReport() !== null);

  /** Reads an export download, unzipping it in the browser. */
  async importArchive(file: Blob): Promise<void> {
    this.currentStatus.set('reading');
    this.currentError.set(null);

    try {
      const contents = await readInstagramArchive(await file.arrayBuffer());
      this.publish(contents.followers, contents.following);
    } catch (error) {
      this.fail(messageFor(error));
    }
  }

  /** Reads two hand-pasted lists, for anyone unwilling to wait for an export. */
  importPastedLists(followersText: string, followingText: string): void {
    this.currentStatus.set('reading');
    this.currentError.set(null);

    try {
      const followers = parseRelationshipSource(followersText);
      const following = parseRelationshipSource(followingText);

      if (followers.length === 0 && following.length === 0) {
        throw new Error('Paste at least one of the two lists.');
      }

      this.publish(followers, following);
    } catch (error) {
      this.fail(messageFor(error));
    }
  }

  /**
   * Clears the current report so another export can be read, keeping the
   * stored snapshot — that history is the whole point of importing again.
   */
  reset(): void {
    this.currentReport.set(null);
    this.currentChange.set(null);
    this.currentError.set(null);
    this.comparedAgainst.set(null);
    this.currentStatus.set('idle');
  }

  /** Drops the report and the stored history. */
  clear(): void {
    this.reset();

    try {
      this.storage?.removeItem(SNAPSHOT_STORAGE_KEY);
    } catch {
      // Nothing to do; the in-memory state is already cleared.
    }
  }

  private publish(
    followers: readonly InstagramAccount[],
    following: readonly InstagramAccount[],
  ): void {
    const previous = readStoredSnapshot(this.storage);

    this.currentReport.set(compareRelationships({ followers, following }));
    this.currentChange.set(compareFollowerSnapshots(previous?.followers ?? null, followers));
    this.comparedAgainst.set(previous?.capturedAt ?? null);
    this.currentStatus.set('ready');

    writeStoredSnapshot(this.storage, followers, new Date().toISOString());
  }

  private fail(message: string): void {
    this.currentReport.set(null);
    this.currentChange.set(null);
    this.currentError.set(message);
    this.currentStatus.set('error');
  }
}
