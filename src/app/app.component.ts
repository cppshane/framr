import { Component, ElementRef, ViewChild } from '@angular/core';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @ViewChild('WidthInput') widthInput?: HTMLInputElement;
  @ViewChild('HeightInput') heightInput?: HTMLInputElement;
  @ViewChild('ConsoleTextArea') consoleTextArea?: ElementRef;

  ffmpeg: any;
  canvas?: HTMLCanvasElement | null;
  context?: CanvasRenderingContext2D | null;
  log = '';
  
  constructor() {
    this.ffmpeg = createFFmpeg({ log: true });
    this.ffmpeg.setLogger((log: any) => {
      this.logMessage(log.message);
    });
  }

  ngAfterViewInit() {
    if (!this.canvas) {
      this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
      this.context = this.canvas?.getContext('2d');

      if (this.context) {
        this.context.canvas.width = 1920;
        this.context.canvas.height = 1080;

        this.context.rect(60, 34, 1800, 1012);
        this.context.shadowColor = '#898';
        this.context.shadowBlur = 20;
        this.context.shadowOffsetX = 20;
        this.context.shadowOffsetY = 20;
        this.context.fill();
      }
    }


  }

  logMessage(message: string) {
    this.log += message + '\n';

    if (this.consoleTextArea) {
      this.consoleTextArea.nativeElement.scrollTo(0, this.consoleTextArea.nativeElement.scrollHeight);
    }
  }

  async uploadFile(event: Event) {
    if (!this.canvas) {
      this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
      this.context = this.canvas?.getContext('2d');

      if (this.context) {
        this.context.canvas.width = 1920;
        this.context.canvas.height = 1080;

        this.context.rect(25, 25, 100, 100);
        this.context.shadowColor = '#898';
        this.context.shadowBlur = 20;
        this.context.shadowOffsetX = 20;
        this.context.shadowOffsetY = 20;
        this.context.fill();
      }
    }

    const element = event.currentTarget as HTMLInputElement;
    let files = element.files;

    if (files && files.length > 0) {
      const { name } = files[0];

      if (!this.ffmpeg.isLoaded()) {
        await this.ffmpeg.load();
      }

      if (this.canvas) {
        var buffer = Buffer.from((this.canvas.toDataURL().split(';base64,')[1]), 'base64');

        this.ffmpeg.FS('writeFile', name, await fetchFile(files[0]));
        this.ffmpeg.FS('writeFile', 'shadow.png', buffer);

        await this.ffmpeg.run('-i', name, '-vf', 'scale=1800:1012', '-preset', 'slow', '-crf', '18', 'inner-clip.mp4');
        await this.ffmpeg.run('-i', name, '-vf', 'boxblur=30', '-c:a', 'copy', 'outer-clip.mp4');
        await this.ffmpeg.run('-i', 'outer-clip.mp4', '-i', 'shadow.png', '-filter_complex', 'overlay', 'shadow-clip.mp4');
        await this.ffmpeg.run('-i', 'shadow-clip.mp4', '-i', 'inner-clip.mp4', '-filter_complex', 'overlay=60:34', 'output.mp4');

        const data = this.ffmpeg.FS('readFile', 'output.mp4');

        this.downloadBlob(new Blob([data.buffer], { type: 'video/mp4' }), 'file.mp4');
      }
    }
  }

  downloadBlob(blob: Blob, name: string) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    a.remove();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    let files = event?.dataTransfer?.files[0];
  }

  async processFiles(files: FileList) {
    this.log += 'Uploaded ' + files.length + ' files\n';

    if (!this.canvas) {
      this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
      this.context = this.canvas?.getContext('2d');

      if (this.context) {
        this.context.canvas.width = 1920;
        this.context.canvas.height = 1080;

        this.context.rect(25, 25, 100, 100);
        this.context.shadowColor = '#898';
        this.context.shadowBlur = 20;
        this.context.shadowOffsetX = 20;
        this.context.shadowOffsetY = 20;
        this.context.fill();
      }
    }

    if (files && files.length > 0) {
      const { name } = files[0];

      if (!this.ffmpeg.isLoaded()) {
        await this.ffmpeg.load();
      }

      if (this.canvas) {
        var buffer = Buffer.from((this.canvas.toDataURL().split(';base64,')[1]), 'base64');

        this.ffmpeg.FS('writeFile', name, await fetchFile(files[0]));
        this.ffmpeg.FS('writeFile', 'shadow.png', buffer);

        await this.ffmpeg.run('-i', name, '-vf', 'scale=1800:1012', '-preset', 'slow', '-crf', '18', 'inner-clip.mp4');
        await this.ffmpeg.run('-i', name, '-vf', 'boxblur=30', '-c:a', 'copy', 'outer-clip.mp4');
        await this.ffmpeg.run('-i', 'outer-clip.mp4', '-i', 'shadow.png', '-filter_complex', 'overlay', 'shadow-clip.mp4');
        await this.ffmpeg.run('-i', 'shadow-clip.mp4', '-i', 'inner-clip.mp4', '-filter_complex', 'overlay=60:34', 'output.mp4');

        const data = this.ffmpeg.FS('readFile', 'output.mp4');

        this.downloadBlob(new Blob([data.buffer], { type: 'video/mp4' }), 'file.mp4');
      }
    }
  }

  openFileSelector() {
    var input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('multiple', '');
    input.onchange = async () => {
      if (input.files != null) {
        await this.processFiles(input.files);
      }
      else {
        this.logMessage('Something is wrong, idk');
        return;
      }
    };

    input.click();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }
}
