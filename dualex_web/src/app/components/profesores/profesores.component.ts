import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profesores',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profesores.component.html'
})
export class ProfesoresComponent {}
