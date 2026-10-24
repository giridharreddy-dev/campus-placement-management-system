import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Application, Candidate, Company, User, Workspace } from './models';

@Injectable({ providedIn: 'root' })
export class CpmsService {
  private http = inject(HttpClient);
  readonly user = signal<User | null>(null);
  readonly companies = signal<Company[]>([]);
  readonly applications = signal<Application[]>([]);
  readonly workspace = signal<Workspace>({ interviews: [], notices: [], profiles: [], driveDetails: {} });
  readonly busy = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly saved = signal<number[]>([]);
  readonly profile = computed(() => this.workspace().profiles.find(p => p.id === this.user()?.student_id));
  readonly drives = computed(() => this.companies().map(c => ({ ...c, ...this.workspace().driveDetails[c.id] })));
  readonly unread = computed(() => this.workspace().notices.filter(n => !n.read).length);
  private restoration?: Promise<boolean>;
  private revision = 0;

  request<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
    return firstValueFrom(this.http.request<T>(method, url, { body, withCredentials: true }));
  }
  restore(): Promise<boolean> {
    return this.restoration ??= (async () => {
      try {
        const result = await this.request<{user: User}>('/api/auth/me');
        this.user.set(result.user);
        this.readSaved();
        return true;
      } catch { return false; }
    })();
  }
  async login(email: string, password: string): Promise<boolean> {
    return this.perform(async () => {
      const result = await this.request<{user: User}>('/api/auth/login', 'POST', {email, password});
      this.user.set(result.user);
      this.restoration = Promise.resolve(true);
      this.readSaved();
    });
  }
  async logout(): Promise<boolean> {
    return this.perform(async () => {
      await this.request('/api/auth/logout', 'POST', {});
      this.revision++;
      this.user.set(null);
      this.applications.set([]);
      this.companies.set([]);
      this.workspace.set({ interviews: [], notices: [], profiles: [], driveDetails: {} });
      this.restoration = undefined;
      this.message.set('');
    });
  }
  async refresh(): Promise<void> {
    const user = this.user();
    if (!user) return;
    const version = ++this.revision;
    const applicationUrl = user.role === 'STUDENT' ? `/api/students/${user.student_id}/applications/details` : user.role === 'RECRUITER' ? '/api/recruiter/applications' : '/api/applications';
    this.loading.set(true);
    try {
      const [companies, applications, workspace] = await Promise.all([
        this.request<Company[]>('/api/companies'), this.request<Application[]>(applicationUrl), this.request<Workspace>('/api/workspace')
      ]);
      if (version !== this.revision) return;
      this.companies.set(companies);
      this.applications.set(applications);
      this.workspace.set(workspace);
      this.error.set('');
    } catch (e) { if (version === this.revision) this.error.set(this.describe(e)); }
    finally { if (version === this.revision) this.loading.set(false); }
  }
  async perform(action: () => Promise<void>, success = ''): Promise<boolean> {
    if (this.busy()) return false;
    this.busy.set(true); this.error.set(''); this.message.set('');
    try { await action(); this.message.set(success); return true; }
    catch (e) { this.error.set(this.describe(e)); return false; }
    finally { this.busy.set(false); }
  }
  mutate(url: string, method: string, body: unknown, message: string): Promise<boolean> {
    return this.perform(async () => { await this.request(url, method, body); await this.refresh(); }, message);
  }
  company(id: number): Company | undefined { return this.drives().find(c => Number(c.id) === Number(id)); }
  candidate(id: string): Candidate | undefined { return this.workspace().profiles.find(p => p.id === id); }
  applicationFor(id: number): Application | undefined { return this.applications().find(a => Number(a.company_id) === Number(id)); }
  private readSaved(): void {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(`cpms.angular.saved:${this.user()?.id}`) || '[]');
      this.saved.set(Array.isArray(value) ? value.filter((id): id is number => Number.isInteger(id)) : []);
    } catch { this.saved.set([]); }
  }
  toggleSaved(id: number): void {
    const next = this.saved().includes(id) ? this.saved().filter(x => x !== id) : [...this.saved(), id];
    try { localStorage.setItem(`cpms.angular.saved:${this.user()?.id}`, JSON.stringify(next)); this.saved.set(next); }
    catch { this.error.set('Your browser could not save this bookmark.'); }
  }
  private describe(e: unknown): string {
    if (e instanceof HttpErrorResponse) return e.error?.error || (e.status === 0 || e.status === 502 ? 'Cannot reach the Node.js API. Start npm run server on port 5100.' : `Request failed (${e.status}). Please sign in again if your session expired.`);
    return e instanceof Error ? e.message : 'The operation could not be completed.';
  }
}
