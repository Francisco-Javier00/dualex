import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Tarea } from '../dto/dualex.dto';
import { ActividadesService } from './actividades.service';

/**
 * Servicio encargado de la gestión de Tareas de los alumnos conectando con el router index.php.
 */
@Injectable({
  providedIn: 'root'
})
export class TareasService {
  private http = inject(HttpClient);
  private actividadesService = inject(ActividadesService);

  // URL del router central de la API PHP
  private readonly API_URL = `${environment.apiUrl}/index.php?c=Tareas`;

  /**
   * Obtiene todas las tareas (vista de administrador/profesor).
   */
  getTareas(): Observable<Tarea[]> {
    return this.http.get<Tarea[]>(`${this.API_URL}&m=listar`);
  }

  /**
   * Filtra las tareas de un alumno concreto.
   */
  getTareasByAlumno(alumnoId: number): Observable<Tarea[]> {
    return this.http.get<Tarea[]>(`${this.API_URL}&m=listarPorAlumno&idAlumno=${alumnoId}`);
  }

  /**
   * Recupera una tarea específica por su ID.
   */
  getTareaById(id: number): Observable<Tarea> {
    return this.http.get<Tarea>(`${this.API_URL}&m=obtener&id=${id}`);
  }

  /**
   * Persiste una nueva tarea en el sistema.
   */
  createTarea(tarea: Tarea): Observable<Tarea> {
    return this.http.post<Tarea>(`${this.API_URL}&m=crear`, tarea);
  }

  /**
   * Actualiza una tarea existente.
   */
  updateTarea(tarea: Tarea): Observable<Tarea> {
    return this.http.put<Tarea>(`${this.API_URL}&m=actualizar&id=${tarea.id}`, tarea);
  }

  /**
   * Elimina una tarea del registro.
   */
  deleteTarea(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.API_URL}&m=eliminar&id=${id}`);
  }

  /**
   * Proxy para obtener el catálogo de actividades disponibles.
   */
  getActividades(): Observable<any[]> {
    return this.actividadesService.getActividades();
  }
}
