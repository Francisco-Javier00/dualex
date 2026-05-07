import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Alerta } from '../dto/dualex.dto';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  private sujetoAlertas = new BehaviorSubject<Alerta[]>([]);
  public alertas$ = this.sujetoAlertas.asObservable();

  constructor() { }

  // metodo encargado de mostrar un aviso azul con informacion
  informacion(titulo: string, mensaje: string, autoCierre: boolean = true, duracion: number = 3000): void {
    this.agregarAlerta('info', titulo, mensaje, autoCierre, duracion);
  }

  // metodo encargado de mostrar un aviso amarillo de precaucion
  advertencia(titulo: string, mensaje: string, autoCierre: boolean = true, duracion: number = 3000): void {
    this.agregarAlerta('warning', titulo, mensaje, autoCierre, duracion);
  }

  // metodo encargado de mostrar un aviso verde de exito
  exito(titulo: string, mensaje: string, autoCierre: boolean = true, duracion: number = 2500): void {
    this.agregarAlerta('success', titulo, mensaje, autoCierre, duracion);
  }

  // metodo encargado de mostrar un aviso rojo de error
  error(titulo: string, mensaje: string, autoCierre: boolean = true, duracion: number = 3500): void {
    this.agregarAlerta('danger', titulo, mensaje, autoCierre, duracion);
  }

  // metodo encargado de quitar un aviso especifico de la pantalla
  eliminarAlerta(id: string): void {
    const alertasActuales = this.sujetoAlertas.value;
    const alertasActualizadas = alertasActuales.filter(alerta => alerta.id !== id);
    this.sujetoAlertas.next(alertasActualizadas);
  }

  // metodo encargado de borrar todos los avisos a la vez
  limpiarTodo(): void {
    this.sujetoAlertas.next([]);
  }

  // metodo encargado de agregar un aviso nuevo a la lista para que se vea
  private agregarAlerta(tipo: Alerta['tipo'], titulo: string, mensaje: string, autoCierre: boolean, duracion: number): void {
    const alerta: Alerta = {
      id: this.generarId(),
      tipo,
      titulo,
      mensaje,
      fecha: new Date(),
      autoCierre,
      duracion
    };

    const alertasActuales = this.sujetoAlertas.value;
    this.sujetoAlertas.next([...alertasActuales, alerta]);

    // Auto-cerrar si esta configurado
    if (autoCierre) {
      setTimeout(() => {
        this.eliminarAlerta(alerta.id);
      }, duracion);
    }
  }

  // metodo encargado de crear una clave unica para identificar cada aviso
  private generarId(): string {
    return 'alerta_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }
}