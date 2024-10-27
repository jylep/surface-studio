import { IControl, Map } from "mapbox-gl";

type SurfaceStudioButtonDefinition = {
  color: string;
  disabled: boolean;
  iconClassName?: string; // a font-awesome icon
  id: string;
  element?: HTMLButtonElement;
  on: string;
  title: string;
  action: () => void;
}

/**
 * This is a patching of mapbox-gl-draw control to allow for adding new buttons
 * inside the control container of a mapbox-gl control container
 */
export class SurfaceStudioDrawControl implements IControl {

  draw: MapboxDraw;
  buttons: SurfaceStudioButtonDefinition[] = [];

  controlContainer?: HTMLElement;
  map?: Map

  // IControl mandatory functions from mapbox-gl-draw
  originalOnAdd: MapboxDraw["onAdd"];
  originalOnRemove: MapboxDraw["onRemove"];

  constructor({ draw, buttons }: {
    draw: MapboxDraw,
    buttons: SurfaceStudioButtonDefinition[]
  }) {
    this.draw = draw;
    this.buttons = buttons;
    this.originalOnAdd = draw.onAdd;
    this.originalOnRemove = draw.onRemove;
  }

  onAdd(map: Map): HTMLElement {
    this.map = map;
    this.controlContainer = this.originalOnAdd(map);

    this.buttons.forEach(buttonDefinition => {
      this.addButton(buttonDefinition);
    })

    return this.controlContainer;
  }

  onRemove(map: Map): void {
    this.buttons.forEach(this.removeButton);
    this.originalOnRemove(map);
  }


  addButton(buttonDefinition: SurfaceStudioButtonDefinition): void {
    let newButton = document.createElement('button');
    newButton.className = 'mapbox-gl-draw_ctrl-draw-btn';
    if (buttonDefinition.iconClassName) buttonDefinition.iconClassName.split(' ').forEach(className => newButton.classList.add(className))
    newButton.addEventListener(buttonDefinition.on, buttonDefinition.action);
    newButton.id = buttonDefinition.id;
    newButton.title = buttonDefinition.title;
    newButton.type = "button";
    newButton.disabled = buttonDefinition.disabled; // for those two cases we can set every button to disabled as a starting point
    newButton.style.color = buttonDefinition.color;
    if (this.controlContainer) buttonDefinition.element = this.controlContainer.appendChild(newButton);
    // buttonDefinition.element = newButton;
  }

  removeButton(buttonDefinition: SurfaceStudioButtonDefinition): void {
    if (!buttonDefinition.element) return;
    buttonDefinition.element.removeEventListener(buttonDefinition.on, buttonDefinition.action);
    buttonDefinition.element.remove();
  }
}
