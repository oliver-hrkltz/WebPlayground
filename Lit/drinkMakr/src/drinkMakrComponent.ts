import { customElement, property, query } from 'lit/decorators.js';
import { html, css, LitElement, TemplateResult, CSSResult } from 'lit';


@customElement('drink-makr')
export class DrinkMarkComponent extends LitElement {
    static override styles: CSSResult = css`
        canvas {
            width: 256px;
            height: 256px;
        }

        canvas#resultStep1,
        canvas#resultStep2,
        canvas#resultStep3 {
            display: none;
        }
    `;

    @query('#cup')
    private _cupElement?: HTMLCanvasElement;
    @query('#filling_screen')
    private _fillingScreenElement?: HTMLCanvasElement;
    @query('#texture')
    private _textureElement?: HTMLCanvasElement;
    @query('#resultStep1')
    private _resultStep1Element?: HTMLCanvasElement;
    @query('#resultStep2')
    private _resultStep2Element?: HTMLCanvasElement;
    @query('#resultStep3')
    private _resultStep3Element?: HTMLCanvasElement;
    @query('#result')
    private _resultElement?: HTMLCanvasElement;
    @property()
    public ip: String = '';
    private _textureImg: any;


    override connectedCallback(): void {
        super.connectedCallback();

        // TODO: https://graffino.com/til/hEvDjQa4au-how-to-import-images-in-typescript
        const cupImg = new Image();
        cupImg.src = 'assets/plasticCup/cup.png'
        cupImg.onload = () => {
            this._cupElement!.getContext('2d')!.drawImage(cupImg, 0, 0, 256, 256);

            // TODO: Drag&Drop instead of load.
            const fillingScreenImg = new Image();
            fillingScreenImg.src = 'assets/plasticCup/mask.png'
            fillingScreenImg.onload = () => {
                this._fillingScreenElement!.getContext('2d')!.drawImage(fillingScreenImg, 0, 0, 256, 256);

                // TODO: Drag&Drop instead of load.
                this._textureImg = new Image();
                this._textureImg.src = 'assets/texture/latte_macchiato.png'
                this._textureImg.onload = () => {
                    this._textureElement!.getContext('2d')!.drawImage(this._textureImg, 0, 0, 256, 256);
                    this._step1MapTextureToIngredientArea();
                    this._step2WarpMappedTexture();
                    this._step3OverlayWarpedTexture();
                    this._step4CombineOverlayAndCupImage();
                }
            }
        }
    }


    private _step1MapTextureToIngredientArea() {
        const imgA = this._fillingScreenElement?.getContext('2d')!.getImageData(0, 0, 256, 256)!;
        let x1 = 256;
        let x2 = 0;
        let y1 = 0;
        let y2 = 0;

        for (var i = 0; i < imgA.data.length; i = i + 4) {
            if (imgA.data[i + 3] > 0) {
                y1 = Math.floor((i / 4) / 256);
                break;
            }
        }

        for (var i = imgA.data.length; i > 0; i = i - 4) {
            if (imgA.data[i + 3] > 0) {
                y2 = Math.floor((i / 4) / 256);
                break;
            }
        }

        let temp = 0;

        for (var i = 0; i < imgA.data.length; i = i + 4) {
            if (imgA.data[i + 3] > 0) {
                temp = ((i / 4) % 256);
                if (temp % 256 < x1) {
                    x1 = temp;
                }
            }
        }

        for (var i = imgA.data.length; i > 0; i = i - 4) {
            if (imgA.data[i + 3] > 0) {
                temp = ((i / 4) % 256);
                if (temp % 256 > x2) {
                    x2 = temp;
                }
            }
        }

        let width = x2 - x1;
        let height = y2 - y1;
        this._resultStep1Element?.getContext('2d')!.drawImage(this._textureImg, x1, y1, width, height)
    }


