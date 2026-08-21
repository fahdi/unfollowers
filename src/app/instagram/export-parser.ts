/** A single account named somewhere in an Instagram data export. */
export interface InstagramAccount {
  /** Lowercased handle, without the leading `@`. */
  readonly username: string;
  /** Profile link, when the export carried one. */
  readonly href?: string;
  /** Unix seconds for when the relationship formed, when the export carried one. */
  readonly timestamp?: number;
}

/** One `string_list_data` entry as Instagram writes it. */
interface StringListEntry {
  readonly value?: unknown;
  readonly href?: unknown;
  readonly timestamp?: unknown;
}

interface RelationshipEntry {
  readonly string_list_data?: unknown;
}

/**
 * Pulls the handle out of a profile link.
 *
 * Exports occasionally ship an empty `value` but a usable `href`, so this is
 * the difference between reading a file and rejecting it.
 */
function usernameFromHref(href: string): string {
  const path = href.replace(/^https?:\/\/[^/]+/i, '').split(/[?#]/, 1)[0];
  return path.split('/').filter(Boolean)[0] ?? '';
}

/** Normalises a handle so `@AdaLovelace` and `ada lovelace ` compare equal. */
function normaliseUsername(raw: string): string {
  return raw.trim().replace(/^@+/, '').trim().toLowerCase();
}

function accountFrom(entry: StringListEntry): InstagramAccount | null {
  const href = typeof entry.href === 'string' ? entry.href : undefined;
  const rawValue = typeof entry.value === 'string' ? entry.value : '';
  const username = normaliseUsername(rawValue) || normaliseUsername(usernameFromHref(href ?? ''));

  if (!username) {
    return null;
  }

  return {
    username,
    ...(href ? { href } : {}),
    ...(typeof entry.timestamp === 'number' ? { timestamp: entry.timestamp } : {}),
  };
}

/** Drops repeats, keeping the first sighting of each handle. */
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
 * Finds the relationship array inside a parsed export file.
 *
 * `followers_1.json` is a bare array while `following.json` wraps the very same
 * entries under `relationships_following`, and sibling files use their own
 * `relationships_*` keys. Accepting all three keeps every file in the archive
 * readable through one path.
 */
function relationshipEntries(parsed: unknown): RelationshipEntry[] | null {
  if (Array.isArray(parsed)) {
    return parsed as RelationshipEntry[];
  }

  if (parsed && typeof parsed === 'object') {
    for (const [key, value] of Object.entries(parsed)) {
      if (key.startsWith('relationships_') && Array.isArray(value)) {
        return value as RelationshipEntry[];
      }
    }
  }

  return null;
}

/** Reads one JSON file from a data export into accounts. */
export function parseRelationshipJson(text: string): InstagramAccount[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON. Export your data in JSON format, not HTML.');
  }

  const entries = relationshipEntries(parsed);
  if (!entries) {
    throw new Error('That file holds no follower or following list.');
  }

  const accounts = entries.flatMap((entry) => {
    const list = entry && Array.isArray(entry.string_list_data) ? entry.string_list_data : [];
    return list
      .map((item: unknown) => accountFrom((item ?? {}) as StringListEntry))
      .filter((account): account is InstagramAccount => account !== null);
  });

  return dedupe(accounts);
}

/** Reads a hand-pasted list of handles, one per line or comma separated. */
export function parseUsernameList(text: string): InstagramAccount[] {
  const accounts = text
    .split(/[\s,;]+/)
    .map((token): InstagramAccount | null => {
      const trimmed = token.trim();
      const username = /instagram\.com/i.test(trimmed)
        ? normaliseUsername(usernameFromHref(trimmed))
        : normaliseUsername(trimmed);
      return username ? { username } : null;
    })
    .filter((account): account is InstagramAccount => account !== null);

  return dedupe(accounts);
}

/** Reads the HTML flavour of the export, where each account is an anchor. */
export function parseRelationshipHtml(html: string): InstagramAccount[] {
  const anchors = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)];

  const accounts = anchors
    .map(([, href]): InstagramAccount | null => {
      if (!/^https?:\/\/(www\.)?instagram\.com\//i.test(href)) {
        return null;
      }
      const username = normaliseUsername(usernameFromHref(href));
      return username ? { username, href } : null;
    })
    .filter((account): account is InstagramAccount => account !== null);

  return dedupe(accounts);
}

/**
 * Reads whichever flavour of export the caller happens to have.
 *
 * Used by the paste box, where the person on the other side has no reason to
 * know which of the three formats sits on their clipboard.
 */
export function parseRelationshipSource(text: string): InstagramAccount[] {
  const trimmed = text.trim();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return parseRelationshipJson(trimmed);
  }

  if (trimmed.startsWith('<') || /<a\b/i.test(trimmed)) {
    return parseRelationshipHtml(trimmed);
  }

  return parseUsernameList(trimmed);
}
