import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ModuloDTO } from '../dto/dualex.dto';

/**
 * Servicio encargado de la gestión de Módulos conectando con el router index.php.
 */
@Injectable({
  providedIn: 'root'
})
export class ModulosService {
  private http = inject(HttpClient);
  
  // URL del router central de la API PHP
  private readonly API_URL = `${environment.apiUrl}/index.php?c=Modulos`;

  /**
   * Obtiene la lista completa de módulos.
   */
  getModulos(): Observable<ModuloDTO[]> {
    return this.http.get<ModuloDTO[]>(`${this.API_URL}&m=listar`);
  }

  /**
   * Procesa la solicitud de DataTables conectando con el backend.
   */
  obtenerModulosDataTables(dataTablesParameters: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}&m=obtenerDataTables`, dataTablesParameters);
  }

  /**
   * Registra un nuevo módulo.
   */
  createModulo(modulo: ModuloDTO): Observable<ModuloDTO> {
    return this.http.post<ModuloDTO>(`${this.API_URL}&m=crear`, modulo);
  }

  /**
   * Actualiza los datos de un módulo existente.
   */
  updateModulo(modulo: ModuloDTO): Observable<ModuloDTO> {
    return this.http.put<ModuloDTO>(`${this.API_URL}&m=actualizar&id=${modulo.id}`, modulo);
  }

  /**
   * Elimina un módulo.
   */
  deleteModulo(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.API_URL}&m=eliminar&id=${id}`);
  }

  /**
   * Obtiene un módulo por su ID.
   */
  getModuloById(id: number): Observable<ModuloDTO> {
    return this.http.get<ModuloDTO>(`${this.API_URL}&m=obtener&id=${id}`);
  }
}
