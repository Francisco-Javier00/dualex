import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  version = '1.0';
  fechaPublicacion = 'Junio 2026';

  irAInicio(): void {
    this.authService.perfilUsuario$.pipe(take(1)).subscribe(usuario => {
      if (usuario) {
        if (usuario.rol.toUpperCase() === 'ALUMNO') {
          this.router.navigate(['/tareas']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  equipo = {
    direccion: 'Isabel Muñoz Domínguez',
    programadores: [
      'Francisco Javier Martínez Fernández',
      'Santiago Pizarro Pizarro',
      'Juan Carlos Díaz del Castillo'
    ]
  };
}
