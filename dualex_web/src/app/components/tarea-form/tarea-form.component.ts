import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';

/**
 * IMPORTACIÓN DE COMPONENTES DE CKEDITOR 5
 * Se cargan todos los plugins necesarios para habilitar funciones avanzadas como
 * tablas, imágenes (Base64), redimensionamiento, alineación, etc.
 */
import { 
  ClassicEditor, 
  Bold, 
  Essentials, 
  Italic, 
  Paragraph, 
  Link, 
  List, 
  Image, 
  ImageToolbar, 
  ImageCaption, 
  ImageStyle, 
  ImageUpload, 
  ImageResize, 
  MediaEmbed,
  Table,
  TableToolbar,
  TableColumnResize,
  Heading,
  Indent,
  BlockQuote,
  Autoformat,
  Underline,
  Strikethrough,
  Font,
  Alignment,
  Highlight,
  RemoveFormat,
  Base64UploadAdapter
} from 'ckeditor5';

// Traducciones al español para CKEditor
import translations from 'ckeditor5/translations/es.js';

// Servicios y DTOs
import { TareasService } from '../../services/tareas.service';
import { ActividadesService } from '../../services/actividades.service';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../auth/services/auth.service';
import { ActividadDTO, Tarea } from '../../dto/dualex.dto';

// Componentes compartidos
import { SeleccionActividadesModalComponent } from '../shared/modals/seleccion-actividades-modal/seleccion-actividades-modal.component';

/**
 * TareaFormComponent
 * Componente dinámico que sirve tanto para CREAR como para EDITAR tareas del cuaderno del alumno.
 * Utiliza un formulario reactivo para la persistencia de datos complejos.
 */
@Component({
  selector: 'app-tarea-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CKEditorModule, SeleccionActividadesModalComponent],
  templateUrl: './tarea-form.component.html',
  styleUrls: ['./tarea-form.component.css']
})
export class TareaFormComponent implements OnInit {
  // Inyección de servicios utilizando la sintaxis 'inject' (Angular 16+)
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tareasService = inject(TareasService);
  public location = inject(Location);
  private alertService = inject(AlertService);
  private authService = inject(AuthService);

  // Variables de Estado
  tareaForm!: FormGroup;               // Objeto raíz del formulario reactivo
  esEdicion = false;                    // Flag para diferenciar entre Crear y Editar
  idTarea: number | null = null;        // Almacena el ID si estamos editando
  idAlumno: number | null = null;       // Almacena el ID del alumno si lo estamos especificando
  actividades: ActividadDTO[] = [];     // Catálogo maestro de actividades recuperado del servicio
  modalActividadesVisible = false;      // Controla la visibilidad del modal de selección
  esAlumno = false;                     // Flag para identificar si es un alumno
  codigoTarea = '';                     // Código auto-generado de la tarea

  // Instancia del editor CKEditor
  public Editor = ClassicEditor;
  
  /**
   * CONFIGURACIÓN DE CKEDITOR 5
   * Define la barra de herramientas, plugins y comportamientos de imágenes/tablas.
   */
  public config = {
    licenseKey: 'GPL',
    language: 'es',
    translations: [translations],
    plugins: [
      Essentials, Paragraph, Bold, Italic, Link, List, 
      Image, ImageToolbar, ImageCaption, ImageStyle, ImageUpload, ImageResize,
      MediaEmbed, Table, TableToolbar, TableColumnResize, Heading, Indent, BlockQuote, Autoformat,
      Underline, Strikethrough, Font, Alignment, Highlight, RemoveFormat,
      Base64UploadAdapter // Permite subir imágenes directamente como cadenas Base64
    ],
    toolbar: [
      'undo', 'redo', '|', 
      'heading', '|', 
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'fontSize', 'fontColor', 'fontBackgroundColor', 'highlight', '|',
      'alignment', '|',
      'bulletedList', 'numberedList', 'blockQuote', '|',
      'insertTable', 'uploadImage', 'mediaEmbed', '|', 
      'outdent', 'indent', '|',
      'removeFormat'
    ],
    image: {
      toolbar: [
        'imageStyle:inline', 'imageStyle:block', 'imageStyle:side',
        '|', 'toggleImageCaption', 'imageTextAlternative',
        '|', 'resizeImage'
      ]
    },
    table: {
      contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
    }
  };

  // Opciones para el selector de evaluación de la empresa (según normativa Dualex)
  evaluacionEmpresaOptions = [
    'Sin Calificar', 
    'Superado', 
    'Bien', 
    'Notable', 
    'Excelente', 
    'No Superado'
  ];

