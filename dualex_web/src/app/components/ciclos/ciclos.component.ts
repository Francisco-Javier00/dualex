import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatatableComponent } from '../shared/datatable/datatable.component';
import { ConfirmarBorradoModalComponent } from '../shared/modals/confirmar-borrado-modal/confirmar-borrado-modal.component';
import { Config } from 'datatables.net';
import { CiclosService } from '../../services/ciclos.service';
import { CicloDTO } from '../../dto/dualex.dto';

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
  editingOriginalSiglas: string | null = null;

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
        url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
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
      this.editingOriginalSiglas = ciclo.siglas;
      this.cicloForm = {
        ...ciclo,
        cursos: ciclo.cursos || this.formatearCursos(ciclo.siglas),
        anoEscolar: ciclo.anoEscolar || '',
        colorFondo1: ciclo.colorFondo1 || '#ffffff',
        colorTexto1: ciclo.colorTexto1 || '#000000',
        colorFondo2: ciclo.colorFondo2 || '#ffffff',
        colorTexto2: ciclo.colorTexto2 || '#000000'
      };
    } else {
      this.isEditing = false;
      this.editingOriginalSiglas = null;
      this.cicloForm = {
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
    }
    this.isEditModalOpen = true;
  }

  cerrarEditModal() {
    this.isEditModalOpen = false;
  }

  guardarCiclo() {
    const cicloParaGuardar = {
      ...this.cicloForm,
      cursos: this.formatearCursos(this.cicloForm.siglas)
    };

    if (this.isEditing && this.editingOriginalSiglas) {
      this.ciclosService.updateCiclo(this.editingOriginalSiglas, cicloParaGuardar).subscribe(() => {
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
      this.ciclosService.deleteCiclo(this.cicloToDelete.siglas).subscribe(() => {
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
