import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModuloProfesorDTO } from '../dto/dualex.dto';
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

  obtenerModulosPorEmail(email: string): Observable<ModuloProfesorDTO[]> {
    return this.http.get<ModuloProfesorDTO[]>(`${this.API_URL}&m=listarProfesor&emailProfesor=${email}`);
  }

  /**
   * Recupera la lista de módulos en los que el profesor autenticado imparte clase.
   * El ID del profesor se deduce de la sesión activa en el backend.
   * 
   * @returns Un `Observable` con un array de `ModuloProfesorDTO`.
   */
  obtenerModulosDelProfesor(): Observable<ModuloProfesorDTO[]> {
    return this.http.get<ModuloProfesorDTO[]>(`${this.API_URL}&m=listarProfesor`);
  }
}
