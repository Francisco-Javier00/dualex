import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-alumnos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './alumnos.component.html'
})
export class AlumnosComponent implements OnInit {
  ciclo: string | null = null;
  curso: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.ciclo = params['ciclo'];
      this.curso = params['curso'];
    });
  }
}
