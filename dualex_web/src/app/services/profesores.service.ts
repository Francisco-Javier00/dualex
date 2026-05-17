import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProfesorDTO } from '../dto/dualex.dto';

/**
 * Servicio de Angular encargado de gestionar las peticiones HTTP y la comunicación
 * con la API de Profesores en el backend de Dualex.
 * 
 * Proporciona métodos para listar (con DataTables), registrar, actualizar,
 * eliminar y obtener información de los profesores de la plataforma.
 */
@Injectable({
  providedIn: 'root'
})
export class ProfesoresService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/index.php?c=Profesores`;

  /**
   * Obtiene la lista de profesores paginada y filtrada para la integración con DataTables.
   * 
   * @param dataTablesParameters Parámetros estándar enviados por la librería DataTables (start, length, search, etc.).
   * @returns Un `Observable` que emite un objeto con los datos de paginación y la lista de profesores.
   */
  obtenerProfesoresDataTables(dataTablesParameters: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}&m=obtenerDataTables`, dataTablesParameters);
  }

  /**
   * Registra un nuevo profesor en el sistema.
   * 
   * @param profesor Objeto con los datos del profesor a registrar (nombre, correo, etc.).
   * @returns Un `Observable` con la respuesta del backend tras la inserción.
   */
  agregarProfesor(profesor: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}&m=crear`, profesor);
  }

  /**
   * Actualiza la información de un profesor existente en la base de datos.
   * 
   * @param id Identificador único del profesor a actualizar.
   * @param profesor Objeto con los nuevos datos del profesor.
   * @returns Un `Observable` con la respuesta de la operación de actualización.
   */
  actualizarProfesor(id: number, profesor: any): Observable<any> {
    return this.http.put<any>(`${this.API_URL}&m=actualizar&id=${id}`, profesor);
  }

  /**
   * Elimina lógicamente o físicamente un profesor del sistema.
   * 
   * @param id Identificador único del profesor a eliminar.
   * @returns Un `Observable` con el resultado de la eliminación.
   */
  eliminarProfesor(id: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}&m=eliminar&id=${id}`);
  }

  /**
   * Obtiene los datos detallados de un profesor mediante su dirección de correo electrónico.
   * 
   * @param email Correo electrónico institucional del profesor a buscar.
   * @returns Un `Observable` de tipo `ProfesorDTO` con los detalles encontrados.
   */
  getProfesorByEmail(email: string): Observable<ProfesorDTO> {
    return this.http.get<ProfesorDTO>(`${this.API_URL}&m=obtener&correo=${email}`);
  }
}
