import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfiguracionDTO } from '../dto/dualex.dto';

/**
 * Servicio para gestionar la configuración global desde la base de datos.
 */
@Injectable({
  providedIn: 'root'
})
export class ConfiguracionService {
  private http = inject(HttpClient);

  // URL de la API PHP para entorno XAMPP
  private readonly API_URL = 'http://localhost:8080/dualex/dualex_back/index.php';

  /**
   * Obtiene la configuración actual desde la base de datos.
   */
  getConfiguracion(): Observable<ConfiguracionDTO> {
    return this.http.get<ConfiguracionDTO>(`${this.API_URL}?c=Configuracion&m=obtenerConfiguracion`);
  }

  /**
   * Actualiza los valores de configuración en la base de datos.
   */
  updateConfiguracion(config: ConfiguracionDTO): Observable<any> {
    return this.http.post(`${this.API_URL}?c=Configuracion&m=actualizarConfiguracion`, config);
  }
}
