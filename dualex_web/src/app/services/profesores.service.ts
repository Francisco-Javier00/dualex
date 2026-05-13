import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ProfesorDTO } from '../dto/dualex.dto';

@Injectable({
  providedIn: 'root'
})
export class ProfesoresService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/dualex/dualex_back/index.php?c=Profesores`;

  readonly ciclosDisponibles = [
    'Sistemas Microinformáticos y Redes',
    'Desarrollo de Aplicaciones Web',
    'Gestión Administrativa'
  ];

  /**
   * Obtiene la lista de profesores procesada para DataTables.
   */
  obtenerProfesoresDataTables(dataTablesParameters: any): Observable<any> {
    return this.http.post(`${this.API_URL}&m=obtenerDataTables`, dataTablesParameters);
  }

  /**
   * Registra un nuevo profesor.
   */
  agregarProfesor(profesor: Omit<ProfesorDTO, 'id'>): Observable<any> {
    return this.http.post(`${this.API_URL}&m=crear`, profesor);
  }

  /**
   * Actualiza los datos de un profesor existente.
   */
  actualizarProfesor(id: number, profesor: Omit<ProfesorDTO, 'id'>): Observable<any> {
    return this.http.post(`${this.API_URL}&m=actualizar&id=${id}`, profesor);
  }

  /**
   * Elimina un profesor del sistema.
   */
  eliminarProfesor(id: number): Observable<any> {
    return this.http.post(`${this.API_URL}&m=eliminar&id=${id}`, {});
  }
}

