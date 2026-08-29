import 'server-only';
import { createCanvas } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { join } from 'node:path';

const standardFontDataUrl=`${join(process.cwd(),'node_modules','pdfjs-dist','standard_fonts')}/`;

export async function renderPdfPage(bytes:ArrayBuffer,pageNumber:number,maximumWidth=1440):Promise<Buffer>{const loading=getDocument({data:new Uint8Array(bytes),standardFontDataUrl});const document=await loading.promise;try{if(pageNumber<1||pageNumber>document.numPages)throw new Error('PDF page was not found.');const page=await document.getPage(pageNumber);const base=page.getViewport({scale:1});const scale=Math.min(2,maximumWidth/base.width);const viewport=page.getViewport({scale});const canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));await page.render({canvasContext:canvas.getContext('2d') as never,viewport,canvas:canvas as never}).promise;return canvas.toBuffer('image/png');}finally{await loading.destroy();}}
