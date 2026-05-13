import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent {
  version = '1.0';
  fechaPublicacion = 'Junio 2026';

  equipo = {
    direccion: 'Isabel Muñoz Domínguez',
    programadores: [
      'Francisco Javier Martínez Fernández',
      'Santiago Pizarro Pizarro',
      'Juan Carlos Díaz del Castillo'
    ]
  };
}
