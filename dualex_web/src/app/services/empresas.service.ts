import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EmpresaDTO } from '../dto/dualex.dto';

/**
 * Servicio encargado de la gestión integral de Empresas y centros de trabajo.
 * Se comunica de forma síncrona con el backend en PHP.
 */
@Injectable({
  providedIn: 'root'
})
export class EmpresasService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/index.php?c=Empresas`;

  /**
   * Obtiene la lista completa de empresas colaboradoras sin paginación.
   * 
   * @returns Un `Observable` con un array de `EmpresaDTO`.
   */
  getEmpresas(): Observable<EmpresaDTO[]> {
    return this.http.get<EmpresaDTO[]>(`${this.API_URL}&m=listar`);
  }

  /**
   * Obtiene la lista de empresas paginada para la renderización en DataTables.
   * 
   * @param dataTablesParameters Parámetros de paginación y búsqueda enviados por la vista.
   * @returns Un `Observable` con los datos estructurados para la tabla.
   */
  obtenerEmpresasDataTables(dataTablesParameters: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}&m=obtenerDataTables`, dataTablesParameters);
  }

  /**
   * Registra una nueva empresa en la base de datos del sistema.
   * 
   * @param empresa Datos de la empresa a crear.
   * @returns Un `Observable` con el resultado de la inserción.
   */
  agregarEmpresa(empresa: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}&m=crear`, empresa);
  }

  /**
   * Actualiza la información y metadatos de una empresa existente.
   * 
   * @param id Identificador de la empresa.
   * @param empresa Datos actualizados de la entidad.
   * @returns Un `Observable` con la confirmación de la actualización.
   */
  actualizarEmpresa(id: number, empresa: any): Observable<any> {
    return this.http.put<any>(`${this.API_URL}&m=actualizar&id=${id}`, empresa);
  }

  /**
   * Elimina de forma permanente el registro de una empresa.
   * 
   * @param id Identificador de la empresa a eliminar.
   * @returns Un `Observable` booleano indicando el éxito de la petición.
   */
  eliminarEmpresa(id: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}&m=eliminar&id=${id}`);
  }
}
