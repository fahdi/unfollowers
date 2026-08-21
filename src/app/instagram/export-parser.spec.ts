import {
  parseRelationshipHtml,
  parseRelationshipJson,
  parseRelationshipSource,
  parseUsernameList,
} from './export-parser';

/**
 * The shapes below are taken from real Instagram data exports. The two that
 * matter most disagree with each other: `followers_1.json` is a bare array,
 * while `following.json` wraps the same entries in `relationships_following`.
 */
const followersFile = JSON.stringify([
  {
    title: '',
    media_list_data: [],
    string_list_data: [
      { href: 'https://www.instagram.com/ada', value: 'ada', timestamp: 1610000000 },
    ],
  },
  {
    title: '',
    media_list_data: [],
    string_list_data: [
      { href: 'https://www.instagram.com/grace', value: 'grace', timestamp: 1620000000 },
    ],
  },
]);

const followingFile = JSON.stringify({
  relationships_following: [
    {
      title: '',
      media_list_data: [],
      string_list_data: [
        { href: 'https://www.instagram.com/ada', value: 'ada', timestamp: 1610000000 },
      ],
    },
  ],
});

describe('parseRelationshipJson', () => {
  it('reads the bare array shape used by followers_1.json', () => {
    expect(parseRelationshipJson(followersFile)).toEqual([
      { username: 'ada', href: 'https://www.instagram.com/ada', timestamp: 1610000000 },
      { username: 'grace', href: 'https://www.instagram.com/grace', timestamp: 1620000000 },
    ]);
  });

  it('reads the wrapped shape used by following.json', () => {
    expect(parseRelationshipJson(followingFile)).toEqual([
      { username: 'ada', href: 'https://www.instagram.com/ada', timestamp: 1610000000 },
    ]);
  });

  it('reads any relationships_* key, so pending requests parse too', () => {
    const pending = JSON.stringify({
      relationships_follow_requests_sent: [
        { string_list_data: [{ href: 'https://www.instagram.com/hopper', value: 'hopper' }] },
      ],
    });

    expect(parseRelationshipJson(pending)).toEqual([
      { username: 'hopper', href: 'https://www.instagram.com/hopper' },
    ]);
  });

  it('falls back to the profile link when the value is blank', () => {
    const file = JSON.stringify([
      { string_list_data: [{ href: 'https://www.instagram.com/katherine/', value: '' }] },
    ]);

    expect(parseRelationshipJson(file)).toEqual([
      { username: 'katherine', href: 'https://www.instagram.com/katherine/' },
    ]);
  });

  it('lowercases usernames so comparisons are case-insensitive', () => {
    const file = JSON.stringify([{ string_list_data: [{ value: 'AdaLovelace' }] }]);

    expect(parseRelationshipJson(file)).toEqual([{ username: 'adalovelace' }]);
  });

  it('drops entries that carry no usable username', () => {
    const file = JSON.stringify([
      { string_list_data: [] },
      { string_list_data: [{ value: '   ' }] },
      {},
      null,
      { string_list_data: [{ value: 'ada' }] },
    ]);

    expect(parseRelationshipJson(file)).toEqual([{ username: 'ada' }]);
  });

  it('keeps the first entry when a username repeats', () => {
    const file = JSON.stringify([
      { string_list_data: [{ value: 'ada', timestamp: 1 }] },
      { string_list_data: [{ value: 'ada', timestamp: 2 }] },
    ]);

    expect(parseRelationshipJson(file)).toEqual([{ username: 'ada', timestamp: 1 }]);
  });

  it('explains itself when the file is not JSON', () => {
    expect(() => parseRelationshipJson('<html>nope</html>')).toThrowError(/not valid JSON/i);
  });

  it('explains itself when the JSON holds no relationship list', () => {
    expect(() => parseRelationshipJson('{"unrelated":true}')).toThrowError(
      /no follower or following list/i,
    );
  });
});

describe('parseUsernameList', () => {
  it('accepts a pasted list separated by newlines, commas or spaces', () => {
    expect(parseUsernameList('ada\ngrace, hopper katherine')).toEqual([
      { username: 'ada' },
      { username: 'grace' },
      { username: 'hopper' },
      { username: 'katherine' },
    ]);
  });

  it('strips @ prefixes and profile URLs', () => {
    expect(parseUsernameList('@ada\nhttps://www.instagram.com/grace/')).toEqual([
      { username: 'ada' },
      { username: 'grace' },
    ]);
  });

  it('ignores blank input', () => {
    expect(parseUsernameList('   \n  ')).toEqual([]);
  });
});

describe('parseRelationshipHtml', () => {
  it('reads usernames from the anchors of an HTML export', () => {
    const html = `<div><a href="https://www.instagram.com/ada">ada</a>
      <a href="https://www.instagram.com/grace">grace</a>
      <a href="https://help.instagram.com/support">help</a></div>`;

    expect(parseRelationshipHtml(html)).toEqual([
      { username: 'ada', href: 'https://www.instagram.com/ada' },
      { username: 'grace', href: 'https://www.instagram.com/grace' },
    ]);
  });
});

describe('parseRelationshipSource', () => {
  it('routes JSON, HTML and pasted text to the right reader', () => {
    expect(parseRelationshipSource(followingFile)).toEqual([
      { username: 'ada', href: 'https://www.instagram.com/ada', timestamp: 1610000000 },
    ]);
    expect(parseRelationshipSource('<a href="https://www.instagram.com/ada">ada</a>')).toEqual([
      { username: 'ada', href: 'https://www.instagram.com/ada' },
    ]);
    expect(parseRelationshipSource('ada, grace')).toEqual([
      { username: 'ada' },
      { username: 'grace' },
    ]);
  });
});
