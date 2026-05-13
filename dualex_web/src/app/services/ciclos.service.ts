import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CicloDTO } from '../dto/dualex.dto';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CiclosService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/index.php?c=Ciclos`;

  constructor() { }

  getCiclos(): Observable<CicloDTO[]> {
    return this.http.get<CicloDTO[]>(`${this.API_URL}&m=listar`);
  }

  obtenerCiclosDataTables(params: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}&m=obtenerDataTables`, params);
  }

  addCiclo(ciclo: CicloDTO): Observable<CicloDTO> {
    return this.http.post<CicloDTO>(`${this.API_URL}&m=crear`, ciclo);
  }

  updateCiclo(id: number, ciclo: CicloDTO): Observable<CicloDTO> {
    return this.http.put<CicloDTO>(`${this.API_URL}&m=actualizar&id=${id}`, ciclo);
  }

  deleteCiclo(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.API_URL}&m=eliminar&id=${id}`);
  }

  // Para compatibilidad con componentes que esperaban el objeto con nombre y siglas
  getCiclosExistentes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}&m=listar`);
  }
}
