import { Component, ViewChild } from '@angular/core';
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  @ViewChild("WidthInput") widthInput?: HTMLInputElement;
  @ViewChild("HeightInput") heightInput?: HTMLInputElement;

  ffmpeg: any;
  canvas?: HTMLCanvasElement | null;
  context?: CanvasRenderingContext2D | null;
  
  constructor() {
    this.ffmpeg = createFFmpeg({ log: true });

  }

  ngAfterViewInit() {
    if (!this.canvas) {
      this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
      this.context = this.canvas?.getContext("2d");

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

  async uploadFile(event: Event) {
    if (!this.canvas) {
      this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
      this.context = this.canvas?.getContext("2d");

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

        this.downloadBlob(new Blob([data.buffer], { type: 'video/mp4' }));
      }
    }
  }

  downloadBlob(blob: Blob) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'file.mp4';
    a.click();
    //a.remove();
  }
}
