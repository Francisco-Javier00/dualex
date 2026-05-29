import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { ProfesorDashboardService } from '../../services/profesor-dashboard.service';
import { ProfesoresService } from '../../services/profesores.service';
import { CategoriaDTO, ModuloProfesorDTO, PerfilUsuarioDTO } from '../../dto/dualex.dto';
import { Observable, Subscription } from 'rxjs';

/**
 * Componente para el Panel de Control (Dashboard) principal de la aplicación.
 * 
 * Gestiona la visualización de módulos y categorías dependiendo del rol del usuario 
 * (PROFESOR, COORDINADOR o ALUMNO).
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private servicioDashboard = inject(DashboardService);
  private profesorDashboardService = inject(ProfesorDashboardService);
  private profesoresService = inject(ProfesoresService);
  private router = inject(Router);

  usuario: PerfilUsuarioDTO | null = null;
  categorias$: Observable<CategoriaDTO[]> = this.servicioDashboard.categorias$;
  modulosProfesor: ModuloProfesorDTO[] = [];
  cargandoModulos = false;
  ciclosCoordinados: string[] = [];

  private suscripcionUsuario!: Subscription;

  /**
   * Inicializa el componente y se suscribe al perfil del usuario actual para
   * redirigirlo si es alumno, o cargar sus módulos si es profesor/coordinador.
   */
  ngOnInit() {
    this.suscripcionUsuario = this.authService.perfilUsuario$.subscribe(perfil => {
      if (perfil) {
        if (perfil.rol === 'ALUMNO') {
          this.router.navigate(['/tareas']);
          return;
        }
        this.usuario = perfil;
        if (perfil.rol === 'PROFESOR') {
          this.cargarModulosProfesor();
        } else if ((perfil.rol === 'COORDINADOR' || perfil.rol === 'COORDINADOR_GENERAL') && perfil.email) {
          this.profesoresService.getProfesorByEmail(perfil.email).subscribe({
            next: (profesor) => {
              this.ciclosCoordinados = profesor.ciclos ? profesor.ciclos.split(',').map((c: string) => c.trim()).filter(Boolean).slice(0, 1) : [];
            },
            error: () => this.ciclosCoordinados = []
          });
        }
      }
    });
  }

  /**
   * Carga la lista de módulos asignados al profesor en sesión desde el backend.
   */
  private cargarModulosProfesor(): void {
    this.cargandoModulos = true;
    this.profesorDashboardService.obtenerModulosDelProfesor().subscribe({
      next: (modulos) => {
        this.modulosProfesor = modulos;
        this.cargandoModulos = false;
      },
      error: (err) => {

        this.cargandoModulos = false;
      }
    });
  }

  /**
   * Limpia las suscripciones al destruir el componente para evitar fugas de memoria.
   */
  ngOnDestroy() {
    if (this.suscripcionUsuario) {
      this.suscripcionUsuario.unsubscribe();
    }
  }
}
