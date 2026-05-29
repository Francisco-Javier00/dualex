import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ModuloDTO } from '../dto/dualex.dto';

/**
 * Servicio de Angular para la gestión de Módulos (asignaturas/clases).
 * Se comunica con el controlador `Modulos` del backend para proveer datos a la interfaz.
 */
@Injectable({
  providedIn: 'root'
})
export class ModulosService {
  private http = inject(HttpClient);
  
  // URL del router central de la API PHP
  private readonly API_URL = `${environment.apiUrl}/index.php?c=Modulos`;

  /**
   * Obtiene la lista completa de todos los módulos sin filtros.
   * 
   * @returns Un `Observable` con el array completo de `ModuloDTO`.
   */
  getModulos(): Observable<ModuloDTO[]> {
    return this.http.get<ModuloDTO[]>(`${this.API_URL}&m=listar`);
  }

  /**
   * Obtiene los módulos asociados a un ciclo concreto filtrando por sus siglas.
   * 
   * @param siglasCiclo Acrónimo o siglas del ciclo formativo a consultar.
   * @returns Un `Observable` con los módulos que pertenecen al ciclo solicitado.
   */
  getModulosPorCiclo(siglasCiclo: string): Observable<ModuloDTO[]> {
    const ciclo = encodeURIComponent(siglasCiclo);
    return this.http.get<ModuloDTO[]>(`${this.API_URL}&m=listarPorCiclo&siglasCiclo=${ciclo}`);
  }

  /**
   * Delega al backend el filtrado, búsqueda y paginación de los módulos.
   * 
   * @param dataTablesParameters Parámetros de estado de la tabla visual (página, búsqueda, orden).
   * @returns Un `Observable` con el formato esperado por DataTables.
   */
  obtenerModulosDataTables(dataTablesParameters: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}&m=obtenerDataTables`, dataTablesParameters);
  }

  /**
   * Envía los datos de un nuevo módulo para su creación en la base de datos.
   * 
   * @param modulo El objeto `ModuloDTO` que se va a persistir.
   * @returns Un `Observable` emitiendo el objeto persistido devuelto por la API.
   */
  createModulo(modulo: ModuloDTO): Observable<ModuloDTO> {
    return this.http.post<ModuloDTO>(`${this.API_URL}&m=crear`, modulo);
  }

  /**
   * Realiza la actualización completa de las propiedades de un módulo.
   * 
   * @param modulo Objeto `ModuloDTO` con los datos ya modificados.
   * @returns Un `Observable` con el resultado de la actualización.
   */
  updateModulo(modulo: ModuloDTO): Observable<ModuloDTO> {
    return this.http.put<ModuloDTO>(`${this.API_URL}&m=actualizar&id=${modulo.id}`, modulo);
  }

  /**
   * Solicita la eliminación permanente de un módulo por su clave principal.
   * 
   * @param id El identificador único del módulo a borrar.
   * @returns Un `Observable` confirmando el éxito o fracaso de la eliminación.
   */
  deleteModulo(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.API_URL}&m=eliminar&id=${id}`);
  }

  /**
   * Extrae los metadatos y valores de un módulo específico en base a su ID.
   * 
   * @param id El ID numérico del módulo a buscar.
   * @returns Un `Observable` con los datos del módulo buscado.
   */
  getModuloById(id: number): Observable<ModuloDTO> {
    return this.http.get<ModuloDTO>(`${this.API_URL}&m=obtener&id=${id}`);
  }

  /**
   * Obtiene la lista de módulos que imparte un profesor en base a su correo electrónico.
   * 
   * @param email Correo electrónico opcional del profesor. Si no se pasa, el backend resolverá por token.
   * @returns Un `Observable` con la lista de módulos del profesor.
   */
  getModulosProfesor(email?: string): Observable<any[]> {
    const url = email ? `${this.API_URL}&m=listarProfesor&emailProfesor=${encodeURIComponent(email)}` : `${this.API_URL}&m=listarProfesor`;
    return this.http.get<any[]>(url);
  }

  /**
   * Asocia una lista de profesores a un módulo en particular.
   * 
   * @param idModulo ID único del módulo.
   * @param profesoresIds Array de IDs de los profesores seleccionados.
   * @returns Un `Observable` con la respuesta del backend.
   */
  vincularProfesores(idModulo: number, profesoresIds: number[]): Observable<any> {
    return this.http.post<any>(`${this.API_URL}&m=vincularProfesores&id=${idModulo}`, { profesoresIds });
  }
}