    private _step2WarpMappedTexture() {
        const imgA = this._resultStep1Element!.getContext('2d')!.getImageData(0, 0, 256, 256);
        const imgResult = this._resultStep1Element!.getContext('2d')!.getImageData(0, 0, 256, 256);

        for (let i = 0; i < imgResult.data.length; i += 4) {
            // Don't override visible top with empty part.
            if (imgA.data[i + 3] == 0) {
                continue;
            }

            const x = (i / 4) % 256;
            const y = Math.floor((i / 4) / 256);
            // Warp function. Sinus over x with an amplitude of 30. Move it up by 30/2 to avoid gap in the top.
            let newY = y + Math.floor(Math.sin((x / 256) * Math.PI) * 30) - 30 / 2;
            let targetI = ((((newY) * 256) + (x)) * 4)
            imgResult.data[targetI + 0] = imgA.data[i + 0];
            imgResult.data[targetI + 1] = imgA.data[i + 1];
            imgResult.data[targetI + 2] = imgA.data[i + 2];
            imgResult.data[targetI + 3] = imgA.data[i + 3];
        }

        this._resultStep2Element!.getContext('2d')!.putImageData(imgResult, 0, 0, 0, 0, 256, 256);
    }


    // 2.Step: Overlay & Mask the texture with reflection.
    private _step3OverlayWarpedTexture() {
        const imgA = this._fillingScreenElement?.getContext('2d')!.getImageData(0, 0, 256, 256)!;
        const imgC = this._resultStep2Element?.getContext('2d')!.getImageData(0, 0, 256, 256)!;

        for (var i = 0; i < imgC.data.length; i += 4) {
            // Overlay RGB channels to get reflexion on texture.
            let factor = (((imgA.data[i + 0] + imgA.data[i + 1] + imgA.data[i + 2]) / 3) / 255)
            imgC.data[i + 0] += (imgA.data[i + 0] * factor);
            imgC.data[i + 1] += (imgA.data[i + 1] * factor);
            imgC.data[i + 2] += (imgA.data[i + 2] * factor);
            // Use the Alpha channel from the Mask (filling_screen.png).
            imgC.data[i + 3] = imgA.data[i + 3];
        }

        this._resultStep3Element?.getContext('2d')!.putImageData(imgC, 0, 0, 0, 0, 256, 256);
    }


    // 3.Step: Draw resultStep3 over cup to gernate the final image.
    private _step4CombineOverlayAndCupImage() {
        const imgA = this._resultStep3Element?.getContext('2d')!.getImageData(0, 0, 256, 256)!;
        const imgResult = this._cupElement?.getContext('2d')!.getImageData(0, 0, 256, 256)!;

        for (var i = 0; i < imgResult.data.length; i += 4) {
            if (imgA.data[i + 3] > 240) {
                imgResult.data[i + 0] = imgA.data[i + 0];
                imgResult.data[i + 1] = imgA.data[i + 1];
                imgResult.data[i + 2] = imgA.data[i + 2];
                imgResult.data[i + 3] = imgA.data[i + 3];
            }
        }

        this._resultElement!.getContext('2d')!.putImageData(imgResult, 0, 0, 0, 0, 256, 256);
    }


    override disconnectedCallback() {
        super.disconnectedCallback();
    }


    override render(): TemplateResult {
        return html`
            <canvas
            id="cup"
            width="256"
            height="256"></canvas>
            <canvas
            id="filling_screen"
            width="256"
            height="256"></canvas>
            <canvas
            id="texture"
            width="256"
            height="256"></canvas><br/>
            <canvas
            id="resultStep1"
            width="256"
            height="256"></canvas>
            <canvas
            id="resultStep2"
            width="256"
            height="256"></canvas>
            <canvas
            id="resultStep3"
            width="256"
            height="256"></canvas><br/>
            <canvas
            id="result"
            width="256"
            height="256"></canvas>
        `;
    }
}


declare global {
    interface HTMLElementTagNameMap {
        'drink-makr': DrinkMarkComponent;
    }
}