  /**
   * INICIALIZACIÓN DEL COMPONENTE
   */
  ngOnInit(): void {
    this.esAlumno = this.authService.currentUserValue?.rol === 'ALUMNO';
    this.crearFormulario();
    this.cargarActividades(); // Cargamos el catálogo para mapear IDs a Títulos
    
    // Detectamos el alumnoId en los queryParams (si viene de la vista de un alumno)
    this.route.queryParams.subscribe(params => {
      const aId = params['alumnoId'];
      if (aId) {
        this.idAlumno = +aId;
      }
    });

    // Detectamos si la URL contiene un ID para activar el modo edición
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id && id !== 'nueva') {
        this.esEdicion = true;
        this.idTarea = +id;
        this.cargarDatosTarea(this.idTarea);
      }
    });
  }

  /**
   * Recupera el catálogo de actividades desde el servicio.
   */
  cargarActividades(): void {
    this.tareasService.getActividades().subscribe(data => {
      this.actividades = data;
    });
  }

  /**
   * Recupera los datos de una tarea específica y los carga en el formulario.
   */
  cargarDatosTarea(id: number): void {
    this.tareasService.getTareaById(id).subscribe(tarea => {
      if (tarea) {
        if (tarea.idAlumno) {
          this.idAlumno = tarea.idAlumno;
        }
        if (tarea.codigo_auto) {
          this.codigoTarea = tarea.codigo_auto;
        }
        // Mapeamos los datos del objeto al formulario reactivo
        this.tareaForm.patchValue(tarea);
        // Regeneramos el listado de módulos revisables según las actividades cargadas
        if (tarea.actividadesSeleccionadas) {
          this.actualizarRevisionesModulos(tarea.actividadesSeleccionadas, tarea.revisionesModulos);
        }
      }
    });
  }

  /**
   * Define la estructura y validaciones del formulario reactivo.
   */
  crearFormulario(): void {
    this.tareaForm = this.fb.group({
      titulo: ['', Validators.required],
      fechaIni: ['', Validators.required],
      fechaFin: ['', Validators.required],
      descripcion: [''],
      actividadesSeleccionadas: [[]],
      evaluacionEmpresa: ['Sin Calificar'],
      comentarioEmpresa: [''],
      moduloEvaluacion: [''],
      revisionesModulos: this.fb.array([]), // Array dinámico de revisiones por módulo
      revisadoProfesor: [false],
      comentarioProfesor: ['']
    });
    
    if (this.esAlumno) {
      this.tareaForm.get('comentarioProfesor')?.disable();
    }
  }

  /**
   * Gestión del Modal de Actividades
   */
  abrirModalActividades(): void {
    this.modalActividadesVisible = true;
  }

  /**
   * Se ejecuta cuando el modal de selección emite una nueva lista de IDs.
   */
  onSeleccionChange(ids: number[]): void {
    this.tareaForm.get('actividadesSeleccionadas')?.setValue(ids);
    this.actualizarRevisionesModulos(ids);
  }

  /**
   * Lógica de Módulos Dinámicos:
   * Calcula los módulos únicos presentes en las actividades seleccionadas y crea 
   * un control de revisión (checkbox) para cada uno de ellos.
   */
  private actualizarRevisionesModulos(ids: number[], revisionesCargadas?: any[]): void {
    if (!ids || ids.length === 0) {
      this.revisionesModulosArray.clear();
      return;
    }

    // Identificamos los nombres de los módulos únicos implicados
    const modulosSeleccionados = this.actividades
      .filter(a => ids.includes(a.id))
      .map(a => a.modulo);

    const modulosUnicos = [...new Set(modulosSeleccionados)];
    
    // Mantenemos el estado de los checkboxes actuales para no resetearlos al añadir/quitar actividades
    const estadosActuales = new Map<string, boolean>();
    
    // Si hay revisiones previamente cargadas desde el backend, las sembramos primero
    if (revisionesCargadas && revisionesCargadas.length > 0) {
      revisionesCargadas.forEach(rev => {
        estadosActuales.set(rev.modulo, rev.revisado);
      });
    }

    // También mantenemos el estado de los checkboxes en pantalla si ya existen controles en el FormArray
    this.revisionesModulosArray.controls.forEach(ctrl => {
      const val = ctrl.value;
      estadosActuales.set(val.modulo, val.revisado);
    });

    // Reconstruimos el FormArray con los módulos únicos detectados
    this.revisionesModulosArray.clear();
    modulosUnicos.forEach(mod => {
      const grupo = this.fb.group({
        modulo: [mod],
        revisado: [estadosActuales.get(mod) || false]
      });
      if (this.esAlumno) {
        grupo.disable();
      }
      this.revisionesModulosArray.push(grupo);
    });
  }

  /**
   * Getter para acceder fácilmente al FormArray de revisiones desde el HTML.
   */
  get revisionesModulosArray(): FormArray {
    return this.tareaForm.get('revisionesModulos') as FormArray;
  }

  /**
   * Devuelve los objetos ActividadDTO completos de las seleccionadas en el formulario.
   */
  getActividadesSeleccionadas(): ActividadDTO[] {
    const ids = this.tareaForm.get('actividadesSeleccionadas')?.value as number[];
    return this.actividades.filter(a => ids?.includes(a.id));
  }

  /**
   * Permite añadir o quitar una actividad individualmente desde los badges de la UI.
   */
  toggleActividad(id: number): void {
    const seleccionadas = this.tareaForm.get('actividadesSeleccionadas')?.value as number[];
    const index = seleccionadas.indexOf(id);
    if (index > -1) {
      seleccionadas.splice(index, 1);
    } else {
      seleccionadas.push(id);
    }
    const nuevasSeleccionadas = [...seleccionadas];
    this.tareaForm.get('actividadesSeleccionadas')?.setValue(nuevasSeleccionadas);
    this.actualizarRevisionesModulos(nuevasSeleccionadas);
  }

  /**
   * Persistencia de Datos
   * Llama al servicio para Crear o Actualizar la tarea actual.
   */
  guardar(): void {
    if (this.tareaForm.valid) {
      const datos = { 
        ...this.tareaForm.getRawValue(),
        id: this.idTarea,
        idAlumno: this.idAlumno
      };

      if (this.esEdicion) {
        this.tareasService.updateTarea(datos).subscribe(() => {
          this.alertService.exito('Tarea actualizada', 'La tarea se ha guardado correctamente.');
          this.volver();
        });
      } else {
        this.tareasService.createTarea(datos).subscribe(() => {
          this.alertService.exito('Tarea registrada', 'La tarea se ha creado correctamente.');
          this.volver();
        });
      }
    } else {
      this.alertService.advertencia('Formulario no válido', 'Por favor, completa los campos obligatorios antes de continuar.');
    }
  }

  /**
   * Navegación hacia atrás.
   */
  volver(): void {
    this.location.back();
  }
}
