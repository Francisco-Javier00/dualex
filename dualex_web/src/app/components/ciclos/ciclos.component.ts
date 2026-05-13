import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatatableComponent } from '../shared/datatable/datatable.component';
import { ConfirmarBorradoModalComponent } from '../shared/modals/confirmar-borrado-modal/confirmar-borrado-modal.component';
import { Config } from 'datatables.net';
import { CiclosService } from '../../services/ciclos.service';
import { CicloDTO } from '../../dto/dualex.dto';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-ciclos',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DatatableComponent,
    ConfirmarBorradoModalComponent
  ],
  templateUrl: './ciclos.component.html',
  styleUrl: './ciclos.component.css'
})
export class CiclosComponent implements OnInit {
  private ciclosService = inject(CiclosService);
  private alertService = inject(AlertService);

  ciclos: CicloDTO[] = [];

  dtOptions: Config = {};
  columnTitles: string[] = ['Nombre', 'Siglas', 'Grado', 'Cursos', 'Módulos', 'Acciones'];

  isDeleteModalOpen = false;
  cicloToDelete: any = null;

  isEditModalOpen = false;
  isEditing = false;
  cicloForm: any = {
    nombre: '',
    siglas: '',
    grado: 'Grado Medio',
    cursos: '',
    anoEscolar: '',
    colorFondo1: '#ffffff',
    colorTexto1: '#000000',
    colorFondo2: '#ffffff',
    colorTexto2: '#000000'
  };
  editingId: number | null = null;

  @ViewChild(DatatableComponent) sharedDatatable!: DatatableComponent;

  ngOnInit(): void {
    this.cargarCiclos();

    this.dtOptions = {
      data: this.ciclos,
      columns: [
        { data: 'nombre' },
        { data: 'siglas' },
        { data: 'grado' },
        { data: 'cursos' },
        { data: null, defaultContent: 'Gestionar Módulos' },
        {
          data: null,
          orderable: false,
          className: 'text-center',
          render: () => `
            <div class="d-flex gap-2 justify-content-center align-items-center action-buttons w-100">
              <button class="btn btn-sm btn-outline-primary shadow-sm action-edit" data-action="edit" title="Editar">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger shadow-sm action-delete" data-action="delete" title="Eliminar">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          `
        }
      ],
      language: {
        processing: "Procesando...",
        search: "Buscar:",
        lengthMenu: "Mostrar _MENU_ elementos",
        info: "Mostrando del _START_ al _END_ de un total de _TOTAL_ elementos",
        infoEmpty: "Mostrando 0 de 0 de un total de 0 elementos",
        infoFiltered: "(filtrado de un total de _MAX_ elementos)",
        loadingRecords: "Cargando...",
        zeroRecords: "No se han encontrado resultados",
        emptyTable: "No hay datos disponibles en la tabla",
        paginate: {
          first: "Primero",
          previous: "Anterior",
          next: "Siguiente",
          last: "Último"
        }
      }
    };
  }

  cargarCiclos() {
    this.ciclosService.getCiclos().subscribe(ciclos => {
      this.ciclos = ciclos;
      if (this.sharedDatatable) {
        this.actualizarTabla();
      }
    });
  }

  handleAction(event: { action: string, data: any }) {
    if (event.action === 'delete') {
      this.cicloToDelete = event.data;
      this.isDeleteModalOpen = true;
    } else if (event.action === 'edit') {
      this.abrirEditModal(event.data);
    }
  }

  abrirEditModal(ciclo?: any) {
    if (ciclo) {
      this.isEditing = true;
      this.editingId = ciclo.id;
      this.cicloForm = {
        ...ciclo,
        cursos: ciclo.cursos || this.formatearCursos(ciclo.siglas),
      };
    } else {
      this.isEditing = false;
      this.editingId = null;
      this.cicloForm = {
        nombre: '',
        siglas: '',
        grado: 'Grado Medio',
        cursos: '',
      };
    }
    this.isEditModalOpen = true;
  }

  cerrarEditModal() {
    this.isEditModalOpen = false;
  }

  guardarCiclo() {
    const nombreForm = this.cicloForm.nombre?.trim().toLowerCase() || '';
    const siglasForm = this.cicloForm.siglas?.trim().toLowerCase() || '';

    if (!nombreForm || !siglasForm) {
      this.alertService.error('Error', 'El nombre y las siglas son obligatorios.');
      return;
    }

    const duplicado = this.ciclos.find(c => {
      if (this.isEditing && c.id === this.editingId) return false;
      const nombreExistente = c.nombre?.trim().toLowerCase() || '';
      const siglasExistente = c.siglas?.trim().toLowerCase() || '';
      return nombreExistente === nombreForm || siglasExistente === siglasForm;
    });

    if (duplicado) {
      this.alertService.error('Duplicado', 'Ya existe un ciclo con ese nombre o con esas siglas.');
      return;
    }

    const siglas = this.cicloForm.siglas;
    const cicloParaGuardar = {
      ...this.cicloForm
    };

    if (this.isEditing && this.editingId) {
      this.ciclosService.updateCiclo(this.editingId, cicloParaGuardar).subscribe(() => {
        this.cargarCiclos();
        this.cerrarEditModal();
      });
    } else {
      this.ciclosService.addCiclo(cicloParaGuardar).subscribe(() => {
        this.cargarCiclos();
        this.cerrarEditModal();
      });
    }
  }

  confirmarEliminar() {
    if (this.cicloToDelete) {
      this.ciclosService.deleteCiclo(this.cicloToDelete.id).subscribe(() => {
        this.cargarCiclos();
        this.cerrarDeleteModal();
      });
    }
  }

  private actualizarTabla() {
    if (this.sharedDatatable && this.sharedDatatable.dtElement) {
      this.sharedDatatable.dtElement.dtInstance.then((dtInstance: any) => {
        dtInstance.clear();
        dtInstance.rows.add(this.ciclos);
        dtInstance.draw();
      });
    }
  }

  cerrarDeleteModal() {
    this.isDeleteModalOpen = false;
    this.cicloToDelete = null;
  }

  formatearCursos(siglas: string): string {
    return siglas ? `1${siglas},2${siglas}` : '';
  }
}
