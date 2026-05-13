import { Component, Input, Output, EventEmitter, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTablesModule, DataTableDirective } from 'angular-datatables';
import { Config } from 'datatables.net';

@Component({
  selector: 'app-shared-datatable',
  standalone: true,
  imports: [CommonModule, DataTablesModule],
  templateUrl: './datatable.component.html',
  styleUrls: ['./datatable.component.css']
})
export class DatatableComponent implements AfterViewInit, OnDestroy {
  @Input() dtOptions: Config = {};
  @Input() columnTitles: string[] = [];
  @Input() tableId: string = 'shared-table-' + Math.floor(Math.random() * 10000);
  
  @Output() actionClick = new EventEmitter<{ action: string, data: any }>();

  @ViewChild(DataTableDirective, { static: false })
  dtElement!: DataTableDirective;

  ngAfterViewInit(): void {
    // Esperamos un momento para que DataTables pinte el DOM antes de enganchar eventos.
    setTimeout(() => {
      this.configurarOyentes();
    }, 500);
  }

  ngOnDestroy(): void {
    // Desenganchamos el listener de jQuery para evitar fugas de memoria.
    if (typeof $ !== 'undefined') {
      $(`#${this.tableId}`).off('click');
    }
  }

  private configurarOyentes(): void {
    if (typeof $ === 'undefined') return;

    // Solo escuchamos acciones marcadas con data-action para no interferir con el resto de la tabla.
    $(`#${this.tableId}`).off('click').on('click', '[data-action]', (event: any) => {
      const action = $(event.currentTarget).data('action');
      
      this.dtElement.dtInstance.then((dtInstance: any) => {
        // Tomamos la fila pulsada y reenviamos la acción al componente padre.
        const rowData = dtInstance.row($(event.currentTarget).parents('tr')).data();
        
        this.actionClick.emit({ action, data: rowData });
      });
    });
  }

  /**
   * Fuerza el repintado de la tabla y la recarga de datos desde el servidor.
   * @param mantenerPagina Si es true, se mantiene la página actual de la tabla.
   */
  refrescar(mantenerPagina: boolean = true): void {
    if (this.dtElement && this.dtElement.dtInstance) {
      this.dtElement.dtInstance.then((dtInstance: any) => {
        // null como primer argumento para usar la misma URL/datos de ajax
        // false como segundo argumento para mantener la paginación actual
        dtInstance.ajax.reload(null, !mantenerPagina);
      });
    }
  }
}
