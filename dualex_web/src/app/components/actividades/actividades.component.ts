import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DatatableComponent } from '../shared/datatable/datatable.component';
import { ConfirmarBorradoModalComponent } from '../shared/modals/confirmar-borrado-modal/confirmar-borrado-modal.component';
import { ActividadesMockService } from '../../services/actividades-mock.service';
import { AlertService } from '../../services/alert.service';
import { Config } from 'datatables.net';

@Component({
  selector: 'app-actividades',
  standalone: true,
  imports: [CommonModule, RouterModule, DatatableComponent, ConfirmarBorradoModalComponent],
  templateUrl: './actividades.component.html'
})
export class ActividadesComponent implements OnInit {
  private actividadesMockService = inject(ActividadesMockService);
  private alertService = inject(AlertService);

  dtOptions: Config = {};
  modalBorradoVisible = false;
  actividadSeleccionada: any = null;

  ngOnInit(): void {
    this.dtOptions = {
      serverSide: true,
      processing: true,
      ajax: (dataTablesParameters: any, callback: any) => {
        this.actividadesMockService.obtenerActividadesDataTables(dataTablesParameters).subscribe(resp => {
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
    this.alertService.informacion('Nueva Actividad', 'Aquí se abrirá el formulario para registrar una nueva actividad.');
  }

  onTableAction(event: { action: string, data: any }): void {
    if (event.action === 'edit') {
      this.alertService.informacion('Editar', `Editando la actividad: "${event.data.titulo}"`);
    } else if (event.action === 'delete') {
      this.actividadSeleccionada = event.data;
      this.modalBorradoVisible = true;
    }
  }

  onConfirmarBorrado(): void {
    this.alertService.exito('Eliminada', `La actividad "${this.actividadSeleccionada?.titulo}" ha sido eliminada.`);
    this.modalBorradoVisible = false;
    this.actividadSeleccionada = null;
    // TODO: llamar al servicio real de borrado
  }

  onCancelarBorrado(): void {
    this.modalBorradoVisible = false;
    this.actividadSeleccionada = null;
  }
}
