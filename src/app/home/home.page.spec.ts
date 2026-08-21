import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideIonicAngular } from '@ionic/angular';
import { strToU8, zipSync } from 'fflate';
import { UnfollowersService } from '../instagram/unfollowers.service';
import { HomePage } from './home.page';

const entry = (username: string) => ({
  string_list_data: [{ href: `https://www.instagram.com/${username}`, value: username }],
});

const zipBlob = (followers: string[], following: string[]) =>
  new Blob([
    zipSync({
      'connections/followers_and_following/followers_1.json': strToU8(
        JSON.stringify(followers.map(entry)),
      ),
      'connections/followers_and_following/following.json': strToU8(
        JSON.stringify({ relationships_following: following.map(entry) }),
      ),
    }) as BlobPart,
  ]);

describe('HomePage', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideIonicAngular()],
    }).compileComponents();
  });

  function createPage() {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    return fixture;
  }

  it('creates the page', () => {
    expect(createPage().componentInstance).toBeTruthy();
  });

  it('renders "Unfollowers" as its toolbar title', async () => {
    const fixture = createPage();
    await fixture.whenStable();

    const title = (fixture.nativeElement as HTMLElement).querySelector('ion-title');
    expect(title?.textContent?.trim()).toBe('Unfollowers');
  });

  it('shows nothing to review before an import', () => {
    const page = createPage().componentInstance;

    expect(page.hasReport()).toBe(false);
    expect(page.visibleAccounts()).toEqual([]);
  });

  it('lists the accounts who do not follow back once an export is read', async () => {
    const page = createPage().componentInstance;

    await page.importFile(zipBlob(['ada'], ['ada', 'hopper']));

    expect(page.hasReport()).toBe(true);
    expect(page.visibleAccounts().map((a) => a.username)).toEqual(['hopper']);
  });

  it('switches to the accounts you have not followed back', async () => {
    const page = createPage().componentInstance;
    await page.importFile(zipBlob(['ada', 'grace'], ['ada']));

    page.showView('notFollowedBack');

    expect(page.visibleAccounts().map((a) => a.username)).toEqual(['grace']);
  });

  it('switches to mutuals', async () => {
    const page = createPage().componentInstance;
    await page.importFile(zipBlob(['ada', 'grace'], ['ada']));

    page.showView('mutuals');

    expect(page.visibleAccounts().map((a) => a.username)).toEqual(['ada']);
  });

  it('filters the visible list as you search, ignoring case', async () => {
    const page = createPage().componentInstance;
    await page.importFile(zipBlob([], ['adalovelace', 'hopper']));

    page.search.set('ADA');

    expect(page.visibleAccounts().map((a) => a.username)).toEqual(['adalovelace']);
  });

  it('reports the count of whatever is on screen', async () => {
    const page = createPage().componentInstance;
    await page.importFile(zipBlob([], ['ada', 'hopper']));

    expect(page.visibleCount()).toBe(2);
    page.search.set('hop');
    expect(page.visibleCount()).toBe(1);
  });

  it('builds a CSV of the visible list', async () => {
    const page = createPage().componentInstance;
    await page.importFile(zipBlob(['ada'], ['ada', 'hopper']));

    expect(page.buildCsv()).toBe('username,profile_url\nhopper,https://www.instagram.com/hopper');
  });

  it('surfaces a readable message when the file is not an export', async () => {
    const page = createPage().componentInstance;

    await page.importFile(new Blob(['not a zip']));

    expect(page.error()).toMatch(/could not be read as a ZIP/i);
    expect(page.hasReport()).toBe(false);
  });

  it('reads two pasted lists instead of an archive', () => {
    const page = createPage().componentInstance;

    page.pastedFollowers.set('ada');
    page.pastedFollowing.set('ada, hopper');
    page.importPaste();

    expect(page.visibleAccounts().map((a) => a.username)).toEqual(['hopper']);
  });

  it('takes another export without losing track of who left', async () => {
    const page = createPage().componentInstance;
    await page.importFile(zipBlob(['ada', 'grace'], ['ada']));

    page.importAnother();
    expect(page.hasReport()).toBe(false);

    await page.importFile(zipBlob(['ada'], ['ada']));

    expect(page.lostFollowers().map((a) => a.username)).toEqual(['grace']);
  });

  it('forgets the stored history only when explicitly asked', async () => {
    const page = createPage().componentInstance;
    await page.importFile(zipBlob(['ada'], ['ada']));

    page.forgetEverything();

    expect(page.hasReport()).toBe(false);
    expect(TestBed.inject(UnfollowersService).status()).toBe('idle');
    expect(localStorage.getItem('unfollowers.follower-snapshot.v1')).toBeNull();
  });

  it('summarises who left in a single readable line', async () => {
    const page = createPage().componentInstance;
    await page.importFile(zipBlob(['ada', 'grace', 'joan'], ['ada']));
    await page.importFile(zipBlob(['ada'], ['ada']));

    expect(page.lostSummary()).toBe('@grace and 1 more');
  });

  it('names a single departure without an "and more"', async () => {
    const page = createPage().componentInstance;
    await page.importFile(zipBlob(['ada', 'grace'], ['ada']));
    await page.importFile(zipBlob(['ada'], ['ada']));

    expect(page.lostSummary()).toBe('@grace');
  });

  it('reads the file chosen through the picker, then clears the input', async () => {
    const page = createPage().componentInstance;
    const input = { files: [zipBlob(['ada'], ['ada', 'hopper'])], value: 'export.zip' };

    await page.onFileChosen({ target: input } as unknown as Event);

    expect(page.visibleAccounts().map((a) => a.username)).toEqual(['hopper']);
    // Cleared so choosing the same file again still fires a change event.
    expect(input.value).toBe('');
  });

  it('ignores a picker that came back with no file', async () => {
    const page = createPage().componentInstance;

    await page.onFileChosen({ target: { files: [], value: '' } } as unknown as Event);

    expect(page.hasReport()).toBe(false);
    expect(page.error()).toBeNull();
  });

  it('reads a file dropped onto the page', async () => {
    const page = createPage().componentInstance;
    const drop = {
      preventDefault: () => undefined,
      dataTransfer: { files: [zipBlob(['ada'], ['ada', 'hopper'])] },
    };
    page.onDragOver({ preventDefault: () => undefined } as unknown as DragEvent);

    await page.onDrop(drop as unknown as DragEvent);

    expect(page.visibleAccounts().map((a) => a.username)).toEqual(['hopper']);
    expect(page.isDraggingOver()).toBe(false);
  });

  it('highlights the drop zone while a file is over it', () => {
    const page = createPage().componentInstance;
    let defaultPrevented = false;
    const dragOver = { preventDefault: () => (defaultPrevented = true) };

    page.onDragOver(dragOver as unknown as DragEvent);

    expect(page.isDraggingOver()).toBe(true);
    // Without this the browser navigates to the file instead of handing it over.
    expect(defaultPrevented).toBe(true);

    page.onDragLeave();
    expect(page.isDraggingOver()).toBe(false);
  });

  it('folds the paste box away again', () => {
    const page = createPage().componentInstance;

    expect(page.pasteOpen()).toBe(false);
    page.togglePaste();
    expect(page.pasteOpen()).toBe(true);
    page.togglePaste();
    expect(page.pasteOpen()).toBe(false);
  });

  it('switches view from the segment control', async () => {
    const page = createPage().componentInstance;
    await page.importFile(zipBlob(['ada', 'grace'], ['ada']));

    page.onSegmentChange('notFollowedBack');

    expect(page.visibleAccounts().map((a) => a.username)).toEqual(['grace']);
  });

  it('builds a profile link for an account the export gave no link for', () => {
    const page = createPage().componentInstance;

    expect(page.profileUrl({ username: 'ada' })).toBe('https://www.instagram.com/ada');
    expect(page.profileUrl({ username: 'ada', href: 'https://example.com/ada' })).toBe(
      'https://example.com/ada',
    );
  });

  it('offers the CSV as a download named after the current view', async () => {
    const page = createPage().componentInstance;
    await page.importFile(zipBlob(['ada'], ['ada', 'hopper']));

    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    const clicked: { download: string; href: string }[] = [];
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push({ download: this.download, href: this.href });
    });
    URL.createObjectURL = () => 'blob:stub';
    URL.revokeObjectURL = () => undefined;

    try {
      page.downloadCsv();
    } finally {
      clickSpy.mockRestore();
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
    }

    expect(clicked).toEqual([{ download: 'notFollowingBack.csv', href: 'blob:stub' }]);
  });

  it('renders the tally, the segments and the results list', async () => {
    const fixture = createPage();
    await fixture.componentInstance.importFile(zipBlob(['ada', 'grace'], ['ada', 'hopper']));
    fixture.detectChanges();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect([...el.querySelectorAll('.stat dd')].map((d) => d.textContent?.trim())).toEqual([
      '2',
      '2',
      '1',
      '1',
    ]);
    expect([...el.querySelectorAll('ion-list ion-item')].map((i) => i.textContent?.trim())).toEqual(
      ['@hopper'],
    );
    expect(el.querySelector('.result-count')?.textContent?.trim()).toBe('1 accounts');
    expect(el.querySelector('.dropzone')).toBeNull();
  });

  it('renders the drop zone until something has been imported', () => {
    const el = createPage().nativeElement as HTMLElement;

    expect(el.querySelector('.dropzone')).not.toBeNull();
    expect(el.querySelector('.stats')).toBeNull();
  });

  it('renders the banner naming who unfollowed you', async () => {
    const fixture = createPage();
    await fixture.componentInstance.importFile(zipBlob(['ada', 'grace'], ['ada']));
    await fixture.componentInstance.importFile(zipBlob(['ada', 'zoe'], ['ada']));
    fixture.detectChanges();
    await fixture.whenStable();

    const banner = (fixture.nativeElement as HTMLElement).querySelector('.change');
    expect(banner?.textContent?.replace(/\s+/g, ' ')).toContain('1 unfollowed you');
    expect(banner?.textContent?.replace(/\s+/g, ' ')).toContain('@grace.');
    expect(banner?.textContent?.replace(/\s+/g, ' ')).toContain('1 new followers arrived');
  });

  it('renders the failure message where the drop zone was', async () => {
    const fixture = createPage();
    await fixture.componentInstance.importFile(new Blob(['not a zip']));
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.error')?.textContent).toMatch(/could not be read as a ZIP/i);
    expect(el.querySelector('.dropzone')).not.toBeNull();
  });

  it('renders the empty state when a filter matches nothing', async () => {
    const fixture = createPage();
    await fixture.componentInstance.importFile(zipBlob([], ['hopper']));
    fixture.componentInstance.search.set('nobody');
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.empty')).not.toBeNull();
    expect(el.querySelector('ion-list')).toBeNull();
  });

  it('renders the paste boxes only once asked for', async () => {
    const fixture = createPage();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('ion-textarea').length).toBe(0);

    fixture.componentInstance.togglePaste();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(el.querySelectorAll('ion-textarea').length).toBe(2);
  });

  it('names the followers lost since the previous import', async () => {
    const page = createPage().componentInstance;
    await page.importFile(zipBlob(['ada', 'grace'], ['ada']));

    await page.importFile(zipBlob(['ada'], ['ada']));

    expect(page.lostFollowers().map((a) => a.username)).toEqual(['grace']);
  });
});
