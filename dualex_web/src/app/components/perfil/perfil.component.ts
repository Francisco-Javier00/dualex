import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { AlertService } from '../../services/alert.service';
import { PerfilUsuario } from '../../dto/dualex.dto';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private suscripcion?: Subscription;

  perfil: PerfilUsuario | null = null;
  modoEdicion = false;
  guardadoLocal = false;

  formulario = {
    nombre: '',
    apellidos: '',
    email: ''
  };

  ngOnInit(): void {
    // El perfil se escucha como observable para que el header y esta vista se mantengan sincronizados.
    this.suscripcion = this.authService.perfilUsuario$.subscribe(perfil => {
      this.perfil = perfil;
      if (perfil) {
        this.formulario = {
          nombre: perfil.nombre,
          apellidos: perfil.apellidos,
          email: perfil.email
        };
      }
    });
  }

  ngOnDestroy(): void {
    this.suscripcion?.unsubscribe();
  }

  get iniciales(): string {
    if (!this.perfil) return 'DU';
    const nombre = this.perfil.nombre?.trim().charAt(0) ?? 'D';
    const apellido = this.perfil.apellidos?.trim().charAt(0) ?? 'U';
    return `${nombre}${apellido}`.toUpperCase();
  }

  get rolEtiqueta(): string {
    return (this.perfil?.rol ?? 'ALUMNO').toLowerCase();
  }

  get colorPrincipal(): string {
    switch (this.perfil?.rol) {
      case 'COORDINADOR': return '#0b6ba8';
      case 'PROFESOR': return '#0f7a4f';
      default: return '#3b82f6';
    }
  }

  get rutaInicio(): string {
    return (this.perfil?.rol === 'ALUMNO') ? '/tareas' : '/dashboard';
  }

  activarEdicion(): void {
    if (!this.perfil) return;
    this.modoEdicion = true;
    this.guardadoLocal = false;
    this.formulario = {
      nombre: this.perfil.nombre,
      apellidos: this.perfil.apellidos,
      email: this.perfil.email
    };
  }

  cancelarEdicion(): void {
    if (!this.perfil) return;
    this.modoEdicion = false;
    this.formulario = {
      nombre: this.perfil.nombre,
      apellidos: this.perfil.apellidos,
      email: this.perfil.email
    };
  }

  guardarPerfil(): void {
    if (!this.perfil) return;

    const nombre = this.formulario.nombre.trim();
    const apellidos = this.formulario.apellidos.trim();
    const email = this.formulario.email.trim();

    if (!nombre || !apellidos || !email) {
      this.alertService.error('Datos incompletos', 'No puedes dejar ningún campo vacío.');
      return;
    }

    // El guardado es local: actualizamos el estado de sesión sin llamar aún a un backend.
    const actualizado: PerfilUsuario = {
      ...this.perfil,
      nombre,
      apellidos,
      email
    };

    this.authService.forzarPerfilPrueba(actualizado);
    this.modoEdicion = false;
    this.guardadoLocal = true;
    this.alertService.exito('Perfil actualizado', 'Tus cambios se han guardado en esta sesión.');
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
    this.alertService.informacion('Sesión cerrada', 'Has salido de la sesión local.');
    this.router.navigate(['/']);
  }
}
