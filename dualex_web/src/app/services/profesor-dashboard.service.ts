import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModuloProfesor } from '../dto/dualex.dto';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfesorDashboardService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/index.php?c=Modulos`;

  obtenerModulosDelProfesor(): Observable<ModuloProfesor[]> {
    return this.http.get<ModuloProfesor[]>(`${this.API_URL}&m=listarProfesor`);
  }
}
