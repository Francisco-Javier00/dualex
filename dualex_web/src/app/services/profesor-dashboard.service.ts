import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModuloProfesor } from '../dto/dualex.dto';
import { environment } from '../../environments/environment';

/**
 * Servicio especializado que provee datos resumidos para la vista del panel de control
 * del perfil Profesor (ej. sus módulos o clases asignadas).
 */
@Injectable({
  providedIn: 'root'
})
export class ProfesorDashboardService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/index.php?c=Modulos`;

  /**
   * Recupera la lista de módulos en los que el profesor autenticado imparte clase.
   * El ID del profesor se deduce de la sesión activa en el backend.
   * 
   * @returns Un `Observable` con un array de `ModuloProfesor`.
   */
  obtenerModulosDelProfesor(): Observable<ModuloProfesor[]> {
    return this.http.get<ModuloProfesor[]>(`${this.API_URL}&m=listarProfesor`);
  }
}
