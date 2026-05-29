import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { ProfesorDashboardService } from '../../services/profesor-dashboard.service';
import { AlertService } from '../../services/alert.service';
import { ModuloProfesor, PerfilUsuario } from '../../dto/dualex.dto';

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
  
  usuario: PerfilUsuario | null = null;
  modulos: ModuloProfesor[] = [];
  cargando = true;

  ngOnInit() {
    this.authService.perfilUsuario$.subscribe(perfil => {
      this.usuario = perfil;
      if (perfil && perfil.email) {
        this.cargarModulos(perfil.email);
      }
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
