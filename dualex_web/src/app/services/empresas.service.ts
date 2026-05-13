import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmpresaDTO } from '../dto/dualex.dto';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmpresasService {
  private http = inject(HttpClient);

  // URL de la API PHP sacada del environment
  private readonly API_URL = `${environment.apiUrl}/dualex/dualex_back/index.php`;

  /**
   * Envía los parámetros de DataTables al backend para obtener la lista de empresas.
   * Se utiliza POST para poder enviar estructuras complejas de filtros y ordenación sin problemas de URL.
   *
   * @param dataTablesParameters Objeto con la configuración actual de paginación y filtros de la tabla.
   * @returns Observable con la respuesta del servidor lista para ser procesada por DataTables.
   */
  obtenerEmpresasDataTables(dataTablesParameters: any): Observable<any> {
    return this.http.post(`${this.API_URL}?c=Empresas&m=obtenerDataTables`, dataTablesParameters);
  }

  /**
   * Llama al endpoint de creación para guardar una nueva empresa junto a sus contactos.
   */
  agregarEmpresa(empresa: Omit<EmpresaDTO, 'id'>): Observable<any> {
    return this.http.post(`${this.API_URL}?c=Empresas&m=crear`, empresa);
  }

  /**
   * Envía los datos actualizados de una empresa al backend para su modificación.
   */
  actualizarEmpresa(id: number, empresa: Omit<EmpresaDTO, 'id'>): Observable<any> {
    return this.http.post(`${this.API_URL}?c=Empresas&m=actualizar&id=${id}`, empresa);
  }

  /**
   * Envía una petición de borrado al backend para eliminar permanentemente una empresa.
   */
  eliminarEmpresa(id: number): Observable<any> {
    return this.http.post(`${this.API_URL}?c=Empresas&m=eliminar&id=${id}`, {});
  }
}
