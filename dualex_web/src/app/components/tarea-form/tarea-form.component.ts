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
import { ModulosService } from '../../services/modulos.service';
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
  private modulosService = inject(ModulosService);
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
  esProfesor = false;                   // Flag para identificar si es un profesor/coordinador
  modulosTutor: any[] = [];             // Listado de módulos que imparte el profesor
  tareaBloqueada = false;               // Flag para saber si la tarea está bloqueada
  codigoTarea = '';                     // Código auto-generado de la tarea
  adjuntos: File[] = [];                // Lista de archivos adjuntos a la tarea

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
    const user = this.authService.currentUserValue;
    this.esAlumno = user?.rol === 'ALUMNO';
    this.esProfesor = user?.rol === 'PROFESOR' || user?.rol === 'COORDINADOR';
    this.crearFormulario();
    this.cargarActividades(); // Cargamos el catálogo para mapear IDs a Títulos

    if (this.esProfesor && user?.email) {
      this.modulosService.getModulosProfesor(user.email).subscribe(mods => {
        this.modulosTutor = mods || [];
        this.actualizarControlesPorTutor();
      });
    }

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
        // Aplicamos la lógica de bloqueo y permisos
        this.aplicarBloqueos(tarea);
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
   * Comprueba si un módulo (por nombre o siglas) pertenece al profesor actual.
   */
  perteneceAlTutor(nombreModulo: string): boolean {
    if (!this.esProfesor) return true;
    return this.modulosTutor.some(m =>
      m.nombre?.toLowerCase() === nombreModulo.toLowerCase() ||
      m.sigla?.toLowerCase() === nombreModulo.toLowerCase()
    );
  }

  /**
   * Recorre la lista de controles de revisión y deshabilita los que no pertenecen al tutor.
   */
  actualizarControlesPorTutor(): void {
    if (!this.esProfesor) return;
    this.revisionesModulosArray.controls.forEach(ctrl => {
      const modName = ctrl.get('modulo')?.value;
      if (modName && !this.perteneceAlTutor(modName)) {
        ctrl.disable({ emitEvent: false });
      } else {
        if (!this.esAlumno) {
          ctrl.enable({ emitEvent: false });
        }
      }
    });
  }

  /**
   * Comprueba si la tarea debe bloquearse según las reglas del negocio:
   * - Si está totalmente revisada (todas las revisiones de módulos están en 'true')
   * - O si se ha superado la fecha límite (fechaFin).
   */
  checkBloqueada(tarea: Tarea): boolean {
    if (!tarea) return false;

    // 1. Revisada por completo
    const revisada = !!tarea.revisadoProfesor;

    // 2. Pasada de fecha
    let pasadaFecha = false;
    if (tarea.fechaFin) {
      const fechaFinDate = new Date(tarea.fechaFin);
      fechaFinDate.setHours(23, 59, 59, 999);
      pasadaFecha = new Date() > fechaFinDate;
    }

    return revisada || pasadaFecha;
  }

  /**
   * Comprueba si el usuario actual tiene permisos para modificar la sección
   * de actividades relacionadas.
   */
  puedoEditarActividades(): boolean {
    if (this.esAlumno) {
      return !this.tareaBloqueada;
    }
    return true;
  }

  /**
   * Aplica la lógica de bloqueo sobre los controles del formulario según el rol y estado.
   */
  aplicarBloqueos(tarea: Tarea): void {
    this.tareaBloqueada = this.checkBloqueada(tarea);

    if (this.tareaBloqueada) {
      if (this.esAlumno) {
        // Alumno: bloqueado absoluto
        this.tareaForm.disable();
      } else if (this.esProfesor) {
        // Profesor: bloquea campos generales y de empresa, permitiendo solo su evaluación y actividades
        this.tareaForm.get('titulo')?.disable();
        this.tareaForm.get('fechaIni')?.disable();
        this.tareaForm.get('fechaFin')?.disable();
        this.tareaForm.get('descripcion')?.disable();
        this.tareaForm.get('evaluacionEmpresa')?.disable();
        this.tareaForm.get('comentarioEmpresa')?.disable();

        // Habilita comentarios y módulos de su competencia
        this.tareaForm.get('comentarioProfesor')?.enable();
        this.actualizarControlesPorTutor();
      }
    } else {
      // Tarea no bloqueada: comportamiento estándar
      if (this.esAlumno) {
        this.tareaForm.get('comentarioProfesor')?.disable();
        this.revisionesModulosArray.disable();
      } else {
        this.tareaForm.enable();
        this.actualizarControlesPorTutor();
      }
    }
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
    const modulosSeleccionados: string[] = [];
    this.actividades
      .filter(a => ids.includes(a.id))
      .forEach(a => {
        if (a.modulo) {
          a.modulo.split(',').forEach(m => {
            const trimmed = m.trim();
            if (trimmed && trimmed !== 'Sin módulos') {
              modulosSeleccionados.push(trimmed);
            }
          });
        }
      });

    const modulosUnicos = [...new Set(modulosSeleccionados)];

    // Mantenemos el estado de los checkboxes y comentarios actuales para no resetearlos al añadir/quitar actividades
    const estadosActuales = new Map<string, boolean>();
    const comentariosActuales = new Map<string, string>();

    // Si hay revisiones previamente cargadas desde el backend, las sembramos primero
    if (revisionesCargadas && revisionesCargadas.length > 0) {
      revisionesCargadas.forEach(rev => {
        estadosActuales.set(rev.modulo, rev.revisado);
        comentariosActuales.set(rev.modulo, rev.comentario || '');
      });
    }

    // También mantenemos el estado de los checkboxes y comentarios en pantalla si ya existen controles en el FormArray
    this.revisionesModulosArray.controls.forEach(ctrl => {
      const val = ctrl.value;
      estadosActuales.set(val.modulo, val.revisado);
      comentariosActuales.set(val.modulo, val.comentario || '');
    });

    // Reconstruimos el FormArray con los módulos únicos detectados
    this.revisionesModulosArray.clear();
    modulosUnicos.forEach(mod => {
      const grupo = this.fb.group({
        modulo: [mod],
        revisado: [estadosActuales.get(mod) || false],
        comentario: [comentariosActuales.get(mod) || '']
      });

      let disableControl = false;
      if (this.esAlumno) {
        disableControl = true;
      } else if (this.esProfesor) {
        if (!this.perteneceAlTutor(mod)) {
          disableControl = true;
        }
      }

      if (disableControl) {
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
    if (this.idAlumno) {
      this.router.navigate(['/tareas', this.idAlumno]);
    } else {
      this.router.navigate(['/tareas']);
    }
  }

  // ─── Gestión de Adjuntos ──────────────────────────────────────────────────

  /**
   * Se ejecuta cuando el usuario selecciona archivos con el input nativo.
   */
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.agregarArchivos(Array.from(input.files));
      // Resetear input para permitir re-seleccionar el mismo archivo
      input.value = '';
    }
  }

  /**
   * Se ejecuta cuando el usuario arrastra y suelta archivos en la zona de drop.
   */
  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.agregarArchivos(Array.from(event.dataTransfer.files));
    }
  }

  /**
   * Añade archivos a la lista de adjuntos, validando tamaño y evitando duplicados.
   */
  private agregarArchivos(archivos: File[]): void {
    const MAX_SIZE_MB = 20;
    archivos.forEach(archivo => {
      const yaExiste = this.adjuntos.some(a => a.name === archivo.name && a.size === archivo.size);
      if (yaExiste) return;
      if (archivo.size > MAX_SIZE_MB * 1024 * 1024) {
        this.alertService.advertencia(
          'Archivo demasiado grande',
          `"${archivo.name}" supera el límite de ${MAX_SIZE_MB} MB.`
        );
        return;
      }
      this.adjuntos.push(archivo);
    });
  }

  /**
   * Elimina un archivo adjunto por su índice.
   */
  eliminarAdjunto(index: number): void {
    this.adjuntos.splice(index, 1);
  }

  /**
   * Devuelve la clase CSS del icono según la extensión del archivo.
   */
  getAdjuntoIconClass(nombre: string): string {
    const ext = nombre.split('.').pop()?.toLowerCase() ?? '';
    if (['pdf'].includes(ext))                        return 'adjunto-icon--pdf';
    if (['doc', 'docx'].includes(ext))               return 'adjunto-icon--word';
    if (['xls', 'xlsx'].includes(ext))               return 'adjunto-icon--excel';
    if (['ppt', 'pptx'].includes(ext))               return 'adjunto-icon--ppt';
    if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return 'adjunto-icon--img';
    if (['zip', 'rar', '7z'].includes(ext))          return 'adjunto-icon--zip';
    return 'adjunto-icon--generic';
  }

  /**
   * Devuelve la clase del icono Font Awesome según la extensión del archivo.
   */
  getAdjuntoIcon(nombre: string): string {
    const ext = nombre.split('.').pop()?.toLowerCase() ?? '';
    if (['pdf'].includes(ext))                        return 'fa-solid fa-file-pdf';
    if (['doc', 'docx'].includes(ext))               return 'fa-solid fa-file-word';
    if (['xls', 'xlsx'].includes(ext))               return 'fa-solid fa-file-excel';
    if (['ppt', 'pptx'].includes(ext))               return 'fa-solid fa-file-powerpoint';
    if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return 'fa-solid fa-file-image';
    if (['zip', 'rar', '7z'].includes(ext))          return 'fa-solid fa-file-zipper';
    if (['txt'].includes(ext))                        return 'fa-solid fa-file-lines';
    return 'fa-solid fa-file';
  }

  /**
   * Formatea el tamaño de un archivo en bytes a una representación legible.
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
