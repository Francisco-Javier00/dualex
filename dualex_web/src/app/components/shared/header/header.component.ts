import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { PerfilUsuario } from '../../../dto/dualex.dto';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  private authService = inject(AuthService);

  usuario$: Observable<PerfilUsuario | null> = this.authService.perfilUsuario$;

  obtenerEnlacesNavegacion(rol: string) {
    const enlacesBase = [
      { ruta: '/proyectos', etiqueta: 'Proyectos' },
      { ruta: '/ajustes', etiqueta: 'Ajustes' }
    ];

    if (rol === 'ALUMNO') {
      return [{ ruta: '/tareas', etiqueta: 'Mis Tareas' }, ...enlacesBase];
    }

    return [{ ruta: '/dashboard', etiqueta: 'Dashboard' }, ...enlacesBase];
  }

}
