import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-modulos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './modulos.component.html'
})
export class ModulosComponent {}
