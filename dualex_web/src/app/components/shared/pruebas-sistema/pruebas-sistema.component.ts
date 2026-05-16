import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AlertService } from '../../../services/alert.service';
import { AuthService } from '../../../auth/services/auth.service';
import { environment } from '../../../../environments/environment';
import { Inject, PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-pruebas-sistema',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pruebas-sistema.component.html',
  styleUrls: ['./pruebas-sistema.component.css']
})
export class PruebasSistemaComponent implements OnInit {
  private servicioAlertas = inject(AlertService);
  private authService = inject(AuthService);
  private router = inject(Router);

  abierto = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit() {
    // Si no estamos en desarrollo, no hacemos nada
    if (environment.production || !isPlatformBrowser(this.platformId)) return;

    this.verificarYSincronizarSesionDev();
  }

  /**
   * Lógica de autogestión de sesión para desarrollo.
   * Si no hay sesión o hay un cambio forzado vía URL, genera el token.
   */
  private async verificarYSincronizarSesionDev() {
    const COOKIE_NAME = 'dualex_jwt';
    const token = this.authService.getCookieNativa(COOKIE_NAME);
    const urlParams = new URLSearchParams(window.location.search);
    const devRoleForce = urlParams.get('devRole');

    const payload = token ? this.authService.decodificarJwt(token) : null;
    const rolActual = payload ? payload.roles?.dualex : null;

    // Detectar si el token es antiguo, corrupto, inexistente o si hay un cambio forzado
    const tokenInvalido = !token || !payload || token.endsWith('.dev-signature-dualex') || token.includes('=');
    const cambioRolForzado = devRoleForce && devRoleForce.toUpperCase() !== rolActual?.toUpperCase();
    const esNombreAntiguo = payload && payload.nombre === 'Desarrollador';

    if (tokenInvalido || cambioRolForzado || esNombreAntiguo) {
      const rol = (devRoleForce || rolActual || 'COORDINADOR').toUpperCase();
      console.warn(`[Modo Dev] Sincronizando sesión para rol: ${rol}`);

      const nuevoToken = await this.generarTokenDevReal(rol);
      this.authService.setCookieNativa(COOKIE_NAME, nuevoToken);

      // Limpiar URL si venía con parámetro
      if (devRoleForce) {
        window.history.replaceState({}, '', window.location.pathname);
      }

      // Recargar para que el AuthService recoja el nuevo token
      window.location.reload();
    }
  }

  togglePanel() {
    this.abierto = !this.abierto;
  }

  async cambiarRolUsuario(rol: string) {
    const nuevoToken = await this.generarTokenDevReal(rol.toUpperCase());
    this.authService.setCookieNativa('dualex_jwt', nuevoToken);

    // Redirigir a la página de inicio del rol correspondiente
    // Usamos window.location.href para forzar la recarga total de la app con el nuevo token
    const targetUrl = (rol.toUpperCase() === 'ALUMNO') ? '/tareas' : '/dashboard';
    window.location.href = targetUrl;
  }

  /**
   * Generación de tokens JWT reales para desarrollo (HMAC-SHA256).
   */
  private async generarTokenDevReal(rol: string): Promise<string> {
    const toBase64Url = (str: string) => btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const toUtf8Binary = (str: string) => unescape(encodeURIComponent(str));

    let nombre = 'Juan Carlos';
    let apellidos = 'Díaz del Castillo';

    if (rol === 'PROFESOR') {
      nombre = 'Santiago';
      apellidos = 'Pizarro Pizarro';
    } else if (rol === 'ALUMNO') {
      nombre = 'Francisco Javier';
      apellidos = 'Martínez Fernández';
    }

    const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

    const payloadStr = JSON.stringify({
      id: 1,
      nombre,
      apellidos,
      email: `dev.${rol.toLowerCase()}@dualex.es`,
      foto: null,
      roles: { dualex: rol.toLowerCase() },
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
    });

    const payload = toBase64Url(toUtf8Binary(payloadStr));

    const secret = 'DEFAULT_SECRET_DUALEX_DEV';
    const signature = await this.firmarHmacSha256(`${header}.${payload}`, secret);

    return `${header}.${payload}.${signature}`;
  }

  private async firmarHmacSha256(mensaje: string, secreto: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(secreto),
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(mensaje));
    return btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  probarAlerta(tipo: 'success' | 'danger' | 'info') {
    switch (tipo) {
      case 'success': this.servicioAlertas.exito('Éxito', 'Operación completada correctamente'); break;
      case 'danger': this.servicioAlertas.error('Error', 'Ha ocurrido un error inesperado'); break;
      case 'info': this.servicioAlertas.informacion('Información', 'Este es un mensaje informativo'); break;
    }
  }
}
