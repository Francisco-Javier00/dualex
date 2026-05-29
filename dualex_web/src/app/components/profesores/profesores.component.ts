import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Config } from 'datatables.net';
import 'datatables.net-responsive-bs5';
import { DatatableComponent } from '../shared/datatable/datatable.component';
import { ConfirmarBorradoModalComponent } from '../shared/modals/confirmar-borrado-modal/confirmar-borrado-modal.component';
import { ProfesorModalComponent } from '../modals/profesor-modal/profesor-modal.component';
import { ImportarProfesoresModalComponent } from '../modals/importar-profesores-modal/importar-profesores-modal.component';
import { AlertService } from '../../services/alert.service';
import { ProfesoresService } from '../../services/profesores.service';
import { ProfesorDTO } from '../../dto/dualex.dto';
import { AuthService } from '../../auth/services/auth.service';

/**
 * Componente para la gestión de Profesores.
 * 
 * Muestra una tabla con el listado de docentes, permitiendo su administración (crear, editar, eliminar)
 * y la funcionalidad de importación masiva mediante archivos Excel.
 */
@Component({
  selector: 'app-profesores',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatatableComponent, ConfirmarBorradoModalComponent, ProfesorModalComponent, ImportarProfesoresModalComponent],
  templateUrl: './profesores.component.html',
  styleUrl: './profesores.component.css'
})
export class ProfesoresComponent implements OnInit {
  private profesoresService = inject(ProfesoresService);
  private alertService = inject(AlertService);
  private location = inject(Location);

  private authService = inject(AuthService);

  @ViewChild(DatatableComponent) datatable?: DatatableComponent;

  dtOptions: any = {};
  puedeEditar = false;
  modalBorradoVisible = false;
  modalCrearVisible = false;
  modalImportarVisible = false;
  importandoExcel = false;
  modoFormulario: 'crear' | 'editar' = 'crear';
  profesorEditandoId: number | null = null;
  profesorSeleccionado: ProfesorDTO | null = null;

  ngOnInit(): void {
    this.puedeEditar = this.authService.currentUserValue?.rol === 'COORDINADOR' && !!this.authService.currentUserValue?.esGeneral;

    this.dtOptions = {
      order: [],
      responsive: true,
      serverSide: true,
      processing: true,
      lengthChange: true,
      dom: "<'d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3'<'profesores-length'l><'profesores-search'f>>rt<'d-flex justify-content-between align-items-center flex-wrap gap-3 mt-3'ip>",
      ajax: (dataTablesParameters: any, callback: any) => {
        this.profesoresService.obtenerProfesoresDataTables(dataTablesParameters).subscribe(resp => {
          callback({
            recordsTotal: resp.recordsTotal,
            recordsFiltered: resp.recordsFiltered,
            data: resp.data
          });
        });
      },
      columns: [
        {
          title: ' ',
          className: 'dtr-control all',
          orderable: false,
          data: null,
          defaultContent: '',
          responsivePriority: 1
        },
        { data: 'nombre', width: '15%', responsivePriority: 2 },
        { data: 'apellidos', width: '18%', responsivePriority: 3 },
        { data: 'correo', width: '22%', responsivePriority: 4 },
        { data: 'rol', className: 'text-nowrap', width: '10%', responsivePriority: 5 },
        ...(this.puedeEditar ? [{
          data: null,
          className: 'text-center align-middle',
          orderable: false,
          searchable: false,
          width: '8%',
          responsivePriority: 6,
          render: () => `
            <div class="d-flex justify-content-center gap-2 action-buttons">
              <button class="btn btn-sm btn-outline-primary shadow-sm action-edit" data-action="edit" title="Editar">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger shadow-sm action-delete" data-action="delete" title="Eliminar">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          `
        }] : [])
      ],
      language: {
        emptyTable: 'No hay profesores disponibles',
        info: 'Mostrando _START_ a _END_ de _TOTAL_ profesores',
        infoEmpty: 'Mostrando 0 a 0 de 0 profesores',
        infoFiltered: '(filtrado de _MAX_ profesores en total)',
        lengthMenu: 'Mostrar _MENU_ profesores',
        loadingRecords: 'Cargando...',
        processing: 'Procesando...',
        search: 'Buscar:',
        zeroRecords: 'No se encontraron profesores',
        paginate: {
          first: 'Primero',
          last: 'Último',
          next: 'Siguiente',
          previous: 'Anterior'
        }
      },
      pageLength: 10,
      lengthMenu: [10, 25, 50]
    };
  }

