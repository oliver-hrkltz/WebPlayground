import { customElement, property, query } from 'lit/decorators.js';
import { html, css, LitElement, TemplateResult, CSSResult } from 'lit';


const SIZE = 512;


@customElement('drink-makr-2')
export class DrinkMark2Component extends LitElement {
    static override styles: CSSResult = css`
        canvas {
            width: '${SIZE}px';
            height: '${SIZE}px';
        }

        canvas#cup,
        canvas#shadow_overlay,
        canvas#reflection_overlay,
        canvas#texture,
        canvas#resultStep1,
        canvas#resultStep2,
        canvas#resultStep3,
        canvas#resultStep4 {
            display: none;
        }
    `;


    @query('#cup')
    private _cupElement?: HTMLCanvasElement;
    @query('#reflection_overlay')
    private _reflectionOverlayElement?: HTMLCanvasElement;
    @query('#shadow_overlay')
    private _shadowOverlayElement?: HTMLCanvasElement;
    @query('#texture')
    private _textureElement?: HTMLCanvasElement;
    @query('#resultStep1')
    private _resultStep1Element?: HTMLCanvasElement;
    @query('#resultStep2')
    private _resultStep2Element?: HTMLCanvasElement;
    @query('#resultStep3')
    private _resultStep3Element?: HTMLCanvasElement;
    @query('#resultStep4')
    private _resultStep4Element?: HTMLCanvasElement;
    @query('#result')
    private _resultElement?: HTMLCanvasElement;
    private _textureImg: HTMLImageElement = new Image();

    @property()
    public ip: String = '';


    override connectedCallback(): void {
        super.connectedCallback();

        // TODO: https://graffino.com/til/hEvDjQa4au-how-to-import-images-in-typescript
        const cupImg = new Image();
        cupImg.src = 'assets/glass/body2.png'
        cupImg.onload = () => {
            this._cupElement!.getContext('2d')!.drawImage(cupImg, 0, 0, SIZE, SIZE);

            const shadowOverlay = new Image();
            shadowOverlay.src = 'assets/glass/ShadowOverlay.png'
            shadowOverlay.onload = () => {
                this._shadowOverlayElement!.getContext('2d')!.drawImage(shadowOverlay, 0, 0, SIZE, SIZE);

                const reflectionOverlayImg = new Image();
                reflectionOverlayImg.src = 'assets/glass/ReflectionOverlay.png'
                reflectionOverlayImg.onload = () => {
                    this._reflectionOverlayElement!.getContext('2d')!.drawImage(reflectionOverlayImg, 0, 0, SIZE, SIZE);

                    // TODO: Drag&Drop instead of load.
                    this._textureImg = new Image();
                    this._textureImg.src = 'assets/texture/latte_macchiato2.png'
                    this._textureImg.onload = () => {
                        this._textureElement!.getContext('2d')!.drawImage(this._textureImg, 0, 0, SIZE, SIZE);
                        this._step1MapTextureToIngredientArea();
                        this._step2WarpMappedTexture();
                        this._step3ShadowOverlay();
                        this._step4OverlayWarpedTexture();
                        this._step5MergeOverlayAndCup();
                    }
                }
            }
        }
    }


    private _step1MapTextureToIngredientArea() {
        const imgA = this._reflectionOverlayElement?.getContext('2d')!.getImageData(0, 0, SIZE, SIZE)!;
        let x1 = SIZE;
        let x2 = 0;
        let y1 = 0;
        let y2 = 0;

        for (var i = 0; i < imgA.data.length; i = i + 4) {
            if (imgA.data[i + 3] > 0) {
                y1 = Math.floor((i / 4) / SIZE);
                break;
            }
        }

        for (var i = imgA.data.length; i > 0; i = i - 4) {
            if (imgA.data[i + 3] > 0) {
                y2 = Math.floor((i / 4) / SIZE);
                break;
            }
        }

        let temp = 0;

        for (var i = 0; i < imgA.data.length; i = i + 4) {
            if (imgA.data[i + 3] > 0) {
                temp = ((i / 4) % SIZE);
                if (temp % SIZE < x1) {
                    x1 = temp;
                }
            }
        }

        for (var i = imgA.data.length; i > 0; i = i - 4) {
            if (imgA.data[i + 3] > 0) {
                temp = ((i / 4) % SIZE);
                if (temp % SIZE > x2) {
                    x2 = temp;
                }
            }
        }

        let width = x2 - x1;
        let height = y2 - y1;
        this._resultStep1Element?.getContext('2d')!.drawImage(this._textureImg, x1, y1, width, height)
    }


