import { html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';


@customElement('hio-app')
export class App extends LitElement {
    @property()
    route: string = '';


    _isScriptNotLoaded(url: string): boolean {
        const scriptElementArray = document.getElementsByTagName('script');

        for (let i = 0; i < scriptElementArray.length; i++) {
            if (scriptElementArray[i].src.endsWith(url)) {
                return false;
            };
        };

        return true;
    }


    _lazyLoadComponent(path: string): void {
        if (this._isScriptNotLoaded(path)) {
            const script = document.createElement('script');
            script.type = 'module';
            // In production all files will be served with *.js as extension.
            script.src = `${path}${import.meta.env.PROD ? '.js' : ''}`;
            document.head.appendChild(script);
        }
    }


    _navigate(pRoute: string): void {
        this._lazyLoadComponent(`/view/${pRoute}`);
        this.route = pRoute;
    }


    _getView(): TemplateResult {
        switch (this.route) {
            case 'about':
                return html`
                    <hio-about-view></hio-about-view>
                    `;
            // 'home' will be the default route so directly serve it from the default case.
            case 'home':
            default:
                return html`
                    <hio-home-view></hio-home-view>
                    `;
        }

    }

    override connectedCallback(): void {
        super.connectedCallback()
        this._navigate('home')
    }


    override render() {
        return html`
            <nav>
                <ul>
                    <li><a href="javascript:void(0);" @click="${{ handleEvent: () => this._navigate('home') }}">Home</a></li>
                    <li><a href="javascript:void(0);" @click="${{ handleEvent: () => this._navigate('about') }}">About</a></li>
                </ul>
            </nav>
            <main>
                ${this._getView()}
            </main>
            `;
    }
}
