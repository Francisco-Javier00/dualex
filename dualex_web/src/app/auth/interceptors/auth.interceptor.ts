import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Como usamos lectura nativa en AuthService, podemos exponer un método para obtener el token crudo
  // o simplemente leerlo de nuevo. Para simplificar, leemos la cookie directamente aquí.
  const getCookieNativa = (nombre: string): string | null => {
    if (typeof document === 'undefined') return null; // Prevenir errores en SSR
    const valor = `; ${document.cookie}`;
    const partes = valor.split(`; ${nombre}=`);
    if (partes.length === 2) {
      return partes.pop()?.split(';').shift() || null;
    }
    return null;
  };

  const token = getCookieNativa('dualex_jwt'); // Mismo nombre usado en AuthService

  if (token) {
    // Clonar la petición para añadir la cabecera de autorización
    const clonedReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(clonedReq);
  }

  // Si no hay token, enviar la petición original
  return next(req);
};
