import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AlumnoDTO } from '../dto/dualex.dto';

/**
 * Servicio de Angular para la gestión integral de Alumnos.
 * Se comunica con el controlador `Alumnos` en el backend PHP.
 */
@Injectable({
  providedIn: 'root'
})
export class AlumnosService {
  private http = inject(HttpClient);

  // URL del router central de la API PHP
  private readonly API_URL = `${environment.apiUrl}/index.php?c=Alumnos`;

  /**
   * Obtiene la lista completa de todos los alumnos registrados sin paginar.
   * 
   * @returns Un `Observable` con un array de objetos `AlumnoDTO`.
   */
  getAlumnos(): Observable<AlumnoDTO[]> {
    return this.http.get<AlumnoDTO[]>(`${this.API_URL}&m=listar`);
  }

  /**
   * Obtiene los datos detallados de un alumno específico mediante su identificador.
   * 
   * @param id Identificador único del alumno a buscar.
   * @returns Un `Observable` que emite el objeto `AlumnoDTO` encontrado.
   */
  getAlumnoById(id: number): Observable<AlumnoDTO> {
    return this.http.get<AlumnoDTO>(`${this.API_URL}&m=obtener&id=${id}`);
  }

  /**
   * Procesa la solicitud de paginación, ordenación y filtrado conectando con el backend para DataTables.
   * 
   * @param dataTablesParameters Parámetros estándar de la librería DataTables.
   * @returns Un `Observable` con los datos estructurados para renderizar la tabla dinámica.
   */
  obtenerAlumnosDataTables(dataTablesParameters: any): Observable<any> {
    const idModulo = dataTablesParameters.idModulo ? `&idModulo=${dataTablesParameters.idModulo}` : '';
    return this.http.post<any>(`${this.API_URL}&m=obtenerDataTables${idModulo}`, dataTablesParameters);
  }

  /**
   * Envía una petición POST al servidor para registrar un nuevo alumno.
   * 
   * @param alumno Objeto `AlumnoDTO` con los datos del estudiante a registrar.
   * @returns Un `Observable` con el resultado de la creación, normalmente el alumno insertado.
   */
  createAlumno(alumno: AlumnoDTO): Observable<AlumnoDTO> {
    return this.http.post<AlumnoDTO>(`${this.API_URL}&m=crear`, alumno);
  }

  /**
   * Envía una petición PUT al servidor para actualizar los datos de un alumno existente.
   * 
   * @param alumno Objeto `AlumnoDTO` con los datos actualizados y el ID correspondiente.
   * @returns Un `Observable` con la respuesta de la modificación.
   */
  updateAlumno(alumno: AlumnoDTO): Observable<AlumnoDTO> {
    return this.http.put<AlumnoDTO>(`${this.API_URL}&m=actualizar&id=${alumno.id}`, alumno);
  }

  /**
   * Elimina un alumno del sistema de forma permanente o lógica (según backend).
   * 
   * @param id Identificador único del alumno a eliminar.
   * @returns Un `Observable` booleano indicando el éxito de la operación.
   */
  deleteAlumno(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.API_URL}&m=eliminar&id=${id}`);
  }

  /**
   * Obtiene la lista de alumnos que están inscritos en un módulo específico.
   * Útil para vistas de profesores.
   * 
   * @param idModulo Identificador del módulo formativo.
   * @returns Un `Observable` con un array de `AlumnoDTO` asociados al módulo.
   */
  getAlumnosByModulo(idModulo: number): Observable<AlumnoDTO[]> {
    return this.http.get<AlumnoDTO[]>(`${this.API_URL}&m=listarPorModulo&idModulo=${idModulo}`);
  }

  /**
   * Envía un archivo CSV y el ID del curso al servidor para realizar la importación masiva.
   * 
   * @param file Archivo CSV seleccionado.
   * @param idCurso Identificador del curso asignado.
   * @returns Un `Observable` con el resultado de la importación (imported, skipped, errors).
   */
  importarAlumnosCSV(file: File, idCurso: number): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('idCurso', idCurso.toString());
    return this.http.post<any>(`${this.API_URL}&m=importarCSV`, formData);
  }
}

