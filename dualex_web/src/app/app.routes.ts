import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProfesoresComponent } from './components/profesores/profesores.component';
import { AlumnosComponent } from './components/alumnos/alumnos.component';
import { EmpresasComponent } from './components/empresas/empresas.component';
import { ModulosComponent } from './components/modulos/modulos.component';
import { ActividadesComponent } from './components/actividades/actividades.component';
import { CiclosComponent } from './components/ciclos/ciclos.component';
import { CursosComponent } from './components/cursos/cursos.component';
import { TareasComponent } from './components/tareas/tareas.component';

import { authGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'profesores', component: ProfesoresComponent, canActivate: [authGuard], data: { roles: ['COORDINADOR'] } },
  { path: 'alumnos', component: AlumnosComponent, canActivate: [authGuard], data: { roles: ['COORDINADOR', 'PROFESOR'] } },
  { path: 'empresas', component: EmpresasComponent, canActivate: [authGuard], data: { roles: ['COORDINADOR'] } },
  { path: 'modulos', component: ModulosComponent, canActivate: [authGuard], data: { roles: ['COORDINADOR', 'PROFESOR'] } },
  { path: 'actividades', component: ActividadesComponent, canActivate: [authGuard], data: { roles: ['COORDINADOR', 'PROFESOR'] } },
  { path: 'ciclos', component: CiclosComponent, canActivate: [authGuard], data: { roles: ['COORDINADOR'] } },
  { path: 'cursos', component: CursosComponent, canActivate: [authGuard], data: { roles: ['COORDINADOR'] } },
  { path: 'tareas', component: TareasComponent, canActivate: [authGuard], data: { roles: ['PROFESOR', 'ALUMNO'] } },
  { path: '**', redirectTo: '' }
];

