import { InstagramAccount } from './export-parser';

/** The two lists every comparison starts from. */
export interface RelationshipLists {
  readonly followers: readonly InstagramAccount[];
  readonly following: readonly InstagramAccount[];
}

/** How many accounts landed in each bucket. */
export interface RelationshipCounts {
  readonly followers: number;
  readonly following: number;
  readonly notFollowingBack: number;
  readonly notFollowedBack: number;
  readonly mutuals: number;
}

/** The answer to "who unfollowed me", plus the context that makes it readable. */
export interface RelationshipReport {
  /** You follow them; they do not follow you. The headline list. */
  readonly notFollowingBack: InstagramAccount[];
  /** They follow you; you do not follow them back. */
  readonly notFollowedBack: InstagramAccount[];
  /** Following each other. */
  readonly mutuals: InstagramAccount[];
  readonly counts: RelationshipCounts;
}

function usernamesOf(accounts: readonly InstagramAccount[]): Set<string> {
  return new Set(accounts.map((account) => account.username));
}

/**
 * Sorts a pair of relationship lists into the three buckets people care about.
 *
 * Order is inherited from the export, which lists the newest relationship
 * first — the most recent follow is usually the one you are looking for.
 */
export function compareRelationships({
  followers,
  following,
}: RelationshipLists): RelationshipReport {
  const followerNames = usernamesOf(followers);
  const followingNames = usernamesOf(following);

  const notFollowingBack = following.filter((account) => !followerNames.has(account.username));
  const notFollowedBack = followers.filter((account) => !followingNames.has(account.username));
  // Taken from the follower side so the richer entry — the one carrying the
  // profile link — is the one shown.
  const mutuals = followers.filter((account) => followingNames.has(account.username));

  return {
    notFollowingBack,
    notFollowedBack,
    mutuals,
    counts: {
      followers: followers.length,
      following: following.length,
      notFollowingBack: notFollowingBack.length,
      notFollowedBack: notFollowedBack.length,
      mutuals: mutuals.length,
    },
  };
}

/** What changed between two follower lists captured at different times. */
export interface SnapshotChange {
  /** Followed you in the previous export and no longer do. */
  readonly lost: InstagramAccount[];
  /** New since the previous export. */
  readonly gained: InstagramAccount[];
}

/**
 * Compares two follower snapshots to find who actually left.
 *
 * A single export can only say who does not follow you back today; it cannot
 * say who used to. Keeping the previous export is what turns this from a
 * one-shot check into a tracker.
 */
export function compareFollowerSnapshots(
  previous: readonly InstagramAccount[] | null,
  current: readonly InstagramAccount[],
): SnapshotChange {
  if (!previous) {
    return { lost: [], gained: [] };
  }

  const previousNames = usernamesOf(previous);
  const currentNames = usernamesOf(current);

  return {
    lost: previous.filter((account) => !currentNames.has(account.username)),
    gained: current.filter((account) => !previousNames.has(account.username)),
  };
}
