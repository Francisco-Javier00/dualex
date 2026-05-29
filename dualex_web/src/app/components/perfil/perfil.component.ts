import { CommonModule, Location } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { AlertService } from '../../services/alert.service';
import { PerfilUsuarioDTO } from '../../dto/dualex.dto';

/**
 * Componente para visualizar y gestionar el perfil de usuario activo.
 * 
 * Muestra información personal, roles y otra configuración relacionada con la sesión actual.
 */
@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PerfilComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private location = inject(Location);
  private cdr = inject(ChangeDetectorRef);
  private suscripcion?: Subscription;

  perfil: PerfilUsuarioDTO | null = null;

  ngOnInit(): void {
    // El perfil se escucha como observable para mantener sincronizado el estado.
    this.suscripcion = this.authService.perfilUsuario$.subscribe(perfil => {
      this.perfil = perfil;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.suscripcion?.unsubscribe();
  }

  get iniciales(): string {
    if (!this.perfil) return 'D';
    return (this.perfil.nombre?.trim().charAt(0) ?? 'D').toUpperCase();
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

  cerrarSesion(): void {
    this.authService.cerrarSesion();
    this.alertService.informacion('Sesión cerrada', 'Has salido de la sesión local.');
    this.router.navigate(['/']);
  }

  irAtras(): void {
    this.location.back();
  }
}
