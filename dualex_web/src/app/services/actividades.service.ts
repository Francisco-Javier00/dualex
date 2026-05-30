import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ActividadDTO } from '../dto/dualex.dto';

/**
 * Servicio de Angular para la gestión de Actividades conectando al backend PHP.
 */
@Injectable({
  providedIn: 'root'
})
export class ActividadesService {
  private http = inject(HttpClient);

  // URL del router central de la API PHP
  private readonly API_URL = `${environment.apiUrl}/index.php?c=Actividades`;

  /**
   * Obtiene la lista completa de todas las actividades registradas sin paginar.
   * Si se proporciona un idAlumno, filtra las actividades por el ciclo del alumno.
   * 
   * @param idAlumno (Opcional) ID del alumno para filtrar.
   * @returns Un `Observable` con un array de objetos `ActividadDTO`.
   */
  getActividades(idAlumno?: number): Observable<ActividadDTO[]> {
    let url = `${this.API_URL}&m=listar`;
    if (idAlumno) {
      url += `&idAlumno=${idAlumno}`;
    }
    return this.http.get<ActividadDTO[]>(url);
  }

  /**
   * Obtiene los datos detallados de una actividad específica por su ID.
   * 
   * @param id Identificador único de la actividad.
   * @returns Un `Observable` que emite el objeto `ActividadDTO` encontrado.
   */
  getActividadById(id: number): Observable<ActividadDTO> {
    return this.http.get<ActividadDTO>(`${this.API_URL}&m=obtener&id=${id}`);
  }

  /**
   * Procesa la solicitud de paginación, ordenación y filtrado conectando con el backend para DataTables.
   * 
   * @param dataTablesParameters Parámetros estándar de la librería DataTables.
   * @returns Un `Observable` con los datos estructurados para renderizar la tabla dinámica.
   */
  obtenerActividadesDataTables(dataTablesParameters: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}&m=obtenerDataTables`, dataTablesParameters);
  }

  /**
   * Envía una petición POST al servidor para registrar una nueva actividad.
   * 
   * @param actividad Objeto `ActividadDTO` con los datos de la actividad a registrar.
   * @returns Un `Observable` con el resultado de la creación.
   */
  createActividad(actividad: ActividadDTO): Observable<any> {
    return this.http.post<any>(`${this.API_URL}&m=crear`, actividad);
  }

  /**
   * Envía una petición PUT al servidor para actualizar los datos de una actividad existente.
   * 
   * @param actividad Objeto `ActividadDTO` con los datos actualizados y el ID correspondiente.
   * @returns Un `Observable` con la respuesta de la modificación.
   */
  updateActividad(actividad: ActividadDTO): Observable<any> {
    return this.http.put<any>(`${this.API_URL}&m=actualizar&id=${actividad.id}`, actividad);
  }

  /**
   * Elimina una actividad del sistema de forma permanente.
   * 
   * @param id Identificador único de la actividad a eliminar.
   * @returns Un `Observable` indicando el éxito de la operación.
   */
  deleteActividad(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}&m=eliminar&id=${id}`);
  }
}
