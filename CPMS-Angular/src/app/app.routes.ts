import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { CpmsService } from './cpms.service';
import { LoginComponent } from './login.component';
import { WorkspaceComponent } from './workspace.component';
const signedIn: CanActivateFn = async () => {
  const api = inject(CpmsService); const router = inject(Router);
  return (api.user() || await api.restore()) ? true : router.createUrlTree(['/login']);
};
export const routes: Routes = [
  {path: 'login', component: LoginComponent},
  {path: '', pathMatch: 'full', redirectTo: 'overview'},
  ...['overview','opportunities','applications','interviews','profile','companies','reports','notifications'].map(path => ({path, component: WorkspaceComponent, canActivate: [signedIn]})),
  {path: '**', redirectTo: 'overview'}
];
