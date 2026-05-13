import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatatableComponent } from '../shared/datatable/datatable.component';
import { ConfirmarBorradoModalComponent } from '../shared/modals/confirmar-borrado-modal/confirmar-borrado-modal.component';
import { Config } from 'datatables.net';
import { AlertService } from '../../services/alert.service';
import { CursosService } from '../../services/cursos.service';
import { CiclosService } from '../../services/ciclos.service';
import { CursoDTO } from '../../dto/dualex.dto';

@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatatableComponent, ConfirmarBorradoModalComponent],
  templateUrl: './cursos.component.html',
  styleUrl: './cursos.component.css'
})
export class CursosComponent implements OnInit {
  private servicioAlertas = inject(AlertService);
  private cursosService = inject(CursosService);
  private ciclosService = inject(CiclosService);

  cursos: CursoDTO[] = [];
  ciclosExistentes: any[] = [];

  dtOptions: Config = {};
  columnTitles: string[] = ['Nombre', 'Curso', 'Año Escolar', 'Ciclo', 'Acciones'];

  isEditModalOpen = false;
  isEditing = false;
  tipoCiclo: 'existente' | 'nuevo' = 'existente';
  cursoForm: any = this.initForm();

  isDeleteModalOpen = false;
  cursoToDelete: any = null;
  palabraConfirmacion = '';

  @ViewChild(DatatableComponent) sharedDatatable!: DatatableComponent;

