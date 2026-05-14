import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DatatableComponent } from '../shared/datatable/datatable.component';
import { ConfirmarBorradoModalComponent } from '../shared/modals/confirmar-borrado-modal/confirmar-borrado-modal.component';
import { ActividadModalComponent } from '../modals/actividad-modal/actividad-modal.component';
import { ActividadesService } from '../../services/actividades.service';
import { AlertService } from '../../services/alert.service';
import { ActividadDTO } from '../../dto/dualex.dto';
import { Config } from 'datatables.net';

@Component({
  selector: 'app-actividades',
  standalone: true,
  imports: [CommonModule, RouterModule, ActividadModalComponent, DatatableComponent, ConfirmarBorradoModalComponent],
  templateUrl: './actividades.component.html'
})
export class ActividadesComponent implements OnInit {
  private actividadesService = inject(ActividadesService);
  private alertService = inject(AlertService);

  @ViewChild(DatatableComponent) datatable!: DatatableComponent;

  dtOptions: Config = {};
  modalBorradoVisible = false;
  modalActividadVisible = false;
  actividadSeleccionada: ActividadDTO | null = null;

  ngOnInit(): void {
    this.dtOptions = {
      serverSide: true,
      processing: true,
      ajax: (dataTablesParameters: any, callback: any) => {
        this.actividadesService.obtenerActividadesDataTables(dataTablesParameters).subscribe(resp => {
          callback({
            recordsTotal: resp.recordsTotal,
            recordsFiltered: resp.recordsFiltered,
            data: resp.data
          });
        });
      },
      columns: [
        { data: 'titulo' },
        { data: 'descripcion' },
        { data: 'modulo' },
        {
          data: null,
          orderable: false,
          searchable: false,
          render: () => `
            <div class="d-flex gap-2 justify-content-center">
              <button class="btn btn-sm btn-outline-primary shadow-sm" data-action="edit" title="Editar">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger shadow-sm" data-action="delete" title="Eliminar">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          `
        }
      ],
      language: {
        emptyTable: 'No hay actividades disponibles',
        info: 'Mostrando _START_ a _END_ de _TOTAL_ actividades',
        infoEmpty: 'Mostrando 0 a 0 de 0 actividades',
        infoFiltered: '(filtrado de _MAX_ actividades en total)',
        lengthMenu: 'Mostrar _MENU_ actividades',
        loadingRecords: 'Cargando...',
        processing: 'Procesando...',
        search: 'Buscar:',
        zeroRecords: 'No se encontraron actividades',
        paginate: {
          first: 'Primero',
          last: 'Último',
          next: 'Siguiente',
          previous: 'Anterior'
        }
      },
      pageLength: 10,
      lengthMenu: [5, 10, 25, 50]
    };
  }

  crearNueva(): void {
    this.actividadSeleccionada = null;
    this.modalActividadVisible = true;
  }

  onTableAction(event: { action: string, data: any }): void {
    if (event.action === 'edit') {
      this.actividadSeleccionada = { ...event.data };
      this.modalActividadVisible = true;
    } else if (event.action === 'delete') {
      this.actividadSeleccionada = event.data;
      this.modalBorradoVisible = true;
    }
  }

  onGuardarActividad(actividad: ActividadDTO): void {
    if (actividad.id) {
      this.actividadesService.updateActividad(actividad).subscribe(() => {
        this.alertService.exito('Actualizada', 'La actividad se ha modificado correctamente.');
        this.recargarTabla();
      });
    } else {
      this.actividadesService.createActividad(actividad).subscribe(() => {
        this.alertService.exito('Creada', 'La nueva actividad se ha registrado en el catálogo.');
        this.recargarTabla();
      });
    }
  }

  onConfirmarBorrado(): void {
    if (this.actividadSeleccionada) {
      this.actividadesService.deleteActividad(this.actividadSeleccionada.id).subscribe(() => {
        this.alertService.exito('Eliminada', `La actividad ha sido eliminada del catálogo.`);
        this.recargarTabla();
        this.modalBorradoVisible = false;
        this.actividadSeleccionada = null;
      });
    }
  }

  onCancelarBorrado(): void {
    this.modalBorradoVisible = false;
    this.actividadSeleccionada = null;
  }

  private recargarTabla(): void {
    this.datatable.refrescar();
  }
}
