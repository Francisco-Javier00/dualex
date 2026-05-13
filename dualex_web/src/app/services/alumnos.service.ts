import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AlumnoDTO } from '../dto/dualex.dto';

/**
 * Servicio encargado de la gestión de Alumnos conectando con el router index.php.
 */
@Injectable({
  providedIn: 'root'
})
export class AlumnosService {
  private http = inject(HttpClient);

  // URL del router central de la API PHP
  private readonly API_URL = `${environment.apiUrl}/index.php?c=Alumnos`;

  /**
   * Obtiene la lista completa de alumnos.
   */
  getAlumnos(): Observable<AlumnoDTO[]> {
    return this.http.get<AlumnoDTO[]>(`${this.API_URL}&m=listar`);
  }

  /**
   * Obtiene un alumno por su ID.
   */
  getAlumnoById(id: number): Observable<AlumnoDTO> {
    return this.http.get<AlumnoDTO>(`${this.API_URL}&m=obtener&id=${id}`);
  }

  /**
   * Procesa la solicitud de DataTables conectando con el backend.
   */
  obtenerAlumnosDataTables(dataTablesParameters: any): Observable<any> {
    const idModulo = dataTablesParameters.idModulo ? `&idModulo=${dataTablesParameters.idModulo}` : '';
    return this.http.post<any>(`${this.API_URL}&m=obtenerDataTables${idModulo}`, dataTablesParameters);
  }

  /**
   * Registra un nuevo alumno.
   */
  createAlumno(alumno: AlumnoDTO): Observable<AlumnoDTO> {
    return this.http.post<AlumnoDTO>(`${this.API_URL}&m=crear`, alumno);
  }

  /**
   * Actualiza los datos de un alumno existente.
   */
  updateAlumno(alumno: AlumnoDTO): Observable<AlumnoDTO> {
    return this.http.put<AlumnoDTO>(`${this.API_URL}&m=actualizar&id=${alumno.id}`, alumno);
  }

  /**
   * Elimina un alumno.
   */
  deleteAlumno(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.API_URL}&m=eliminar&id=${id}`);
  }

  /**
   * Obtiene la lista de alumnos inscritos en un módulo específico.
   */
  getAlumnosByModulo(idModulo: number): Observable<AlumnoDTO[]> {
    return this.http.get<AlumnoDTO[]>(`${this.API_URL}&m=listarPorModulo&idModulo=${idModulo}`);
  }
}
