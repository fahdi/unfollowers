import { strFromU8, unzip, Unzipped } from 'fflate';
import { InstagramAccount, parseRelationshipHtml, parseRelationshipJson } from './export-parser';

/** The two lists lifted out of an export download. */
export interface ArchiveContents {
  readonly followers: InstagramAccount[];
  readonly following: InstagramAccount[];
}

/**
 * Matches `followers.json`, `followers_1.json`, `followers_2.html` and friends.
 * Anchored at both ends so `pending_follow_requests.json` and
 * `recently_unfollowed_profiles.json` stay out of it.
 */
const FOLLOWERS_FILE = /^followers(?:[_-]?(\d+))?\.(json|html)$/i;
const FOLLOWING_FILE = /^following(?:[_-]?(\d+))?\.(json|html)$/i;

interface MatchedFile {
  readonly bytes: Uint8Array;
  readonly extension: string;
  readonly index: number;
}

function unzipAsync(data: Uint8Array): Promise<Unzipped> {
  return new Promise((resolve, reject) => {
    unzip(data, (error, unzipped) => {
      if (error) {
        reject(new Error('That file could not be read as a ZIP archive.'));
        return;
      }
      resolve(unzipped);
    });
  });
}

/** Archive noise that macOS adds when a folder is re-zipped by hand. */
function isJunk(path: string): boolean {
  const basename = path.split('/').pop() ?? '';
  return path.startsWith('__MACOSX/') || basename.startsWith('._');
}

/**
 * Collects every file in the archive matching one of the relationship names,
 * wherever it sits — the folder layout has changed across export versions and
 * the file names have not.
 */
function collect(unzipped: Unzipped, pattern: RegExp): MatchedFile[] {
  const matches: MatchedFile[] = [];

  for (const [path, bytes] of Object.entries(unzipped)) {
    if (isJunk(path)) {
      continue;
    }

    const match = pattern.exec(path.split('/').pop() ?? '');
    if (match) {
      matches.push({
        bytes,
        extension: match[2].toLowerCase(),
        // Unnumbered files sort first; the rest go in numeric order so that
        // followers_10 lands after followers_9 rather than after followers_1.
        index: match[1] ? Number(match[1]) : 0,
      });
    }
  }

  return matches.sort((a, b) => a.index - b.index);
}

function parse(file: MatchedFile): InstagramAccount[] {
  const text = strFromU8(file.bytes);
  return file.extension === 'html' ? parseRelationshipHtml(text) : parseRelationshipJson(text);
}

function dedupe(accounts: readonly InstagramAccount[]): InstagramAccount[] {
  const seen = new Set<string>();
  return accounts.filter((account) => {
    if (seen.has(account.username)) {
      return false;
    }
    seen.add(account.username);
    return true;
  });
}

/**
 * Reads an Instagram export download into follower and following lists.
 *
 * Everything happens in the browser: the archive is never uploaded anywhere,
 * which matters because the full download contains far more than these two
 * files.
 */
export async function readInstagramArchive(
  data: Uint8Array | ArrayBuffer,
): Promise<ArchiveContents> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const unzipped = await unzipAsync(bytes);

  const followerFiles = collect(unzipped, FOLLOWERS_FILE);
  const followingFiles = collect(unzipped, FOLLOWING_FILE);

  if (followerFiles.length === 0 && followingFiles.length === 0) {
    throw new Error(
      'That archive holds no followers or following files. Export again with the ' +
        '"Followers and following" section selected.',
    );
  }

  return {
    followers: dedupe(followerFiles.flatMap(parse)),
    following: dedupe(followingFiles.flatMap(parse)),
  };
}
