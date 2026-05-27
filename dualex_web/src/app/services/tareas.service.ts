import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Tarea } from '../dto/dualex.dto';
import { ActividadesService } from './actividades.service';

/**
 * Servicio de control de Tareas y Calificaciones de los alumnos.
 * Facilita el enlace bidireccional entre la vista de Angular y el API PHP de Tareas.
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
   * Obtiene la lista maestra de todas las tareas (privilegio de Administrador/Profesor).
   * 
   * @returns Un `Observable` con un array completo de objetos `Tarea`.
   */
  getTareas(): Observable<Tarea[]> {
    return this.http.get<Tarea[]>(`${this.API_URL}&m=listar`);
  }

  /**
   * Obtiene exclusivamente el historial de tareas asignadas/creadas por un alumno en concreto.
   * 
   * @param alumnoId El ID numérico del estudiante.
   * @returns Un `Observable` con el array filtrado de tareas de ese alumno.
   */
  getTareasByAlumno(alumnoId: number): Observable<Tarea[]> {
    return this.http.get<Tarea[]>(`${this.API_URL}&m=listarPorAlumno&idAlumno=${alumnoId}`);
  }

  /**
   * Recupera los detalles exactos de una tarea individual mediante su clave primaria.
   * 
   * @param id Identificador de la tarea a visualizar.
   * @returns Un `Observable` emitiendo la información de la `Tarea`.
   */
  getTareaById(id: number): Observable<Tarea> {
    return this.http.get<Tarea>(`${this.API_URL}&m=obtener&id=${id}`);
  }

  /**
   * Persiste una nueva tarea o entrega en el sistema.
   * 
   * @param tarea Objeto estructurado de la tarea.
   * @returns Un `Observable` confirmando la creación desde el backend.
   */
  createTarea(tarea: Tarea): Observable<Tarea> {
    return this.http.post<Tarea>(`${this.API_URL}&m=crear`, tarea);
  }

  /**
   * Modifica los datos de una tarea o calificación existente.
   * 
   * @param tarea El objeto `Tarea` que incluye el ID y los campos actualizados.
   * @returns Un `Observable` con la respuesta del servidor.
   */
  updateTarea(tarea: Tarea): Observable<Tarea> {
    return this.http.put<Tarea>(`${this.API_URL}&m=actualizar&id=${tarea.id}`, tarea);
  }

  /**
   * Elimina un registro de tarea de forma definitiva.
   * 
   * @param id ID de la tarea que va a ser destruida.
   * @returns Un `Observable` con estado booleano de éxito de la operación.
   */
  deleteTarea(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.API_URL}&m=eliminar&id=${id}`);
  }

  /**
   * Sube un documento PDF asociado a una tarea.
   * 
   * @param idTarea ID de la tarea.
   * @param archivo Archivo PDF a subir.
   * @returns Observable con la respuesta del servidor.
   */
  subirDocumento(idTarea: number, archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('documento', archivo);
    return this.http.post(`${environment.apiUrl}/index.php?c=Tareas&m=subirDocumento&id=${idTarea}`, formData);
  }

  /**
   * Devuelve la URL pública para visualizar el PDF asociado a una tarea.
   *
   * @param idTarea ID de la tarea.
   * @returns URL de descarga/visualización inline del documento.
   */
  getDocumentoUrl(idTarea: number): string {
    return `${this.API_URL}&m=descargarDocumento&id=${idTarea}`;
  }

  getDocumentoBlob(idTarea: number): Observable<Blob> {
    return this.http.get(`${this.API_URL}&m=descargarDocumento&id=${idTarea}`, { responseType: 'blob' });
  }

  /**
   * Proxy auxiliar que conecta con `ActividadesService` para poblar listados desplegables
   * en los formularios de nueva tarea.
   * 
   * @returns Un `Observable` con la lista de actividades globales del sistema.
   */
  getActividades(): Observable<any[]> {
    return this.actividadesService.getActividades();
  }
}
