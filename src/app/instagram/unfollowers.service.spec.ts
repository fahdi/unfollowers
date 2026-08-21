import { TestBed } from '@angular/core/testing';
import { strToU8, zipSync } from 'fflate';
import { SNAPSHOT_STORAGE_KEY, UnfollowersService } from './unfollowers.service';

const entry = (username: string) => ({
  string_list_data: [{ href: `https://www.instagram.com/${username}`, value: username }],
});

const exportZip = (followers: string[], following: string[]) =>
  zipSync({
    'connections/followers_and_following/followers_1.json': strToU8(
      JSON.stringify(followers.map(entry)),
    ),
    'connections/followers_and_following/following.json': strToU8(
      JSON.stringify({ relationships_following: following.map(entry) }),
    ),
  });

const zipBlob = (followers: string[], following: string[]) =>
  new Blob([exportZip(followers, following) as BlobPart], { type: 'application/zip' });

describe('UnfollowersService', () => {
  let service: UnfollowersService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(UnfollowersService);
  });

  it('starts with nothing loaded', () => {
    expect(service.status()).toBe('idle');
    expect(service.report()).toBeNull();
    expect(service.hasReport()).toBe(false);
  });

  it('turns an export archive into a report', async () => {
    await service.importArchive(zipBlob(['ada', 'grace'], ['ada', 'hopper']));

    expect(service.status()).toBe('ready');
    expect(service.report()?.notFollowingBack.map((a) => a.username)).toEqual(['hopper']);
    expect(service.report()?.notFollowedBack.map((a) => a.username)).toEqual(['grace']);
    expect(service.report()?.counts.mutuals).toBe(1);
  });

  it('reports no change on the very first import', async () => {
    await service.importArchive(zipBlob(['ada'], ['ada']));

    expect(service.change()).toEqual({ lost: [], gained: [] });
  });

  it('remembers the previous export, so the next one names who left', async () => {
    await service.importArchive(zipBlob(['ada', 'grace'], ['ada']));
    await service.importArchive(zipBlob(['ada', 'hopper'], ['ada']));

    expect(service.change()?.lost.map((a) => a.username)).toEqual(['grace']);
    expect(service.change()?.gained.map((a) => a.username)).toEqual(['hopper']);
  });

  it('explains a file that is not an export instead of throwing at the caller', async () => {
    await service.importArchive(new Blob(['definitely not a zip']));

    expect(service.status()).toBe('error');
    expect(service.error()).toMatch(/could not be read as a ZIP/i);
    expect(service.report()).toBeNull();
  });

  it('keeps the stored snapshot untouched when an import fails', async () => {
    await service.importArchive(zipBlob(['ada', 'grace'], ['ada']));
    await service.importArchive(new Blob(['junk']));
    await service.importArchive(zipBlob(['ada'], ['ada']));

    expect(service.change()?.lost.map((a) => a.username)).toEqual(['grace']);
  });

  it('accepts two pasted lists for people who would rather not export', () => {
    service.importPastedLists('ada\ngrace', '@ada\nhttps://www.instagram.com/hopper');

    expect(service.report()?.notFollowingBack.map((a) => a.username)).toEqual(['hopper']);
    expect(service.report()?.notFollowedBack.map((a) => a.username)).toEqual(['grace']);
  });

  it('refuses a paste with nothing in it', () => {
    service.importPastedLists('   ', '');

    expect(service.status()).toBe('error');
    expect(service.error()).toMatch(/paste/i);
  });

  it('makes room for another import without forgetting the stored history', async () => {
    await service.importArchive(zipBlob(['ada', 'grace'], ['ada']));

    service.reset();

    expect(service.report()).toBeNull();
    expect(service.status()).toBe('idle');

    await service.importArchive(zipBlob(['ada'], ['ada']));

    expect(service.change()?.lost.map((a) => a.username)).toEqual(['grace']);
  });

  it('forgets everything on request, stored snapshot included', async () => {
    await service.importArchive(zipBlob(['ada'], ['ada']));

    service.clear();

    expect(service.report()).toBeNull();
    expect(service.status()).toBe('idle');
    expect(localStorage.getItem(SNAPSHOT_STORAGE_KEY)).toBeNull();
  });

  it('survives a corrupted stored snapshot rather than refusing to start', async () => {
    localStorage.setItem(SNAPSHOT_STORAGE_KEY, '{ not json');

    await service.importArchive(zipBlob(['ada'], ['ada']));

    expect(service.status()).toBe('ready');
    expect(service.change()).toEqual({ lost: [], gained: [] });
  });
});
