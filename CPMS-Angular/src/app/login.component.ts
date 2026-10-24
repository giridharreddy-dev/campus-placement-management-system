import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CpmsService } from './cpms.service';
@Component({
  selector: 'cpms-login', standalone: true, imports: [ReactiveFormsModule],
  template: `
    <main class="login-layout">
      <section class="login-story"><a class="brand" href="/"><span class="brand-icon">C</span> CPMS <small>ANGULAR EDITION</small></a>
        <div><p class="eyebrow light">YOUR NEXT CHAPTER STARTS HERE</p><h1>From campus.<br>To possibility.</h1><p class="story-copy">One place for opportunities, applications and the people helping you take the next step.</p><div class="story-tags"><span>Discover your role</span><span>Track your progress</span><span>Make your move</span></div></div>
        <footer>Campus Placement Management System <span>FSD2 LAB · SAMPLE001</span></footer>
      </section>
      <section class="login-panel"><div class="login-box"><p class="eyebrow">WELCOME TO YOUR CAREER WORKSPACE</p><h2>Make your next move.</h2><p class="muted">Sign in to continue your placement journey.</p>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <label for="email">Email address</label><input id="email" type="email" formControlName="email" autocomplete="username" placeholder="you@campus.edu">
          <label for="password">Password</label><input id="password" type="password" formControlName="password" autocomplete="current-password" placeholder="Enter your password">
          @if (submitted && form.invalid) {<p class="field-error">Enter a valid email and your password.</p>}
          @if (api.error()) {<div class="alert error" role="alert">{{ api.error() }}</div>}
          <button class="primary full" type="submit" [disabled]="api.busy()">{{api.busy() ? 'Signing in…' : 'Sign in to CPMS →'}}</button>
        </form>
        <div class="sample-accounts"><p class="eyebrow">CLASSROOM ACCOUNTS</p><div class="role-pills"><button type="button" (click)="sample('student')">Student</button><button type="button" (click)="sample('recruiter')">Recruiter</button><button type="button" (click)="sample('admin')">Administrator</button></div><p>Choose a role to fill its local sample credentials.</p></div>
        <p class="stack-note">Built with Angular · Node.js · MySQL<br>Classroom data is stored in a separate Angular database.</p>
      </div></section>
    </main>`
})
export class LoginComponent {
  api = inject(CpmsService); private router = inject(Router); private fb = inject(FormBuilder);
  form = this.fb.nonNullable.group({email: ['', [Validators.required, Validators.email]], password: ['', Validators.required]});
  submitted = false;
  sample(role: string): void {this.form.setValue({email: `${role}@cpms.local`, password: 'CpmsDemo@2026'}); this.api.error.set('');}
  async submit(): Promise<void> {
    this.submitted = true;
    if (this.form.invalid) {this.form.markAllAsTouched(); return;}
    const {email,password} = this.form.getRawValue();
    if (await this.api.login(email,password)) await this.router.navigateByUrl('/overview');
  }
}
