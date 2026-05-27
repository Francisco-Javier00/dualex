import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.currentUserValue;

  if (currentUser) {
    // Si hay roles especificados en la ruta, verificar si el usuario tiene permiso
    const rolesRequeridos = route.data['roles'] as string[];

    if (rolesRequeridos && rolesRequeridos.length > 0) {
      if (!rolesRequeridos.includes(currentUser.rol)) {
        // Redirigir al inicio o mostrar alerta si no tiene permiso

        return router.parseUrl('/dashboard');
      }
    }

    // Si no requiere roles específicos, o si el rol coincide, permitir acceso
    return true;
  }

  // Si no hay sesión (no hay token/perfil), denegar acceso.
  // En un entorno real con SSO, aquí se redirigiría a la URL de login externo.

  window.location.href = 'https://05.daw.esvirgua.com/tfg-server/angular-tfg/dashboard-inicio';
  return false;
};
