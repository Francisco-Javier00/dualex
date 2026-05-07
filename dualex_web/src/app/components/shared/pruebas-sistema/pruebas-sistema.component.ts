import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AlertService } from '../../../services/alert.service';
import { AuthService } from '../../../auth/services/auth.service';
import { PerfilUsuario } from '../../../dto/dualex.dto';

@Component({
  selector: 'app-pruebas-sistema',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pruebas-sistema.component.html',
  styleUrls: ['./pruebas-sistema.component.css']
})
export class PruebasSistemaComponent implements OnInit {
  private servicioAlertas = inject(AlertService);
  private authService = inject(AuthService);
  private router = inject(Router);

  abierto = false;

  ngOnInit() {
    // Si la app arranca y no hay usuario (porque no hay cookie real), inyectamos uno de prueba automáticamente
    if (!this.authService.currentUserValue) {
      this.cambiarRolUsuario('COORDINADOR');
    }
  }

  togglePanel() {
    this.abierto = !this.abierto;
  }

  cambiarRolUsuario(rol: string) {
    const mockProfile: PerfilUsuario = {
      id: 1,
      nombre: 'Usuario',
      apellidos: 'Prueba',
      email: `test.${rol.toLowerCase()}@dualex.es`,
      rol: rol
    };
    
    // Asignar nombres específicos según el rol para las pruebas
    if (rol === 'PROFESOR') {
      mockProfile.nombre = 'Santiago';
      mockProfile.apellidos = 'Pizarro Pizarro';
    } else if (rol === 'ALUMNO') {
      mockProfile.nombre = 'Francisco Javier';
      mockProfile.apellidos = 'Martínez Fernández';
    } else if (rol === 'COORDINADOR') {
      mockProfile.nombre = 'Juan Carlos';
      mockProfile.apellidos = 'Díaz del Castillo';
    }

    this.authService.forzarPerfilPrueba(mockProfile);
    this.servicioAlertas.informacion('Cambio de Rol', `Ahora estás viendo la vista de ${rol}`);

    // Redirigir a la ruta principal del rol activo
    if (rol === 'ALUMNO') {
      this.router.navigate(['/tareas']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  probarAlerta(tipo: 'success' | 'danger' | 'info') {
    switch(tipo) {
      case 'success': this.servicioAlertas.exito('Éxito', 'Operación completada correctamente'); break;
      case 'danger': this.servicioAlertas.error('Error', 'Ha ocurrido un error inesperado'); break;
      case 'info': this.servicioAlertas.informacion('Información', 'Este es un mensaje informativo'); break;
    }
  }
}
