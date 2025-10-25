import { LitElement, html, css, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';


@customElement('flow-canvas')
export class FlowCanvas extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    svg {
      width: 100%;
      height: 100%;
      background: #fafafa;
      cursor: default;
    }

    circle {
      fill: #3498db;
      cursor: pointer;
      transition: fill 0.2s ease;
    }

    circle:hover {
      fill: #2980b9;
    }

    line {
      stroke: #555;
      stroke-width: 2;
    }
  `;


  @property({ type: Array })
  nodes: { id: number; x: number; y: number }[];
  @property({ type: Array })
  lines: { from: number; to: number }[];
  @property({ type: Number })
  selectedNodeId: number | null;
  @property({ type: Number })
  draggingNodeId: number | null;
  @property({ type: Number })
  offsetX: number;
  @property({ type: Number })
  offsetY: number;


  constructor() {
    super();
    this.nodes = [];
    this.lines = [];
    this.selectedNodeId = null;
    this.draggingNodeId = null;
    this.offsetX = 0;
    this.offsetY = 0;
  }


  override render() {
    return html`
      <svg
        viewBox="0 0 100% 100%"
        xmlns="http://www.w3.org/2000/svg"
        @click="${this._onSvgClick}"
        @mousemove="${this._onMouseMove}"
        @mouseup="${this._onMouseUp}">
        <!-- Linien (Edges) -->
        ${this.lines.map(line => {
          const fromNode = this.nodes.find(n => n.id === line.from);
          const toNode = this.nodes.find(n => n.id === line.to);
          return fromNode && toNode
            ? svg`
                <line
                  x1="${fromNode.x}"
                  y1="${fromNode.y}"
                  x2="${toNode.x}"
                  y2="${toNode.y}"></line>
              `
            : null;
        })}
        <!-- Kreise (Nodes) -->
        ${this.nodes.map(node => svg`
          <circle
            cx="${node.x}"
            cy="${node.y}"
            r="20"
            @mousedown="${(e) => this._onMouseDown(e, node.id)}"
            @dblclick="${(e) => this._onCircleDblClick(e, node.id)}"></circle>
        `)}
      </svg>
    `;
  }

  /**
   * Called when the SVG is clicked.
   * If the click occurs on an "empty" spot (the SVG itself), a new circle is created.
   */
  _onSvgClick(e) {
    console.log('svgclick');
    // Nur ausführen, wenn nicht auf einen bestehenden Kreis geklickt wurde
    if (e.target === e.currentTarget) {
      const svgRect = e.target.getBoundingClientRect();
      const x = e.clientX - svgRect.left;
      const y = e.clientY - svgRect.top;

      const newNode = {
        id: Math.random(), // einfache ID
        x,
        y
      };

      this.nodes = [...this.nodes, newNode];
      // Mutating an object or array doesn't change the object reference, so it won't trigger an update.
      this.requestUpdate();
    }
  }

  /**
   * Called when the user clicks on a circle.
   * Starts the dragging process and stores the difference between the mouse and circle position.
   * Additionally: If another circle was already selected, we connect it with the new circle.
   */
  _onMouseDown(e, nodeId) {
    console.log('mousedown', nodeId);
    e.stopPropagation();

    // Falls bereits ein Node ausgewählt ist und ein anderer geklickt wird -> Linie erzeugen
    if (this.selectedNodeId !== null && this.selectedNodeId !== nodeId) {
      this.lines = [...this.lines, { from: this.selectedNodeId, to: nodeId }];
      this.selectedNodeId = null;
      return;
    }

    // Ansonsten starten wir den Drag-Vorgang
    this.draggingNodeId = nodeId;
    this.selectedNodeId = nodeId;

    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const svgRect = this.renderRoot.querySelector('svg')!.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Verschiebe-Offset
    this.offsetX = node.x - (clientX - svgRect.left);
    this.offsetY = node.y - (clientY - svgRect.top);

    this.requestUpdate();
  }

  /**
   * Called when the mouse is moved while dragging a circle.
   */
  _onMouseMove(e) {
    console.log('mousemove');
    if (this.draggingNodeId === null) return;
    e.preventDefault();

    const nodeIndex = this.nodes.findIndex(n => n.id === this.draggingNodeId);
    if (nodeIndex < 0) return;

    const svgRect = this.renderRoot.querySelector('svg')!.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Neue Position
    this.nodes[nodeIndex] = {
      ...this.nodes[nodeIndex],
      x: (clientX - svgRect.left) + this.offsetX,
      y: (clientY - svgRect.top) + this.offsetY,
    };

    this.requestUpdate();
  }

  /**
   * Called when the mouse button or finger is released.
   * Ends the drag operation.
   */
  _onMouseUp() {
    console.log('mouseup');
    this.draggingNodeId = null;
  }

  /**
   * A double-click on a circle deletes it and all associated connections.
   */
  _onCircleDblClick(e, nodeId) {
    console.log('dblclick', nodeId);
    e.stopPropagation();

    this.nodes = this.nodes.filter(n => n.id !== nodeId);
    this.lines = this.lines.filter(
      line => line.from !== nodeId && line.to !== nodeId
    );

    if (this.selectedNodeId === nodeId) {
      this.selectedNodeId = null;
    }

    this.requestUpdate();
  }
}
