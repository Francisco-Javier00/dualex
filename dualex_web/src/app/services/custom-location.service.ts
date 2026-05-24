import { Injectable, Injector, inject } from '@angular/core';
import { Location, LocationStrategy } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';

/**
 * Servicio personalizado para la gestión del historial de navegación.
 * Extiende la clase base Location de Angular para implementar un mecanismo
 * propio de retroceso (back) que sea seguro frente a refrescos de página y
 * redirecciones complejas, asegurando que el usuario siempre regrese a una
 * ruta válida dentro de la aplicación.
 */
@Injectable({
  providedIn: 'root'
})
export class CustomLocation extends Location {
  // Pila para almacenar el historial de las rutas visitadas en la sesión actual
  private history: string[] = [];
  
  // Se inyecta el Injector para obtener el Router de forma diferida y evitar dependencias circulares
  private injector = inject(Injector);

  /**
   * Getter para obtener la instancia del Router desde el inyector.
   * Evita problemas de inicialización si se inyectara directamente en el constructor.
   */
  private get router(): Router {
    return this.injector.get(Router);
  }

  constructor(platformStrategy: LocationStrategy) {
    super(platformStrategy);

    // Se retrasa la suscripción mediante setTimeout para evitar problemas de dependencia circular
    // durante el proceso de arranque (bootstrapping) de la aplicación de Angular.
    setTimeout(() => {
      this.router.events.subscribe(event => {
        // Solo nos interesan los eventos en los que la navegación ha finalizado con éxito
        if (event instanceof NavigationEnd) {
          const url = event.urlAfterRedirects;
          
          // Evitamos añadir rutas duplicadas consecutivas al historial (ej. si se recarga la misma ruta)
          if (this.history.length === 0 || this.history[this.history.length - 1] !== url) {
            this.history.push(url);
          }
        }
      });
    });
  }

  /**
   * Sobrescribe el método back() original de la clase Location.
   * En lugar de usar la API del historial del navegador (window.history.back),
   * utiliza nuestro propio array `history` para saber exactamente cuál fue la
   * ruta anterior en el ciclo de vida de la aplicación de Angular.
   */
  override back(): void {
    if (this.history.length > 1) {
      this.history.pop(); // Extraemos y descartamos la ruta actual
      const prevUrl = this.history.pop(); // Obtenemos la ruta inmediatamente anterior
      
      if (prevUrl) {
        // Navegamos hacia la ruta anterior encontrada en nuestro historial
        this.router.navigateByUrl(prevUrl);
        return;
      }
    }

    // Comportamiento por defecto/respaldo:
    // Si no hay historial (ej. el usuario entró directamente a un enlace y luego le dio a "Volver"),
    // se le redirige a la raíz '/', la cual gestiona automáticamente la redirección según su rol.
    this.router.navigateByUrl('/');
  }
}
