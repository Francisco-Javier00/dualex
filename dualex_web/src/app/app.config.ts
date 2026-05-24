import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './auth/interceptors/auth.interceptor';
import { Location } from '@angular/common';
import { CustomLocation } from './services/custom-location.service';

// Parchear la API History a nivel global del navegador para mantener la URL siempre estática
if (typeof window !== 'undefined' && window.history) {
  const originalReplaceState = window.history.replaceState;
  
  // Forzar que la barra de direcciones sea siempre '/' desde el inicio
  originalReplaceState.call(window.history, null, '', '/');

  // Sobrescribir pushState y replaceState para que no hagan nada en adelante
  window.history.pushState = () => {};
  window.history.replaceState = () => {};
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })),

    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: Location, useClass: CustomLocation }
  ]
};

