import { InstagramAccount } from './export-parser';
import { compareFollowerSnapshots, compareRelationships } from './analysis';

const account = (username: string): InstagramAccount => ({ username });

describe('compareRelationships', () => {
  const followers = [account('ada'), account('grace'), account('katherine')];
  const following = [account('ada'), account('hopper')];

  it('names the accounts you follow who do not follow you back', () => {
    expect(compareRelationships({ followers, following }).notFollowingBack).toEqual([
      account('hopper'),
    ]);
  });

  it('names the accounts who follow you that you do not follow back', () => {
    expect(compareRelationships({ followers, following }).notFollowedBack).toEqual([
      account('grace'),
      account('katherine'),
    ]);
  });

  it('names the mutuals', () => {
    expect(compareRelationships({ followers, following }).mutuals).toEqual([account('ada')]);
  });

  it('counts each bucket', () => {
    expect(compareRelationships({ followers, following }).counts).toEqual({
      followers: 3,
      following: 2,
      notFollowingBack: 1,
      notFollowedBack: 2,
      mutuals: 1,
    });
  });

  it('keeps the order the export used, which is newest relationship first', () => {
    const report = compareRelationships({
      followers: [],
      following: [account('zoe'), account('ada'), account('mary')],
    });

    expect(report.notFollowingBack.map((a) => a.username)).toEqual(['zoe', 'ada', 'mary']);
  });

  it('reports the follower entry for mutuals, so profile links survive', () => {
    const report = compareRelationships({
      followers: [{ username: 'ada', href: 'https://www.instagram.com/ada' }],
      following: [account('ada')],
    });

    expect(report.mutuals).toEqual([{ username: 'ada', href: 'https://www.instagram.com/ada' }]);
  });

  it('handles an account with no relationships at all', () => {
    const report = compareRelationships({ followers: [], following: [] });

    expect(report.notFollowingBack).toEqual([]);
    expect(report.notFollowedBack).toEqual([]);
    expect(report.mutuals).toEqual([]);
    expect(report.counts.followers).toBe(0);
  });
});

describe('compareFollowerSnapshots', () => {
  it('names the followers who disappeared since the previous export', () => {
    const previous = [account('ada'), account('grace')];
    const current = [account('ada')];

    expect(compareFollowerSnapshots(previous, current).lost).toEqual([account('grace')]);
  });

  it('names the followers gained since the previous export', () => {
    const previous = [account('ada')];
    const current = [account('ada'), account('hopper')];

    expect(compareFollowerSnapshots(previous, current).gained).toEqual([account('hopper')]);
  });

  it('reports nothing changed when the two snapshots match', () => {
    const snapshot = [account('ada'), account('grace')];

    expect(compareFollowerSnapshots(snapshot, snapshot)).toEqual({ lost: [], gained: [] });
  });

  it('treats a missing previous snapshot as nothing to compare', () => {
    expect(compareFollowerSnapshots(null, [account('ada')])).toEqual({ lost: [], gained: [] });
  });
});
