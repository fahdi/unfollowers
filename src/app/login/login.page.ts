import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonList,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { AuthService } from '../auth/auth.service';

/** Shortest password we accept. Kept here so the template and tests agree. */
const MIN_PASSWORD_LENGTH = 8;

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IonButton,
    IonContent,
    IonHeader,
    IonInput,
    IonList,
    IonTitle,
    IonToolbar,
  ],
  templateUrl: './login.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = inject(FormBuilder).nonNullable.group({
    username: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]],
  });

  isInvalid(control: 'username' | 'password'): boolean {
    return this.form.controls[control].invalid;
  }

  usernameError(): string {
    return 'Enter your username.';
  }

  passwordError(): string {
    return `Passwords are at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // No credential exchange yet — see AuthService for why the transport is
    // still undecided. The session is established locally for now.
    this.auth.setSession({ username: this.form.getRawValue().username });
    void this.router.navigateByUrl('/tabs/home');
  }
}
