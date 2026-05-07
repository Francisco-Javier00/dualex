import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { ProfesorDashboardMockService } from '../../services/profesor-dashboard-mock.service';
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
  private profesorDashboardService = inject(ProfesorDashboardMockService);
  private router = inject(Router);

  usuario: PerfilUsuario | null = null;
  categorias$: Observable<Categoria[]> = this.servicioDashboard.categorias$;
  modulosProfesor: ModuloProfesor[] = [];
  cargandoModulos = false;

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
        }
      }
    });
  }

  private cargarModulosProfesor(): void {
    this.cargandoModulos = true;
    this.profesorDashboardService.obtenerModulosDelProfesor().subscribe(modulos => {
      this.modulosProfesor = modulos;
      this.cargandoModulos = false;
    });
  }

  ngOnDestroy() {
    if (this.suscripcionUsuario) {
      this.suscripcionUsuario.unsubscribe();
    }
  }
}
