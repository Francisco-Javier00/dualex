import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Categoria } from '../dto/dualex.dto';
import { AuthService } from '../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private authService = inject(AuthService);

  private categoriasCoordinador: Categoria[] = [
    { titulo: 'Profesores', icono: 'fa-solid fa-id-badge', imagen: '/assets/img/profesores.png', ruta: '/profesores' },
    { titulo: 'Alumnos', icono: 'fa-solid fa-user-graduate', imagen: '/assets/img/alumnos.png', ruta: '/alumnos' },
    { titulo: 'Empresas', icono: 'fa-solid fa-building', imagen: '/assets/img/empresas.png', ruta: '/empresas' },
    { titulo: 'Módulos', icono: 'fa-solid fa-book-bookmark', imagen: '/assets/img/modulos.png', ruta: '/modulos' },
    { titulo: 'Actividades', icono: 'fa-solid fa-calendar-days', colorIcono: 'text-primary', imagen: '/assets/img/actividades.png', ruta: '/actividades' },
    { titulo: 'Ciclos', icono: 'fa-solid fa-rotate', imagen: '/assets/img/ciclos.png', ruta: '/ciclos' },
  ];

  private categoriasProfesor: Categoria[] = [
    { titulo: 'Mis Clases', icono: 'fa-solid fa-chalkboard-user', imagen: '/assets/img/clases.png', ruta: '/modulos' },
    { titulo: 'Mis Alumnos', icono: 'fa-solid fa-users', imagen: '/assets/img/profesores.png', ruta: '/alumnos' },
    { titulo: 'Actividades', icono: 'fa-solid fa-calendar-days', colorIcono: 'text-primary', imagen: '/assets/img/actividades.png', ruta: '/actividades' },
    { titulo: 'Calificaciones', icono: 'fa-solid fa-award', imagen: '/assets/img/notas.png', ruta: '/tareas' }
  ];

  private categoriasAlumno: Categoria[] = [
    { titulo: 'Mi Cuaderno', icono: 'fa-solid fa-book-open', imagen: '/assets/img/clases.png', ruta: '/modulos' },
    { titulo: 'Mis Notas', icono: 'fa-solid fa-clipboard', imagen: '/assets/img/notas.png', ruta: '/tareas' },
    { titulo: 'Actividades', icono: 'fa-solid fa-calendar-days', colorIcono: 'text-primary', imagen: '/assets/img/actividades.png', ruta: '/actividades' },
    { titulo: 'Mi Empresa', icono: 'fa-solid fa-building', imagen: '/assets/img/empresas.png', ruta: '/empresas' }
  ];

  private sujetoCategorias = new BehaviorSubject<Categoria[]>(this.categoriasCoordinador);
  categorias$ = this.sujetoCategorias.asObservable();

  constructor() {
    this.authService.perfilUsuario$.subscribe(usuario => {
      if (usuario) {
        this.actualizarCategoriasPorRol(usuario.rol);
      } else {
        this.sujetoCategorias.next([]);
      }
    });
  }

  private actualizarCategoriasPorRol(rol: string): void {
    switch (rol) {
      case 'COORDINADOR':
        this.sujetoCategorias.next(this.categoriasCoordinador);
        break;
      case 'PROFESOR':
        this.sujetoCategorias.next(this.categoriasProfesor);
        break;
      case 'ALUMNO':
        this.sujetoCategorias.next(this.categoriasAlumno);
        break;
      default:
        this.sujetoCategorias.next([]);
    }
  }

  obtenerCategorias(): Categoria[] {
    return this.sujetoCategorias.value;
  }
}
