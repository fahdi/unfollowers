import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
  selector: 'app-about',
  imports: [IonContent, IonHeader, IonTitle, IonToolbar],
  templateUrl: './about.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPage {}