    private _step2WarpMappedTexture() {
        const imgA = this._resultStep1Element!.getContext('2d')!.getImageData(0, 0, SIZE, SIZE);
        const imgResult = this._resultStep1Element!.getContext('2d')!.getImageData(0, 0, SIZE, SIZE);

        for (let i = 0; i < imgResult.data.length; i += 4) {
            // Don't override visible top with empty part.
            if (imgA.data[i + 3] == 0) {
                continue;
            }

            const x = (i / 4) % SIZE;
            const y = Math.floor((i / 4) / SIZE);
            // Warp function. Sinus over x with an amplitude of 30. Move it up by 30/2 to avoid gap in the top.
            // Note: Factor needs to be adjusted to SIZE.
            let newY = y + Math.floor(Math.sin((x / SIZE) * Math.PI) * 70) - 50;
            let targetI = ((((newY) * SIZE) + (x)) * 4)
            imgResult.data[targetI + 0] = imgA.data[i + 0];
            imgResult.data[targetI + 1] = imgA.data[i + 1];
            imgResult.data[targetI + 2] = imgA.data[i + 2];
            imgResult.data[targetI + 3] = imgA.data[i + 3];
        }

        this._resultStep2Element!.getContext('2d')!.putImageData(imgResult, 0, 0, 0, 0, SIZE, SIZE);
    }


    // Note: The darkness amount will be limited to 150.
    private _step3ShadowOverlay() {
        const imgA = this._shadowOverlayElement?.getContext('2d')!.getImageData(0, 0, SIZE, SIZE)!;
        const imgC = this._resultStep2Element?.getContext('2d')!.getImageData(0, 0, SIZE, SIZE)!;

        for (var i = 0; i < imgC.data.length; i += 4) {
            if (imgA.data[i + 3] == 0) {
                continue;
            }

            imgC.data[i + 0] -= (150 - (((imgA.data[i + 0]) / 255) * 150));
            imgC.data[i + 1] -= (150 - (((imgA.data[i + 1]) / 255) * 150));
            imgC.data[i + 2] -= (150 - (((imgA.data[i + 2]) / 255) * 150));
        }

        this._resultStep3Element?.getContext('2d')!.putImageData(imgC, 0, 0, 0, 0, SIZE, SIZE);
    }


    // 4.Step: Overlay & Mask the texture with reflection.
    //         Note: The brightness amount will be limited to 50.
    private _step4OverlayWarpedTexture() {
        const imgA = this._reflectionOverlayElement?.getContext('2d')!.getImageData(0, 0, SIZE, SIZE)!;
        const imgC = this._resultStep3Element?.getContext('2d')!.getImageData(0, 0, SIZE, SIZE)!;

        for (var i = 0; i < imgC.data.length; i += 4) {
            imgC.data[i + 0] += (((imgA.data[i + 0]) / 255) * 50);
            imgC.data[i + 1] += (((imgA.data[i + 1]) / 255) * 50);
            imgC.data[i + 2] += (((imgA.data[i + 2]) / 255) * 50);
            imgC.data[i + 3] = imgA.data[i + 3];
        }

        this._resultStep4Element?.getContext('2d')!.putImageData(imgC, 0, 0, 0, 0, SIZE, SIZE);
    }


    // 5.Step: Draw resultStep4 over cup to gernate the final image.
    private _step5MergeOverlayAndCup() {
        const imgA = this._resultStep4Element?.getContext('2d')!.getImageData(0, 0, SIZE, SIZE)!;
        const imgResult = this._cupElement?.getContext('2d')!.getImageData(0, 0, SIZE, SIZE)!;

        for (var i = 0; i < imgResult.data.length; i += 4) {
            if (imgA.data[i + 3] > 240) {
                imgResult.data[i + 0] = imgA.data[i + 0];
                imgResult.data[i + 1] = imgA.data[i + 1];
                imgResult.data[i + 2] = imgA.data[i + 2];
                imgResult.data[i + 3] = imgA.data[i + 3];
            }
        }

        this._resultElement!.getContext('2d')!.putImageData(imgResult, 0, 0, 0, 0, SIZE, SIZE);
    }


    override disconnectedCallback() {
        super.disconnectedCallback();
    }


    override render(): TemplateResult {
        return html`
            <canvas
            id="cup"
            width="${SIZE}"
            height="${SIZE}"></canvas>
            <canvas
            id="shadow_overlay"
            width="${SIZE}"
            height="${SIZE}"></canvas>
            <canvas
            id="reflection_overlay"
            width="${SIZE}"
            height="${SIZE}"></canvas>
            <canvas
            id="texture"
            width="${SIZE}"
            height="${SIZE}"></canvas><br/>
            <canvas
            id="resultStep1"
            width="${SIZE}"
            height="${SIZE}"></canvas>
            <canvas
            id="resultStep2"
            width="${SIZE}"
            height="${SIZE}"></canvas>
            <canvas
            id="resultStep3"
            width="${SIZE}"
            height="${SIZE}"></canvas>
            <canvas
            id="resultStep4"
            width="${SIZE}"
            height="${SIZE}"></canvas><br/>
            <canvas
            id="result"
            width="${SIZE}"
            height="${SIZE}"></canvas>
        `;
    }
}


declare global {
    interface HTMLElementTagNameMap {
        'drink-makr-2': DrinkMark2Component;
    }
}
