import { Component, ElementRef, ViewChild } from '@angular/core';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

class Video {
  File: File;
  Width: number;
  Height: number;

  constructor(file: File, width: number, height: number) {
    this.File = file;
    this.Width = width;
    this.Height = height;
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @ViewChild('ConsoleTextArea') consoleTextArea?: ElementRef;
  @ViewChild('Canvas') canvas?: ElementRef;
  @ViewChild('Video') video?: ElementRef;

  frameRatio = 0.9375;
  ffmpeg: any;
  log = '';
  consoleTextAreaElement?: HTMLTextAreaElement | null;
  canvasElement?: HTMLCanvasElement | null;
  videoElement?: HTMLVideoElement | null;
  context?: CanvasRenderingContext2D | null;
  
  constructor() {
    this.ffmpeg = createFFmpeg({ log: true });
    this.ffmpeg.setLogger((log: any) => {
      this.logMessage(log.message);
    });
  }

  ngAfterViewInit() {
    this.consoleTextAreaElement = this.consoleTextArea?.nativeElement;
    this.canvasElement = this.canvas?.nativeElement;
    this.videoElement = this.video?.nativeElement;

    if (this.canvasElement) {
      this.context = this.canvasElement.getContext('2d');
    }
  }

  logMessage(message: string) {
    this.log += message + '\n';

    if (!this.consoleTextAreaElement) {
      return;
    }
    
    this.consoleTextAreaElement.scrollTo(0, this.consoleTextAreaElement.scrollHeight);
  }

  /*async uploadFile(event: Event) {

    
    if (!this.canvas) {
      this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
      this.context = this.canvas?.getContext('2d');

      if (this.context) {
        this.context.canvas.width = 1920;
        this.context.canvas.height = 1080;

        this.context.rect(25, 25, 100, 100);
        this.context.shadowColor = '#000000';
        this.context.shadowBlur = 20;
        this.context.shadowOffsetX = 20;
        this.context.shadowOffsetY = 20;
        this.context.fill();
      }
    }

    const element = event.currentTarget as HTMLInputElement;
    const files = element.files;

    if (files) {
      
      // Gather file data
      for (let i = 0; i < files.length; i++) {
        const { name } = files[i];


      }
    }

    if (files && files.length > 0) {

      

      if (!this.ffmpeg.isLoaded()) {
        await this.ffmpeg.load();
      }

      if (this.canvas) {
        var buffer = Buffer.from((this.canvas.toDataURL().split(';base64,')[1]), 'base64');

        this.ffmpeg.FS('writeFile', name, await fetchFile(files[0]));
        this.ffmpeg.FS('writeFile', 'shadow.png', buffer);

        await this.ffmpeg.run('-i', name, '-vf', 'scale=iw*0.9375:-1', '-preset', 'slow', '-crf', '18', 'inner-clip.mp4');
        await this.ffmpeg.run('-i', name, '-vf', 'boxblur=30', '-c:a', 'copy', 'outer-clip.mp4');
        await this.ffmpeg.run('-i', 'outer-clip.mp4', '-i', 'shadow.png', '-filter_complex', 'overlay', 'shadow-clip.mp4');
        await this.ffmpeg.run('-i', 'shadow-clip.mp4', '-i', 'inner-clip.mp4', '-filter_complex', 'overlay=60:34', 'output.mp4');

        const data = this.ffmpeg.FS('readFile', 'output.mp4');

        this.downloadBlob(new Blob([data.buffer], { type: 'video/mp4' }), 'file.mp4');
      }
    }
  }*/

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
    if (!files || !this.canvasElement || !this.videoElement) {
      return;
    }

    this.logMessage('Uploaded ' + files.length + ' files, processing...');

    let videos = new Array<Video>();

    // Gather file data
    for (let i = 0; i < files.length; i++) {
      const { name } = files[i];

      this.videoElement.src = URL.createObjectURL(files[i]);

      let video : Video = await new Promise((resolve) => {
        if (this.videoElement) {
          this.videoElement.src = URL.createObjectURL(files[i]);
          this.videoElement.onloadedmetadata = () => resolve(new Video(files[i], this.videoElement?.videoWidth ?? 0, this.videoElement?.videoHeight ?? 0));
        }
      });
      videos.push(video);

      this.logMessage(video.File.name + ' - ' + video.Width + 'x' + video.Height);
    }

    for (let i = 0; i < videos.length; i++) {
      this.logMessage('Processing: ' + videos[i].File.name);
      await this.processVideo(videos[i]);
    }
  }

  async processVideo(video: Video) {
    if (!this.canvasElement || !this.context) {
      return;
    }

    // Ensure it is large enough to contain shadow
    this.context.canvas.width = video.Width;
    this.context.canvas.height = video.Height;
    
    // Clear canvas
    this.context.clearRect(0, 0, video.Width, video.Height);

    // Calculate shadow dimensions
    let innerWidth = video.Width * this.frameRatio;
    let innerHeight = video.Height * this.frameRatio;
    let x = (video.Width - innerWidth) / 2;
    let y = (video.Height - innerHeight) / 2;

    // Create shadow
    this.context.rect(x, y, innerWidth, innerHeight);
    this.context.shadowColor = '#000000';
    this.context.shadowBlur = 20;
    this.context.shadowOffsetX = 10;
    this.context.shadowOffsetY = 10;
    this.context.fill();

    // Load FFmpeg
    if (!this.ffmpeg.isLoaded()) {
      await this.ffmpeg.load();
    }

    // Save canvas image to FFmpeg
    var buffer = Buffer.from((this.canvasElement.toDataURL().split(';base64,')[1]), 'base64');
    this.ffmpeg.FS('writeFile', 'shadow.png', buffer);

    // Save video to FFmpeg
    this.ffmpeg.FS('writeFile', video.File.name, await fetchFile(video.File));

    // Begin processing
    let outputName = 'framed_' + video.File.name;
    await this.ffmpeg.run('-i', video.File.name, '-vf', 'scale=' + innerWidth + ':' + innerHeight, '-preset', 'slow', '-crf', '18', 'inner-clip.mp4');
    await this.ffmpeg.run('-i', video.File.name, '-vf', 'boxblur=30', '-c:a', 'copy', 'outer-clip.mp4');
    await this.ffmpeg.run('-i', 'outer-clip.mp4', '-i', 'shadow.png', '-filter_complex', 'overlay', 'shadow-clip.mp4');
    await this.ffmpeg.run('-i', 'shadow-clip.mp4', '-i', 'inner-clip.mp4', '-filter_complex', 'overlay=' + x + ':' + y, outputName);

    // Download result
    const data = this.ffmpeg.FS('readFile', outputName);
    this.downloadBlob(new Blob([data.buffer]), outputName);
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