  importarExcel(): void {
    if (!this.puedeEditar) return;
    this.modalImportarVisible = true;
  }

  onCerrarImportar(): void {
    this.modalImportarVisible = false;
  }

  onConfirmarImportar(file: File): void {
    this.importandoExcel = true;
    this.profesoresService.importarProfesoresExcel(file).subscribe({
      next: (res) => {
        this.importandoExcel = false;
        this.modalImportarVisible = false;

        let msg = `Se han importado ${res.imported} profesores correctamente.`;

        if (res.imported === 0) {
          const errorDetails = res.errors && res.errors.length > 0 ? res.errors.slice(0, 5).join('\n') : 'El archivo no contiene registros procesables o todos están duplicados.';
          this.alertService.error(
            'No se importaron profesores',
            `Se han detectado errores en todos los registros. No se importó ningún profesor.\n\nDetalles:\n${errorDetails}`
          );
        } else if (res.errors && res.errors.length > 0) {
          const errorDetails = res.errors.slice(0, 5).join('\n');
          const errorCount = res.errors.length;
          this.alertService.advertencia(
            'Importación con Observaciones',
            `${msg} Sin embargo, se detectaron ${errorCount} errores en el proceso. Primeros errores:\n${errorDetails}`,
            false,
            8000
          );

        } else {
          this.alertService.exito('Importación Exitosa', msg);
        }

        this.datatable?.refrescar();
      },
      error: (err) => {
        this.importandoExcel = false;
        this.alertService.error(
          'Error al importar',
          err.error?.message || err.error?.error || 'No se pudo procesar el archivo de profesores.'
        );
      }
    });
  }

  crearNuevaEntrada(): void {
    if (!this.puedeEditar) return;
    this.modoFormulario = 'crear';
    this.profesorSeleccionado = null;
    this.modalCrearVisible = true;
  }

  onTableAction(event: { action: string, data: any }): void {
    if (event.action === 'edit') {
      this.abrirEdicionProfesor(event.data);
      return;
    }

    if (event.action === 'delete') {
      this.profesorSeleccionado = event.data;
      this.modalBorradoVisible = true;
    }
  }

  onGuardarProfesor(profesorData: any): void {
    const obs = this.modoFormulario === 'crear'
      ? this.profesoresService.agregarProfesor(profesorData)
      : this.profesoresService.actualizarProfesor(profesorData.id, profesorData);

    obs.subscribe({
      next: () => {
        const msg = this.modoFormulario === 'crear' ? 'Profesor creado con éxito.' : 'Profesor actualizado con éxito.';
        this.alertService.exito('Éxito', msg);
        this.modalCrearVisible = false;
        this.datatable?.refrescar();
      },
      error: (err: any) => {
        const errorMsg = err.error?.error || err.error?.message || 'Error al procesar el profesor.';
        this.alertService.error('Error', errorMsg);
      }
    });
  }

  onConfirmarBorrado(): void {
    if (!this.profesorSeleccionado) return;

    this.profesoresService.eliminarProfesor(this.profesorSeleccionado.id).subscribe({
      next: () => {
        this.alertService.exito('Profesor eliminado', `${this.profesorSeleccionado!.nombre} ${this.profesorSeleccionado!.apellidos} ha sido eliminado.`);
        this.modalBorradoVisible = false;
        this.profesorSeleccionado = null;
        this.refrescarTabla();
      },
      error: (err) => this.alertService.error('Error', err.error?.message || 'No se pudo eliminar al profesor.')
    });
  }

  onCancelarBorrado(): void {
    this.modalBorradoVisible = false;
    this.profesorSeleccionado = null;
  }

  onCancelarCreacion(): void {
    this.modalCrearVisible = false;
    this.profesorEditandoId = null;
    this.modoFormulario = 'crear';
  }

  abrirEdicionProfesor(profesor: ProfesorDTO): void {
    if (!this.puedeEditar) return;
    this.modoFormulario = 'editar';
    this.profesorSeleccionado = { ...profesor };
    this.modalCrearVisible = true;
  }

  private refrescarTabla(): void {
    this.datatable?.refrescar();
  }

  irAtras(): void {
    this.location.back();
  }
}
