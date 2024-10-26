import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';


@customElement('hio-home-view')
export class HomeView extends LitElement {
    override render() {
        return html`
            <h1>Home</h1>
            <p>Welcome to my website!</p>
            `;
    }
}
