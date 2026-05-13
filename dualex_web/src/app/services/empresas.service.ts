import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EmpresaDTO } from '../dto/dualex.dto';

@Injectable({
  providedIn: 'root'
})
export class EmpresasService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/index.php?c=Empresas`;

  obtenerEmpresasDataTables(dataTablesParameters: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}&m=obtenerDataTables`, dataTablesParameters);
  }

  agregarEmpresa(empresa: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}&m=crear`, empresa);
  }

  actualizarEmpresa(id: number, empresa: any): Observable<any> {
    return this.http.put<any>(`${this.API_URL}&m=actualizar&id=${id}`, empresa);
  }

  eliminarEmpresa(id: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}&m=eliminar&id=${id}`);
  }
}
