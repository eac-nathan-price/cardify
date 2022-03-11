import { Component, ElementRef, ViewChild } from '@angular/core';
import { NgxFileDropEntry, FileSystemFileEntry, FileSystemDirectoryEntry } from 'ngx-file-drop';
import * as XLSX from 'xlsx';
//import * as FS from 'file-saver';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @ViewChild('canvas') canvasElement!: ElementRef<HTMLCanvasElement>;

  public files: NgxFileDropEntry[] = [];
  public workbook?: XLSX.WorkBook;
  public sheetName:string = '';
  public startRow = 2;
  public XLSX = XLSX;
  public sheet:any;
  public outputs = ['Tabletop']
  public selectedOutput = 'Tabletop';

  public cardsPerRow = 10;
  public cardsPerCol = 7;
  public cardWidthIn = 2.5;
  public cardHeightIn = 3.5;
  public cardPPI = 85;
  public showResult = false;

  public title = 'Name';
  public subtitle = 'Epithet (alt name)';
  public img = 'visual description';
  public flavor = 'flavor text';
  public slotl1 = 'Trait 1';
  public slotl2 = 'Trait 2';
  public slotr1 = 'Hate 1';
  public slotr2 = 'Hate 2';

  constructor() {
  }

  public dropped(files: NgxFileDropEntry[]) {
    this.files = files;
    for (const droppedFile of files) {
      // Is it a file?
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          // Is it a spreadsheet?
          if (file.type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.name.endsWith('.xlsx')) {
            let reader = new FileReader();
            reader.onload = ((e:ProgressEvent<FileReader>) => {
              // Parse data
              let binary = '', bytes = new Uint8Array(reader.result as ArrayBuffer);
              let length = bytes.byteLength;
              for (let i = 0; i < length; i++) binary += String.fromCharCode(bytes[i]);
              this.workbook = XLSX.read(binary, {type: 'binary', cellDates:true, cellStyles:true});
              
              console.log(this.workbook);
              this.sheetName = this.workbook?.SheetNames[0];
              this.setSheet();
            }).bind(this);
            reader.readAsArrayBuffer(file);
          }
        });
      } else {
        // It was a directory (empty directories are added, otherwise only files)
        const fileEntry = droppedFile.fileEntry as FileSystemDirectoryEntry;
        console.log(droppedFile.relativePath, fileEntry);
      }
    }
  }

  public fileOver(event:any){
    console.log(event);
  }

  public fileLeave(event:any){
    console.log(event);
  }

  public setSheet(): void {
    if (!this.workbook) return;
    this.sheet = XLSX.utils.sheet_to_json(this.workbook.Sheets[this.sheetName]);
    console.log(this.sheet);
  }

  public getProperties(): string[] {
    return Object.keys(this.sheet[this.startRow]);
  }

  public go(): void {
    this.showResult = true;
    let canvas = this.canvasElement.nativeElement;
    let ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = this.cardWidthIn * this.cardPPI, h = this.cardHeightIn * this.cardPPI, n = this.startRow;

    //background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';

    for (let j = 0; j < this.cardsPerCol; j++) {
      for (let i = 0; i < this.cardsPerRow; i++) {
        if (!this.sheet[n]) continue;
        let x = i * w, y = j * h, m = (i * w) + (w / 2);
        // border
        ctx.strokeRect(x, y, w, h);
        // title
        ctx.textAlign = 'center';
        ctx.font = '20px Roboto';
        ctx.fillText(this.sheet[n][this.title], m, y + 20, w - 10);
        // subtitle
        ctx.textAlign = 'center';
        ctx.font = '10px Roboto';
        ctx.fillText(this.sheet[n][this.subtitle], m, y + 30, w - 10);
        // description
        ctx.textAlign = 'center';
        ctx.font = '10px Roboto';
        ctx.fillText(this.sheet[n][this.img], m, y + (h/2) + 5, w - 10);
        // traits
        ctx.font = '15px Roboto';
        ctx.textAlign = 'left';
        ctx.fillText('+ ' + this.sheet[n][this.slotl1], x + 10, y + h - 50, (w / 2) - 10);
        ctx.fillText('+ ' + this.sheet[n][this.slotl2], x + 10, y + h - 30, (w / 2) - 10);
        ctx.textAlign = 'right';
        ctx.fillText(this.sheet[n][this.slotr1] + ' -', x + w - 10, y + h - 50, (w / 2) - 10);
        ctx.fillText(this.sheet[n][this.slotr2] + ' -', x + w - 10, y + h - 30, (w / 2) - 10);
        // flavor
        ctx.textAlign = 'center';
        ctx.font = '10px Roboto';
        ctx.fillText(this.sheet[n][this.flavor], m, y + h - 10, w - 10);
        // next card
        n++;
      }
    }
  }
}
