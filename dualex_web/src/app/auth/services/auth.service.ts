import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { PerfilUsuario, JwtPayload } from '../../dto/dualex.dto';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly COOKIE_NAME = 'dualex_jwt'; // Nombre supuesto de la cookie
  private sujetoPerfilUsuario = new BehaviorSubject<PerfilUsuario | null>(null);
  
  perfilUsuario$ = this.sujetoPerfilUsuario.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.restaurarSesion();
  }

  public get currentUserValue(): PerfilUsuario | null {
    return this.sujetoPerfilUsuario.value;
  }

  /**
   * Restaura la sesión leyendo la cookie y decodificando el JWT.
   */
  public restaurarSesion(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const token = this.getCookieNativa(this.COOKIE_NAME);
    
    if (token) {
      const payload = this.decodificarJwt(token);
      if (payload) {
        // Mapear rol de Dualex a rol interno, ignorando el global
        const rolInterno = this.mapearRol(payload.roles?.dualex);
        
        const perfil: PerfilUsuario = {
          id: payload.id,
          nombre: payload.nombre,
          apellidos: payload.apellidos,
          email: payload.email,
          foto: payload.foto,
          rol: rolInterno
        };
        
        this.sujetoPerfilUsuario.next(perfil);
      } else {
        this.sujetoPerfilUsuario.next(null);
      }
    } else {
      this.sujetoPerfilUsuario.next(null);
    }
  }

  /**
   * Lee una cookie de forma nativa.
   */
  private getCookieNativa(nombre: string): string | null {
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
  private decodificarJwt(token: string): JwtPayload | null {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
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
   */
  private mapearRol(rolGlobal?: string): string {
    if (!rolGlobal) return 'ALUMNO'; // Fallback por defecto
    const rol = rolGlobal.trim().toUpperCase();
    if (['COORDINADOR', 'PROFESOR', 'ALUMNO'].includes(rol)) {
      return rol;
    }
    // Si hay otros mapeos necesarios, se pueden añadir aquí
    return 'ALUMNO';
  }

  /**
   * Método de utilidad para forzar un perfil (útil para pruebas locales).
   */
  public forzarPerfilPrueba(perfil: PerfilUsuario): void {
    this.sujetoPerfilUsuario.next(perfil);
  }
}
