declare module 'quill-image-resize-module' {
  import { Quill } from 'quill';
  
  interface ImageResizeOptions {
    modules?: string[];
    handleStyles?: {
      [key: string]: string;
    };
  }
  
  class ImageResize {
    constructor(quill: Quill, options?: ImageResizeOptions);
  }
  
  export = ImageResize;
}