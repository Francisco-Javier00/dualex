import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';
import { AlertService } from '../../../services/alert.service';
import { AlertaDTO } from '../../../dto/dualex.dto';

@Component({
  selector: 'app-alerts',
  templateUrl: './alerts.component.html',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({
          transform: 'translateX(100%) scale(0.9)',
          opacity: 0
        }),
        animate('500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          style({
            transform: 'translateX(0%) scale(1)',
            opacity: 1
          }))
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          style({
            transform: 'translateX(100%) scale(0.95)',
            opacity: 0
          }))
      ])
    ])
  ]
})
export class AlertsComponent implements OnInit, OnDestroy {

  alertas: AlertaDTO[] = [];
  private suscripcion!: Subscription;

  constructor(private servicioAlertas: AlertService) { }

  ngOnInit(): void {
    // Suscribirse a las alertas del servicio
    this.suscripcion = this.servicioAlertas.alertas$.subscribe(
      (alertas: AlertaDTO[]) => {
        this.alertas = alertas;
      }
    );
  }

  ngOnDestroy(): void {
    // Limpiar la suscripción
    if (this.suscripcion) {
      this.suscripcion.unsubscribe();
    }
  }

  /**
   * Quitar una alerta específica
   */
  quitarAlerta(idAlerta: string): void {
    this.servicioAlertas.eliminarAlerta(idAlerta);
  }
}
