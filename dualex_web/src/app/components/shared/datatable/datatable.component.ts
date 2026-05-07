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
    // Retraso ligero para asegurar que DataTables ha renderizado el DOM
    setTimeout(() => {
      this.configurarOyentes();
    }, 500);
  }

  ngOnDestroy(): void {
    // Limpiar el evento de jQuery para evitar fugas de memoria
    if (typeof $ !== 'undefined') {
      $(`#${this.tableId}`).off('click');
    }
  }

  private configurarOyentes(): void {
    if (typeof $ === 'undefined') return;

    // Escuchar clics en cualquier elemento dentro de la tabla que tenga data-action
    $(`#${this.tableId}`).off('click').on('click', '[data-action]', (event: any) => {
      const action = $(event.currentTarget).data('action');
      
      this.dtElement.dtInstance.then((dtInstance: any) => {
        // Extraer los datos de la fila (tr) donde se hizo clic
        const rowData = dtInstance.row($(event.currentTarget).parents('tr')).data();
        
        // Emitir hacia Angular
        this.actionClick.emit({ action, data: rowData });
      });
    });
  }
}
