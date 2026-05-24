import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Alerta } from '../dto/dualex.dto';

/**
 * Servicio encargado de la gestión y visualización de notificaciones tipo Toast/Alert.
 * Proporciona métodos para mostrar avisos interactivos de información, éxito, advertencia o error.
 */
@Injectable({
  providedIn: 'root'
})
export class AlertService {

  private sujetoAlertas = new BehaviorSubject<Alerta[]>([]);
  public alertas$ = this.sujetoAlertas.asObservable();

  constructor() { }

  /**
   * Muestra un aviso azul con información genérica.
   * 
   * @param titulo Título de la notificación.
   * @param mensaje Cuerpo detallado del mensaje.
   * @param autoCierre Define si la alerta se ocultará automáticamente (por defecto true).
   * @param duracion Tiempo en milisegundos que la alerta permanecerá visible.
   */
  informacion(titulo: string, mensaje: string, autoCierre: boolean = true, duracion: number = 3000): void {
    this.agregarAlerta('info', titulo, mensaje, autoCierre, duracion);
  }

  /**
   * Muestra un aviso amarillo indicando precaución o advertencia.
   * 
   * @param titulo Título de la notificación.
   * @param mensaje Cuerpo detallado del mensaje.
   * @param autoCierre Define si la alerta se ocultará automáticamente (por defecto false).
   * @param duracion Tiempo en milisegundos que la alerta permanecerá visible.
   */
  advertencia(titulo: string, mensaje: string, autoCierre: boolean = false, duracion: number = 3000): void {
    this.agregarAlerta('warning', titulo, mensaje, autoCierre, duracion);
  }

  /**
   * Muestra un aviso verde indicando que una operación se realizó con éxito.
   * 
   * @param titulo Título de la notificación.
   * @param mensaje Cuerpo detallado del mensaje.
   * @param autoCierre Define si la alerta se ocultará automáticamente.
   * @param duracion Tiempo en milisegundos que la alerta permanecerá visible.
   */
  exito(titulo: string, mensaje: string, autoCierre: boolean = true, duracion: number = 2500): void {
    this.agregarAlerta('success', titulo, mensaje, autoCierre, duracion);
  }

  /**
   * Muestra un aviso rojo indicando un error en el sistema o en una operación.
   * 
   * @param titulo Título del error.
   * @param mensaje Descripción detallada del error.
   * @param autoCierre Define si la alerta se ocultará automáticamente (por defecto false).
   * @param duracion Tiempo en milisegundos que la alerta permanecerá visible.
   */
  error(titulo: string, mensaje: string, autoCierre: boolean = false, duracion: number = 3500): void {
    this.agregarAlerta('danger', titulo, mensaje, autoCierre, duracion);
  }

  /**
   * Elimina un aviso específico de la pantalla buscándolo por su identificador.
   * 
   * @param id Identificador único de la alerta a eliminar.
   */
  eliminarAlerta(id: string): void {
    const alertasActuales = this.sujetoAlertas.value;
    const alertasActualizadas = alertasActuales.filter(alerta => alerta.id !== id);
    this.sujetoAlertas.next(alertasActualizadas);
  }

  /**
   * Elimina todas las notificaciones visibles simultáneamente, vaciando el flujo.
   */
  limpiarTodo(): void {
    this.sujetoAlertas.next([]);
  }

  /**
   * Método interno para crear la estructura de la alerta y emitirla al Observable.
   * Gestiona el temporizador de auto-cierre si está habilitado.
   * 
   * @param tipo Nivel de severidad de la alerta (info, warning, success, danger).
   * @param titulo Título visible.
   * @param mensaje Cuerpo visible.
   * @param autoCierre Booleano para cierre automático.
   * @param duracion Milisegundos de duración.
   */
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

  /**
   * Genera una clave única para identificar de forma segura cada aviso en el DOM.
   * 
   * @returns Un string aleatorio basado en la fecha y valores criptográficos simples.
   */
  private generarId(): string {
    return 'alerta_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }
}