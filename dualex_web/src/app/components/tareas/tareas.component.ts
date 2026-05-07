import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-tareas',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tareas.component.html'
})
export class TareasComponent {}
