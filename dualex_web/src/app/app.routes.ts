import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard] },
  { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard] },
  { path: 'mis-modulos', loadComponent: () => import('./components/mis-modulos/mis-modulos.component').then(m => m.MisModulosComponent), canActivate: [authGuard], data: { roles: ['COORDINADOR', 'PROFESOR'] } },
  { path: 'acerca-de', loadComponent: () => import('./components/about/about.component').then(m => m.AboutComponent) },
  { path: 'docs/:tipo', loadComponent: () => import('./components/docs-viewer/docs-viewer.component').then(m => m.DocsViewerComponent), canActivate: [authGuard], data: { roles: ['COORDINADOR', 'PROFESOR', 'ALUMNO'] } },
  { path: 'profesores', loadComponent: () => import('./components/profesores/profesores.component').then(m => m.ProfesoresComponent), canActivate: [authGuard], data: { roles: ['COORDINADOR'] } },
  { path: 'alumnos', loadComponent: () => import('./components/alumnos/alumnos.component').then(m => m.AlumnosComponent), canActivate: [authGuard], data: { roles: ['COORDINADOR', 'PROFESOR'] } },
  { path: 'empresas', loadComponent: () => import('./components/empresas/empresas.component').then(m => m.EmpresasComponent), canActivate: [authGuard], data: { roles: ['COORDINADOR', 'PROFESOR'] } },
  { path: 'modulos', loadComponent: () => import('./components/modulos/modulos.component').then(m => m.ModulosComponent), canActivate: [authGuard], data: { roles: ['COORDINADOR', 'PROFESOR'] } },
  { path: 'actividades', loadComponent: () => import('./components/actividades/actividades.component').then(m => m.ActividadesComponent), canActivate: [authGuard], data: { roles: ['COORDINADOR', 'PROFESOR'] } },
  { path: 'ciclos', loadComponent: () => import('./components/ciclos/ciclos.component').then(m => m.CiclosComponent), canActivate: [authGuard], data: { roles: ['COORDINADOR'] } },
  { path: 'tareas', loadComponent: () => import('./components/tareas/tareas.component').then(m => m.TareasComponent), canActivate: [authGuard], data: { roles: ['COORDINADOR', 'PROFESOR', 'ALUMNO'] } },
  { path: 'tareas/:alumnoId', loadComponent: () => import('./components/tareas/tareas.component').then(m => m.TareasComponent), canActivate: [authGuard], data: { roles: ['COORDINADOR', 'PROFESOR', 'ALUMNO'] } },
  { path: 'tareas-todos', loadComponent: () => import('./components/tareas-todos/tareas-todos.component').then(m => m.TareasTodosComponent), canActivate: [authGuard], data: { roles: ['COORDINADOR', 'PROFESOR'] } },
  { path: 'tarea/nueva', loadComponent: () => import('./components/tarea-form/tarea-form.component').then(m => m.TareaFormComponent), canActivate: [authGuard], data: { roles: ['COORDINADOR', 'PROFESOR', 'ALUMNO'] } },
  { path: 'tarea/:id', loadComponent: () => import('./components/tarea-form/tarea-form.component').then(m => m.TareaFormComponent), canActivate: [authGuard], data: { roles: ['COORDINADOR', 'PROFESOR', 'ALUMNO'] } },
  { path: 'perfil', loadComponent: () => import('./components/perfil/perfil.component').then(m => m.PerfilComponent), canActivate: [authGuard], data: { roles: ['COORDINADOR', 'PROFESOR', 'ALUMNO'] } },
  { path: '**', redirectTo: '' }
];