  /**
   * Inicializa el componente, carga los datos y configura las opciones de la tabla.
   */
  ngOnInit(): void {
    this.cargarDatos();

    this.dtOptions = {
      data: this.cursos,
      columns: [
        { data: 'nombre' },
        { data: 'curso', className: 'text-center' },
        { data: 'anoEscolar' },
        { data: 'ciclo' },
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

  /**
   * Recupera la lista de cursos y ciclos desde los servicios correspondientes.
   */
  cargarDatos() {
    this.cursosService.getCursos().subscribe(cursos => {
      this.cursos = cursos;
      if (this.sharedDatatable) {
        this.actualizarTabla();
      }
    });
    this.ciclosExistentes = this.ciclosService.getCiclosExistentes();
  }

  /**
   * Inicializa el objeto del formulario con valores por defecto.
   * retorna Un objeto con la estructura inicial del formulario.
   */
  initForm() {
    return {
      id: null,
      cicloExistente: '',
      curso: '',
      siglasCurso: '',
      colorFondo: '#ffffff',
      colorTexto: '#000000',
      // Campos para ciclo nuevo
      nombreCiclo: '',
      siglasCiclo: '',
      grado: 'Superior',
      anoEscolar: ''
    };
  }

  /**
   * Gestiona las acciones disparadas desde la tabla (editar o eliminar).
   * @param event Objeto que contiene la acción y los datos de la fila.
   */
  handleAction(event: { action: string, data: any }) {
    if (event.action === 'edit') {
      this.abrirEditModal(event.data);
    } else if (event.action === 'delete') {
      this.abrirDeleteModal(event.data);
    }
  }

  /**
   * Abre el modal de edición/creación. Si se pasa un curso, rellena el formulario para editarlo.
   * @param curso (Opcional) El objeto del curso a editar.
   */
  abrirEditModal(curso?: any) {
    if (curso) {
      this.isEditing = true;
      this.tipoCiclo = 'existente';
      this.cursoForm = {
        ...this.initForm(),
        id: curso.id,
        cicloExistente: curso.ciclo,
        curso: curso.curso,
        siglasCurso: curso.nombre,
        anoEscolar: curso.anoEscolar
      };
    } else {
      this.isEditing = false;
      this.tipoCiclo = 'existente';
      this.cursoForm = this.initForm();
    }
    this.isEditModalOpen = true;
  }

  /**
   * Cierra el modal de edición/creación.
   */
  cerrarEditModal() {
    this.isEditModalOpen = false;
  }

  /**
   * Valida y guarda la información del curso (creación o actualización).
   * Si el ciclo es nuevo, también lo añade a la lista de ciclos.
   */
  guardarCurso() {
    const siglas = this.cursoForm.siglasCurso;

    // Comprobar duplicados por siglas
    const duplicado = this.cursos.find(c => c.nombre === siglas && c.id !== this.cursoForm.id);

    if (duplicado) {
      this.servicioAlertas.error('Error', `Ya existe un curso con las siglas "${siglas}"`);
      return;
    }

    if (!this.cursoForm.curso) {
      this.servicioAlertas.error('Error', 'Debes seleccionar un curso (1º o 2º)');
      return;
    }

    // Si el ciclo es nuevo, lo guardamos también en el servicio de ciclos
    if (this.tipoCiclo === 'nuevo') {
      this.ciclosService.addCiclo({
        nombre: this.cursoForm.nombreCiclo,
        siglas: this.cursoForm.siglasCiclo,
        grado: this.cursoForm.grado,
        anoEscolar: this.cursoForm.anoEscolar
      }).subscribe(() => {
        this.ciclosExistentes = this.ciclosService.getCiclosExistentes();
      });
    }

    const cursoData: CursoDTO = {
      id: this.isEditing ? this.cursoForm.id : Date.now(),
      nombre: siglas,
      curso: this.cursoForm.curso,
      anoEscolar: this.tipoCiclo === 'nuevo' ? this.cursoForm.anoEscolar : '25-26',
      ciclo: this.tipoCiclo === 'existente' ? this.cursoForm.cicloExistente : this.cursoForm.nombreCiclo
    };

    if (this.isEditing) {
      this.cursosService.updateCurso(cursoData.id, cursoData).subscribe(() => {
        this.cargarDatos();
        this.cerrarEditModal();
      });
    } else {
      this.cursosService.addCurso(cursoData).subscribe(() => {
        this.cargarDatos();
        this.cerrarEditModal();
      });
    }
  }

  /**
   * Abre el modal de confirmación de eliminación.
   * @param curso El curso que se pretende eliminar.
   */
  abrirDeleteModal(curso: any) {
    this.cursoToDelete = curso;
    this.palabraConfirmacion = '';
    this.isDeleteModalOpen = true;
  }

  /**
   * Cierra el modal de eliminación y limpia el curso seleccionado.
   */
  cerrarDeleteModal() {
    this.isDeleteModalOpen = false;
    this.cursoToDelete = null;
  }

  /**
   * Ejecuta la eliminación del curso si el usuario ha escrito la palabra de confirmación.
   */
  confirmarEliminar() {
    if (this.palabraConfirmacion.toLowerCase() === 'confirmar' && this.cursoToDelete) {
      this.cursosService.deleteCurso(this.cursoToDelete.id).subscribe(() => {
        this.cargarDatos();
        this.cerrarDeleteModal();
      });
    }
  }

  /**
   * Genera automáticamente las siglas del curso basándose en el curso (1º/2º) y las siglas del ciclo.
   */
  actualizarSiglas() {
    let siglasCiclo = '';

    if (this.tipoCiclo === 'existente') {
      const ciclo = this.ciclosExistentes.find(c => c.nombre === this.cursoForm.cicloExistente);
      if (ciclo) {
        siglasCiclo = ciclo.siglas;
      }
    } else {
      siglasCiclo = this.cursoForm.siglasCiclo;
    }

    if (siglasCiclo && this.cursoForm.curso) {
      this.cursoForm.siglasCurso = `${this.cursoForm.curso}º ${siglasCiclo}`;
    }
  }

  /**
   * Actualiza los datos de la instancia de DataTable compartida.
   */
  private actualizarTabla() {
    if (this.sharedDatatable && this.sharedDatatable.dtElement) {
      this.sharedDatatable.dtElement.dtInstance.then((dtInstance: any) => {
        dtInstance.clear();
        dtInstance.rows.add(this.cursos);
        dtInstance.draw();
      });
    }
  }
}
