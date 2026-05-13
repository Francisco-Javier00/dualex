import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EmpresaDTO } from '../dto/dualex.dto';

@Injectable({
  providedIn: 'root'
})
export class EmpresasService {
  private http = inject(HttpClient);

  // URL de la API PHP
  private readonly API_URL = 'http://localhost:8080/dualex/dualex_back/index.php';

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
   *
   * @param empresa Objeto con los datos de la empresa (sin ID) y el array de contactos.
   * @returns Observable que notifica el éxito o error de la inserción.
   */
  agregarEmpresa(empresa: Omit<EmpresaDTO, 'id'>): Observable<any> {
    return this.http.post(`${this.API_URL}?c=Empresas&m=agregarEmpresa`, empresa);
  }

  /**
   * Envía los datos actualizados de una empresa al backend para su modificación.
   *
   * @param id Identificador único de la empresa a editar.
   * @param empresa Objeto con los datos modificados.
   * @returns Observable con el estado de la actualización.
   */
  actualizarEmpresa(id: number, empresa: Omit<EmpresaDTO, 'id'>): Observable<any> {
    return this.http.post(`${this.API_URL}?c=Empresas&m=actualizarEmpresa&id=${id}`, empresa);
  }

  /**
   * Envía una petición de borrado al backend para eliminar permanentemente una empresa.
   *
   * @param id Identificador único de la empresa a eliminar.
   * @returns Observable que confirma la eliminación.
   */
  eliminarEmpresa(id: number): Observable<any> {
    return this.http.post(`${this.API_URL}?c=Empresas&m=eliminarEmpresa&id=${id}`, {});
  }
}
