import { Injectable, Inject, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { PerfilUsuario, JwtPayload } from '../../dto/dualex.dto';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly COOKIE_NAME = 'auth_token';
  private http = inject(HttpClient);

  // La sesión se mantiene en memoria para que el header, el perfil y las vistas
  // compartan el mismo usuario sin depender de llamadas repetidas al backend.
  private sujetoPerfilUsuario = new BehaviorSubject<PerfilUsuario | null>(null);
  perfilUsuario$ = this.sujetoPerfilUsuario.asObservable();

  /**
   * Obtiene el valor actual del perfil de usuario sin necesidad de suscripción.
   */
  public get currentUserValue(): PerfilUsuario | null {
    return this.sujetoPerfilUsuario.value;
  }

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.restaurarSesion();
  }

  /**
   * Restaura la sesión leyendo la cookie y decodificando el JWT.
   */
  public restaurarSesion(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Si venimos redirigidos del login con un token en la URL, lo capturamos
    const params = new URLSearchParams(window.location.search);
    const tokenUrl = params.get('token');

    if (tokenUrl) {
      this.setCookieNativa(this.COOKIE_NAME, tokenUrl);
      // Limpiamos la URL para que no quede el token visible
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Leemos la cookie (ya sea la recién guardada o una anterior)
    let token = this.getCookieNativa(this.COOKIE_NAME);

    if (token) {
      const payload = this.decodificarJwt(token);
      
      if (payload && payload.data) {
        // Mapear rol de Dualex a rol interno
        const rolInterno = this.mapearRol(payload.data.roles);

        if (!rolInterno) {
          this.cerrarSesion();
          return;
        }

        const perfil: PerfilUsuario = {
          id: payload.data.id,
          nombre: payload.data.nombre,
          apellidos: payload.data.apellidos,
          email: payload.data.email,
          rol: rolInterno,
          esGeneral: payload.data.esGeneral ?? false
        };

        this.sujetoPerfilUsuario.next(perfil);

        // Cargar datos locales de la base de datos para corregir cualquier discrepancia
        this.cargarPerfilDesdeBD();
      } else {
        this.sujetoPerfilUsuario.next(null);
      }
    } else {
      this.sujetoPerfilUsuario.next(null);
    }
  }

  /**
   * Carga los datos del perfil desde la base de datos local y actualiza el observable.
   */
  public cargarPerfilDesdeBD(): void {
    const perfilActual = this.sujetoPerfilUsuario.value;
    if (!perfilActual) return;
    const controller = perfilActual.rol === 'ALUMNO' ? 'Alumnos' : 'Profesores';
    this.http.get<PerfilUsuario>(`${environment.apiUrl}/index.php?c=${controller}&m=obtenerPerfilLocal`).subscribe({
      next: (perfilLocal) => {

        const actual = this.sujetoPerfilUsuario.value;
        if (actual && perfilLocal) {
          this.sujetoPerfilUsuario.next({
            ...actual,
            nombre: perfilLocal.nombre,
            apellidos: perfilLocal.apellidos,
            email: perfilLocal.email,
            esGeneral: perfilLocal.esGeneral
          });
        }
      },
      error: (err) => {

      }
    });
  }

  /**
   * Lee una cookie de forma nativa.
   */
  public getCookieNativa(nombre: string): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    const valor = `; ${document.cookie}`;
    const partes = valor.split(`; ${nombre}=`);
    if (partes.length === 2) {
      return partes.pop()?.split(';').shift() || null;
    }
    return null;
  }

  /**
   * Decodifica la carga útil (payload) de un JWT.
   */
  public decodificarJwt(token: string): JwtPayload | null {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      return JSON.parse(jsonPayload) as JwtPayload;
    } catch (e) {

      return null;
    }
  }

  /**
   * Extrae el rol de Dualex del array de roles y lo convierte al rol interno.
   * Busca un rol que termine en '_DUALEX', le quita el sufijo y lo valida.
   */
  private mapearRol(roles?: string[]): string | null {
    if (!roles || !Array.isArray(roles)) return null;

    // Convertimos todos a mayúsculas para facilitar la comparación
    const rolesUpper = roles.map(r => r.toUpperCase());

    if (rolesUpper.includes('COORDINADOR_DUALEX')) {
      return 'COORDINADOR';
    }

    if (rolesUpper.includes('PROFESOR_DUALEX')) {
      return 'PROFESOR';
    }

    if (rolesUpper.includes('ALUMNO_DUALEX')) {
      return 'ALUMNO';
    }

    return null;
  }

  /**
   * Guarda si el coordinador es general en la sesión.
   */
  public setEsGeneral(valor: boolean): void {
    const actual = this.sujetoPerfilUsuario.value;
    if (actual) {
      this.sujetoPerfilUsuario.next({ ...actual, esGeneral: valor });
    }
  }

  /**
   * Método de utilidad para forzar un perfil (útil para pruebas locales o actualizaciones rápidas de UI).
   */
  public forzarPerfilPrueba(perfil: PerfilUsuario): void {
    this.sujetoPerfilUsuario.next(perfil);
  }

  /**
   * Método de utilidad para establecer una cookie.
   */
  public setCookieNativa(nombre: string, valor: string): void {
    if (isPlatformBrowser(this.platformId)) {
      document.cookie = `${nombre}=${valor}; path=/; max-age=86400; SameSite=Lax`;
    }
  }

  /**
   * Cierra la sesión local limpiando la cookie y el estado en memoria.
   */
  public cerrarSesion(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Borrar cookie estableciendo fecha de expiración pasada
      document.cookie = `${this.COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;

      // Intentar borrar también sin SameSite por si acaso
      document.cookie = `${this.COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;

      // Limpiar estado en memoria
      this.sujetoPerfilUsuario.next(null);

      // Redirección al login externo si no estamos en modo desarrollo
      if (!environment.developerMode) {
        window.location.href = 'https://05.daw.esvirgua.com/tfg-server/angular-tfg/dashboard-inicio';
      } else {
        window.location.href = '/';
      }
    }
  }
}
