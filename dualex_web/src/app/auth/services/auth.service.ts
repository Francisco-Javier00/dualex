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
  private readonly COOKIE_NAME = 'dualex_jwt';
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

    let token = this.getCookieNativa(this.COOKIE_NAME);

    if (token) {
      console.log('AuthService: Token detectado, decodificando...', token);
      const payload = this.decodificarJwt(token);

      if (payload) {
        // Mapear rol de Dualex a rol interno
        const rolInterno = this.mapearRol(payload.roles?.dualex);

        if (!rolInterno) {
          console.error('AuthService: Rol inválido o inexistente en el token. Cerrando sesión.');
          this.cerrarSesion();
          return;
        }



        const perfil: PerfilUsuario = {
          id: payload.id,
          nombre: payload.nombre,
          apellidos: payload.apellidos,
          email: payload.email,
          rol: rolInterno,
          esGeneral: payload.esGeneral ?? false
        };
        console.log('AuthService: Emitiendo perfil:', perfil);
        this.sujetoPerfilUsuario.next(perfil);

        // Cargar datos locales de la base de datos para corregir cualquier discrepancia
        this.cargarPerfilDesdeBD();
      } else {
        console.error('AuthService: No se pudo decodificar el payload del token.');
        this.sujetoPerfilUsuario.next(null);
      }
    } else {
      console.log('AuthService: No hay sesión activa.');
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
        console.log('AuthService: Perfil local cargado desde la BD:', perfilLocal);
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
        console.error('AuthService: Error al cargar el perfil local desde la BD', err);
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
      console.error('Error decodificando JWT:', e);
      return null;
    }
  }

  /**
   * Convierte el rol que viene en el JWT al rol interno en mayúsculas usado por el sistema.
   * Si el rol no es válido, devuelve null.
   */
  private mapearRol(rolApp?: string): string | null {
    if (!rolApp) return null;
    const rol = rolApp.trim().toUpperCase();
    if (['COORDINADOR', 'PROFESOR', 'ALUMNO'].includes(rol)) {
      return rol;
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
      document.cookie = `${this.COOKIE_NAME}=; Max-Age=0; path=/; SameSite=Lax`;

      // Limpiar estado en memoria
      this.sujetoPerfilUsuario.next(null);

      // Redirección externa temporal
      window.location.href = 'https://www.google.es';
    }
  }
}
