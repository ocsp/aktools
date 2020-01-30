import { Component, OnInit, ElementRef } from '@angular/core';
import { MdcSnackbarService } from '@blox/material';
import { FetchService } from '../fetch.service';
import { Router } from '@angular/router';
import { MaterialInfo } from '../model/materialinfo';
import { Content } from '@angular/compiler/src/render3/r3_ast';
@Component({
    selector: 'app-auto-detect',
    templateUrl: './auto-detect-hash.component.html',
    styleUrls: ['./auto-detect-hash.component.scss']
})
export class AutoDetectHashComponent implements OnInit {
    // tslint:disable: all
    ImageElement: HTMLImageElement;
    ImageLoaded: boolean;
    Canvas: HTMLCanvasElement;
    Ctx: CanvasRenderingContext2D;
    ImageData: ImageData;
    worker: Worker;
    InfoText: "等待处理";
    progress: 0;
    XBound: [];
    YBound: [];
    ItemImages = [];
    NumberImage
    constructor(private fetchService: FetchService, private snackbar: MdcSnackbarService, private router: Router, private el: ElementRef) {
    }

    async ngOnInit() {
        this.ImageElement = document.createElement('img');
        this.Canvas = this.el.nativeElement.getElementsByTagName('canvas')[0];
        this.Ctx = this.Canvas.getContext('2d');
        this.onPasteImage();
        this.registerWorker()
    }
    choiceImage(event) {
        const ImageContainer = event.target;
        const Reader = new FileReader();
        Reader.onload = e => {
            this.LoadImage(Reader.result.toString());
        };
        Reader.readAsDataURL(ImageContainer.files[0]);
    }
    onPasteImage() {
        document.addEventListener('paste', event => {
            const items = event.clipboardData && event.clipboardData.items;
            if (items && items.length) {
                if (items[0].type.indexOf('image') !== -1) {
                    const file = items[0].getAsFile();
                    const Reader = new FileReader();
                    Reader.onload = e => {
                        this.LoadImage(Reader.result.toString());
                    };
                    Reader.readAsDataURL(file);
                }
            }
        });
    }
    LoadImage(src: string) {
        this.ImageElement.onload = e => {
            this.ImageLoaded = true;
            this.Canvas.width = this.ImageElement.width;
            this.Canvas.height = this.ImageElement.height;
            this.Ctx.drawImage(this.ImageElement, 0, 0);
        };
        this.ImageElement.src = src;
    }
    registerWorker() {
        this.worker = new Worker('./detect.worker', { type: "module" });
        this.worker.onmessage = this.MessageDeal.bind(this)
    }
    objectRegonition() {
        this.worker.postMessage({ method: "ImageDataLoad", data: this.Ctx.getImageData(0, 0, this.Canvas.width, this.Canvas.height) });
    }
    MessageDeal(message: MessageEvent) {
        switch (message.data.method) {
            case "status":
                this.InfoText = message.data.text;
                this.progress = message.data.progress;
                break;
            case "clipImage":
                this.XBound = message.data.XBound;
                this.YBound = message.data.YBound;
                console.log(message.data);
                let ImageDatas = [];
                for (let y = 0; y < this.YBound.length; y++) {
                    for (let x = 0; x < this.XBound.length; x++) {
                        let Canvas = document.createElement("canvas");
                        Canvas.width = this.XBound[x][1] - this.XBound[x][0];
                        Canvas.height = this.YBound[y][1] - this.YBound[y][0];
                        let ctx = Canvas.getContext("2d");
                        ctx.drawImage(this.ImageElement, this.XBound[x][0], this.YBound[y][0], Canvas.width, Canvas.height, 0, 0, Canvas.width, Canvas.height);
                        this.ItemImages.push(Canvas);
                        let DhashCanvas=document.createElement("canvas");
                        DhashCanvas.width=13
                        DhashCanvas.height=12;
                        let DhashCtx=DhashCanvas.getContext('2d');
                        DhashCtx.drawImage(Canvas,0,0,Canvas.width, Canvas.height,0,0,DhashCanvas.width,DhashCanvas.height);
                        ImageDatas.push(DhashCtx.getImageData(0,0,DhashCanvas.width,DhashCanvas.height));
                        this.Ctx.strokeRect(this.XBound[x][0], this.YBound[y][0], Canvas.width, Canvas.height);
                    }
                }
                this.worker.postMessage({method:"calcDhash",ImageDatas:ImageDatas})
                break;
            case "getNumberData":
                let NumberTop=0.705;
                let NumberHeight=0.235;
                for (let y = 0; y < this.YBound.length; y++) {
                    for (let x = 0; x < this.XBound.length; x++) {
                        let Canvas = document.createElement("canvas");
                        Canvas.width = this.XBound[x][1] - this.XBound[x][0];
                        Canvas.height = (this.YBound[y][1] - this.YBound[y][0]) * NumberHeight;
                        let ctx = Canvas.getContext("2d");
                        ctx.drawImage(this.ImageElement, this.XBound[x][0], this.YBound[y][0]+(this.YBound[y][1] - this.YBound[y][0])*NumberTop, Canvas.width, Canvas.height, 0, 0, Canvas.width, Canvas.height);

                    }
                }
            }
    }
}