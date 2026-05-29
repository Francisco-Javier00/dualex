import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AlertService } from './alert.service';

describe('AlertService', () => {
  let service: AlertService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlertService);
  });

  it('should be created', () => {
    // Assert
    expect(service).toBeTruthy();
  });

  it('should add info alert', () => {
    // Arrange
    const titulo = 'Info';
    const mensaje = 'Mensaje info';

    // Act
    service.informacion(titulo, mensaje, false);

    // Assert
    service.alertas$.subscribe(alertas => {
      expect(alertas.length).toBe(1);
      expect(alertas[0].tipo).toBe('info');
      expect(alertas[0].titulo).toBe(titulo);
      expect(alertas[0].mensaje).toBe(mensaje);
    });
  });

  it('should auto-close alert if autoCierre is true', fakeAsync(() => {
    // Arrange
    service.informacion('Info', 'Msg', true, 1000);

    // Act
    tick(1001);

    // Assert
    service.alertas$.subscribe(alertas => {
      expect(alertas.length).toBe(0);
    });
  }));

  it('should handle friendly messages on error', () => {
    // Arrange
    const titulo = 'Error';
    const mensajeOriginal = 'SQLSTATE[42000] Syntax error';

    // Act
    service.error(titulo, mensajeOriginal, false);

    // Assert
    service.alertas$.subscribe(alertas => {
      expect(alertas[0].tipo).toBe('danger');
      expect(alertas[0].mensaje).toContain('problema interno en el servidor');
    });
  });

  it('should clear all alerts', () => {
    // Arrange
    service.exito('1', '1', false);
    service.advertencia('2', '2', false);

    // Act
    service.limpiarTodo();

    // Assert
    service.alertas$.subscribe(alertas => {
      expect(alertas.length).toBe(0);
    });
  });
});
