import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { ProfesorDashboardService } from '../../services/profesor-dashboard.service';
import { ProfesoresService } from '../../services/profesores.service';
import { Categoria, ModuloProfesor, PerfilUsuario } from '../../dto/dualex.dto';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private servicioDashboard = inject(DashboardService);
  private profesorDashboardService = inject(ProfesorDashboardService);
  private profesoresService = inject(ProfesoresService);
  private router = inject(Router);

  usuario: PerfilUsuario | null = null;
  categorias$: Observable<Categoria[]> = this.servicioDashboard.categorias$;
  modulosProfesor: ModuloProfesor[] = [];
  cargandoModulos = false;
  ciclosCoordinados: string[] = [];

  private suscripcionUsuario!: Subscription;

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

  private cargarModulosProfesor(): void {
    this.cargandoModulos = true;
    this.profesorDashboardService.obtenerModulosDelProfesor().subscribe({
      next: (modulos) => {
        this.modulosProfesor = modulos;
        this.cargandoModulos = false;
      },
      error: (err) => {
        console.error('Error al cargar módulos:', err);
        this.cargandoModulos = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.suscripcionUsuario) {
      this.suscripcionUsuario.unsubscribe();
    }
  }
}
