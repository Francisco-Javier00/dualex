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
  private readonly API_URL = `${environment.apiUrl}/index.php?c=Profesores`;

  readonly ciclosDisponibles = [
    'Sistemas Microinformáticos y Redes',
    'Desarrollo de Aplicaciones Web',
    'Gestión Administrativa'
  ];

  obtenerProfesoresDataTables(dataTablesParameters: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}&m=obtenerDataTables`, dataTablesParameters);
  }

  agregarProfesor(profesor: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}&m=crear`, profesor);
  }

  actualizarProfesor(id: number, profesor: any): Observable<any> {
    return this.http.put<any>(`${this.API_URL}&m=actualizar&id=${id}`, profesor);
  }

  eliminarProfesor(id: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}&m=eliminar&id=${id}`);
  }

  getProfesorByEmail(email: string): Observable<ProfesorDTO> {
    return this.http.get<ProfesorDTO>(`${this.API_URL}&m=obtener&correo=${email}`);
  }
}
