import { strToU8, zipSync } from 'fflate';
import { readInstagramArchive } from './archive';

const entry = (username: string) => ({
  title: '',
  media_list_data: [],
  string_list_data: [
    { href: `https://www.instagram.com/${username}`, value: username, timestamp: 1610000000 },
  ],
});

const followersJson = (...names: string[]) => strToU8(JSON.stringify(names.map(entry)));
const followingJson = (...names: string[]) =>
  strToU8(JSON.stringify({ relationships_following: names.map(entry) }));

/** Builds a ZIP shaped like a real Instagram export download. */
const archive = (files: Record<string, Uint8Array>) => zipSync(files);

describe('readInstagramArchive', () => {
  it('reads followers and following from the paths Instagram uses', async () => {
    const zip = archive({
      'connections/followers_and_following/followers_1.json': followersJson('ada', 'grace'),
      'connections/followers_and_following/following.json': followingJson('ada', 'hopper'),
    });

    const contents = await readInstagramArchive(zip);

    expect(contents.followers.map((a) => a.username)).toEqual(['ada', 'grace']);
    expect(contents.following.map((a) => a.username)).toEqual(['ada', 'hopper']);
  });

  it('merges the split followers files a large account gets', async () => {
    const zip = archive({
      'connections/followers_and_following/followers_1.json': followersJson('ada'),
      'connections/followers_and_following/followers_2.json': followersJson('grace'),
      'connections/followers_and_following/followers_3.json': followersJson('hopper'),
      'connections/followers_and_following/following.json': followingJson('ada'),
    });

    const contents = await readInstagramArchive(zip);

    expect(contents.followers.map((a) => a.username)).toEqual(['ada', 'grace', 'hopper']);
  });

  it('reads the older layout where the file is simply followers.json', async () => {
    const zip = archive({
      'followers_and_following/followers.json': followersJson('ada'),
      'followers_and_following/following.json': followingJson('grace'),
    });

    const contents = await readInstagramArchive(zip);

    expect(contents.followers.map((a) => a.username)).toEqual(['ada']);
    expect(contents.following.map((a) => a.username)).toEqual(['grace']);
  });

  it('reads the HTML flavour of the export', async () => {
    const zip = archive({
      'connections/followers_and_following/followers_1.html': strToU8(
        '<a href="https://www.instagram.com/ada">ada</a>',
      ),
      'connections/followers_and_following/following.html': strToU8(
        '<a href="https://www.instagram.com/grace">grace</a>',
      ),
    });

    const contents = await readInstagramArchive(zip);

    expect(contents.followers.map((a) => a.username)).toEqual(['ada']);
    expect(contents.following.map((a) => a.username)).toEqual(['grace']);
  });

  it('ignores the rest of the archive, which is most of it', async () => {
    const zip = archive({
      'connections/followers_and_following/followers_1.json': followersJson('ada'),
      'connections/followers_and_following/following.json': followingJson('grace'),
      'connections/followers_and_following/pending_follow_requests.json': followingJson('zoe'),
      'connections/followers_and_following/recently_unfollowed_profiles.json':
        followingJson('mary'),
      'your_instagram_activity/likes/liked_posts.json': strToU8('{"noise":true}'),
      '__MACOSX/._followers_1.json': strToU8('junk'),
    });

    const contents = await readInstagramArchive(zip);

    expect(contents.followers.map((a) => a.username)).toEqual(['ada']);
    expect(contents.following.map((a) => a.username)).toEqual(['grace']);
  });

  it('drops duplicates when the split files overlap', async () => {
    const zip = archive({
      'connections/followers_and_following/followers_1.json': followersJson('ada', 'grace'),
      'connections/followers_and_following/followers_2.json': followersJson('grace', 'hopper'),
      'connections/followers_and_following/following.json': followingJson('ada'),
    });

    const contents = await readInstagramArchive(zip);

    expect(contents.followers.map((a) => a.username)).toEqual(['ada', 'grace', 'hopper']);
  });

  it('says what is missing when the archive holds no follower list', async () => {
    const zip = archive({ 'your_instagram_activity/likes/liked_posts.json': strToU8('{}') });

    await expect(readInstagramArchive(zip)).rejects.toThrowError(
      /no followers or following files/i,
    );
  });

  it('rejects a file that is not a ZIP at all', async () => {
    await expect(readInstagramArchive(strToU8('this is not a zip'))).rejects.toThrowError(
      /could not be read as a ZIP/i,
    );
  });
});
