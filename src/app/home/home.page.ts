import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  cloudUploadOutline,
  documentTextOutline,
  downloadOutline,
  openOutline,
  personRemoveOutline,
  refreshOutline,
  trashOutline,
} from 'ionicons/icons';
import { InstagramAccount } from '../instagram/export-parser';
import { UnfollowersService } from '../instagram/unfollowers.service';

/** Which of the three relationship buckets is on screen. */
export type AccountView = 'notFollowingBack' | 'notFollowedBack' | 'mutuals';

@Component({
  selector: 'app-home',
  imports: [
    IonButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonSpinner,
    IonTextarea,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly unfollowers = inject(UnfollowersService);

  readonly status = this.unfollowers.status;
  readonly report = this.unfollowers.report;
  readonly error = this.unfollowers.error;
  readonly hasReport = this.unfollowers.hasReport;
  readonly comparedAgainstDate = this.unfollowers.comparedAgainstDate;

  readonly view = signal<AccountView>('notFollowingBack');
  readonly search = signal('');
  readonly pastedFollowers = signal('');
  readonly pastedFollowing = signal('');
  /** The paste box stays folded away; the archive is the path most people take. */
  readonly pasteOpen = signal(false);
  readonly isDraggingOver = signal(false);

  readonly isBusy = computed(() => this.status() === 'reading');
  readonly counts = computed(() => this.report()?.counts ?? null);

  /** Followers present in the previous import and absent from this one. */
  readonly lostFollowers = computed(() => this.unfollowers.change()?.lost ?? []);
  readonly gainedFollowers = computed(() => this.unfollowers.change()?.gained ?? []);

  private readonly selectedAccounts = computed<readonly InstagramAccount[]>(() => {
    const report = this.report();
    return report ? report[this.view()] : [];
  });

  readonly visibleAccounts = computed(() => {
    const term = this.search().trim().toLowerCase();
    const accounts = this.selectedAccounts();
    return term ? accounts.filter((account) => account.username.includes(term)) : accounts;
  });

  readonly visibleCount = computed(() => this.visibleAccounts().length);

  /** One line naming who left, for the banner above the results. */
  readonly lostSummary = computed(() => {
    const lost = this.lostFollowers();
    if (lost.length === 0) {
      return '';
    }

    const first = `@${lost[0].username}`;
    return lost.length === 1 ? first : `${first} and ${lost.length - 1} more`;
  });

  constructor() {
    addIcons({
      cloudUploadOutline,
      documentTextOutline,
      downloadOutline,
      openOutline,
      personRemoveOutline,
      refreshOutline,
      trashOutline,
    });
  }

  /** Reads an export archive. Everything stays on the device. */
  async importFile(file: Blob): Promise<void> {
    await this.unfollowers.importArchive(file);
  }

  async onFileChosen(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      await this.importFile(file);
    }

    // Cleared so that picking the same file twice still fires a change event.
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingOver.set(true);
  }

  onDragLeave(): void {
    this.isDraggingOver.set(false);
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.isDraggingOver.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      await this.importFile(file);
    }
  }

  importPaste(): void {
    this.unfollowers.importPastedLists(this.pastedFollowers(), this.pastedFollowing());
  }

  togglePaste(): void {
    this.pasteOpen.update((open) => !open);
  }

  showView(view: AccountView): void {
    this.view.set(view);
  }

  onSegmentChange(value: unknown): void {
    this.showView(value as AccountView);
  }

  profileUrl(account: InstagramAccount): string {
    return account.href ?? `https://www.instagram.com/${account.username}`;
  }

  /** A CSV of exactly what is on screen, filters included. */
  buildCsv(): string {
    return [
      'username,profile_url',
      ...this.visibleAccounts().map((account) => `${account.username},${this.profileUrl(account)}`),
    ].join('\n');
  }

  downloadCsv(): void {
    const blob = new Blob([this.buildCsv()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${this.view()}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  /** Clears the screen for another export, keeping the tracked history. */
  importAnother(): void {
    this.unfollowers.reset();
    this.resetControls();
  }

  /** Wipes the report and the stored history alike. */
  forgetEverything(): void {
    this.unfollowers.clear();
    this.resetControls();
  }

  private resetControls(): void {
    this.search.set('');
    this.view.set('notFollowingBack');
    this.pastedFollowers.set('');
    this.pastedFollowing.set('');
    this.pasteOpen.set(false);
  }
}
