import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { ProfesorDashboardService } from '../../services/profesor-dashboard.service';
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
  
  usuario: PerfilUsuarioDTO | null = null;
  modulos: ModuloProfesorDTO[] = [];
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

        this.cargando = false;
      }
    });
  }
}
