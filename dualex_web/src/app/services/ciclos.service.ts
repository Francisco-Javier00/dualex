import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CicloDTO } from '../dto/dualex.dto';
import { Observable } from 'rxjs';

/**
 * Servicio encargado de gestionar las operaciones CRUD y lógicas relacionadas
 * con los Ciclos Formativos a través de la API REST de PHP.
 */
@Injectable({
  providedIn: 'root'
})
export class CiclosService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/index.php?c=Ciclos`;

  constructor() { }

  /**
   * Recupera el listado completo de todos los ciclos formativos registrados.
   * 
   * @returns Un `Observable` con un array de objetos `CicloDTO`.
   */
  getCiclos(): Observable<CicloDTO[]> {
    return this.http.get<CicloDTO[]>(`${this.API_URL}&m=listar`);
  }

  /**
   * Proporciona la lista de ciclos de forma paginada para ser consumida por DataTables.
   * 
   * @param params Objeto de configuración de búsqueda y paginación de DataTables.
   * @returns Un `Observable` estructurado con la respuesta paginada del backend.
   */
  obtenerCiclosDataTables(params: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}&m=obtenerDataTables`, params);
  }

  /**
   * Registra un nuevo ciclo formativo en la base de datos.
   * 
   * @param ciclo Objeto con la información básica del ciclo (nombre, siglas, familia profesional, etc.).
   * @returns Un `Observable` con el resultado de la inserción.
   */
  addCiclo(ciclo: CicloDTO): Observable<CicloDTO> {
    return this.http.post<CicloDTO>(`${this.API_URL}&m=crear`, ciclo);
  }

  /**
   * Actualiza los metadatos de un ciclo formativo existente.
   * 
   * @param id Identificador único del ciclo a modificar.
   * @param ciclo Datos actualizados del ciclo.
   * @returns Un `Observable` con los nuevos datos persistidos.
   */
  updateCiclo(id: number, ciclo: CicloDTO): Observable<CicloDTO> {
    return this.http.put<CicloDTO>(`${this.API_URL}&m=actualizar&id=${id}`, ciclo);
  }

  /**
   * Elimina de forma definitiva un ciclo formativo de la plataforma.
   * 
   * @param id Identificador del ciclo a eliminar.
   * @returns Un `Observable` de confirmación de eliminación (booleano).
   */
  deleteCiclo(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.API_URL}&m=eliminar&id=${id}`);
  }

  /**
   * Recupera todos los ciclos para mostrar opciones en formularios o vistas legacy
   * que requieren la estructura combinada de nombre y siglas.
   * 
   * @returns Un `Observable` con la lista plana de ciclos.
   */
  getCiclosExistentes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}&m=listar`);
  }
}
