import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CategoriaDTO } from '../dto/dualex.dto';
import { AuthService } from '../auth/services/auth.service';

/**
 * Servicio encargado de gestionar y proveer las categorías de navegación del menú lateral
 * basándose en el rol del usuario autenticado (Coordinador, Profesor o Alumno).
 */
@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private authService = inject(AuthService);

  private categoriasCoordinador: CategoriaDTO[] = [
    { titulo: 'Profesores', icono: 'fa-solid fa-id-badge', imagen: '/assets/img/profesores.png', ruta: '/profesores' },
    { titulo: 'Alumnos', icono: 'fa-solid fa-user-graduate', imagen: '/assets/img/alumnos.png', ruta: '/alumnos' },
    { titulo: 'Empresas', icono: 'fa-solid fa-building', imagen: '/assets/img/empresas.png', ruta: '/empresas' },
    { titulo: 'Módulos', icono: 'fa-solid fa-book-bookmark', imagen: '/assets/img/modulos.png', ruta: '/modulos' },
    { titulo: 'Actividades', icono: 'fa-solid fa-calendar-days', colorIcono: 'text-primary', imagen: '/assets/img/actividades.png', ruta: '/actividades' },
    { titulo: 'Ciclos', icono: 'fa-solid fa-rotate', imagen: '/assets/img/ciclos.png', ruta: '/ciclos' },
  ];

  private categoriasProfesor: CategoriaDTO[] = [
    { titulo: 'Mis Clases', icono: 'fa-solid fa-chalkboard-user', imagen: '/assets/img/clases.png', ruta: '/modulos' },
    { titulo: 'Mis Alumnos', icono: 'fa-solid fa-users', imagen: '/assets/img/profesores.png', ruta: '/alumnos' },
    { titulo: 'Actividades', icono: 'fa-solid fa-calendar-days', colorIcono: 'text-primary', imagen: '/assets/img/actividades.png', ruta: '/actividades' },
    { titulo: 'Calificaciones', icono: 'fa-solid fa-award', imagen: '/assets/img/notas.png', ruta: '/tareas' }
  ];

  private categoriasAlumno: CategoriaDTO[] = [
    { titulo: 'Mi Cuaderno', icono: 'fa-solid fa-book-open', imagen: '/assets/img/clases.png', ruta: '/modulos' },
    { titulo: 'Mis Notas', icono: 'fa-solid fa-clipboard', imagen: '/assets/img/notas.png', ruta: '/tareas' },
    { titulo: 'Actividades', icono: 'fa-solid fa-calendar-days', colorIcono: 'text-primary', imagen: '/assets/img/actividades.png', ruta: '/actividades' },
    { titulo: 'Mi Empresa', icono: 'fa-solid fa-building', imagen: '/assets/img/empresas.png', ruta: '/empresas' }
  ];

  private sujetoCategorias = new BehaviorSubject<CategoriaDTO[]>(this.categoriasCoordinador);
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

  /**
   * Actualiza el `BehaviorSubject` de categorías en función del rol proporcionado.
   * 
   * @param rol Rol del usuario autenticado (e.g., 'COORDINADOR', 'PROFESOR', 'ALUMNO').
   */
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

  /**
   * Obtiene el valor actual síncrono de las categorías asignadas al usuario.
   * 
   * @returns Un array de objetos `CategoriaDTO` configurados para el menú.
   */
  obtenerCategorias(): CategoriaDTO[] {
    return this.sujetoCategorias.value;
  }
}
