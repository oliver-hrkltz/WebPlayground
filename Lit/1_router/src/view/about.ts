import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';


@customElement('hio-about-view')
export class AboutView extends LitElement {
    override render() {
        return html`
            <h1>About Me</h1>
            <p>Hey it's me!</p>
            `;
    }
}
