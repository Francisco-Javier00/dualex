import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { filter, take } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';
import { ProfesorDashboardService } from '../../services/profesor-dashboard.service';
import { AlertService } from '../../services/alert.service';
import { ModuloProfesorDTO, PerfilUsuarioDTO } from '../../dto/dualex.dto';

/**
 * Componente para mostrar los módulos asignados al profesor en sesión ("Mis Módulos").
 * 
 * Permite a los docentes visualizar y acceder rápidamente a los módulos que imparten.
 */
@Component({
  selector: 'app-mis-modulos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mis-modulos.component.html'
})
export class MisModulosComponent implements OnInit {
  private authService = inject(AuthService);
  private profesorDashboardService = inject(ProfesorDashboardService);
  private alertService = inject(AlertService);
  
  usuario: PerfilUsuarioDTO | null = null;
  modulos: ModuloProfesorDTO[] = [];
  cargando = true;

  ngOnInit() {
    this.authService.perfilUsuario$.pipe(
      filter(perfil => !!perfil?.email),
      take(1)
    ).subscribe(perfil => {
      this.usuario = perfil;
      this.cargarModulos(perfil!.email);
    });
  }

  private cargarModulos(email: string) {
    this.profesorDashboardService.obtenerModulosPorEmail(email).subscribe({
      next: (modulos) => {
        this.modulos = modulos;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando módulos:', err);
        this.alertService.error('Error', 'No se pudieron cargar tus módulos: ' + (err.message || 'Error desconocido'));
        this.cargando = false;
      }
    });
  }
}
