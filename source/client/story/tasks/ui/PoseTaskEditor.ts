/**
 * 3D Foundation Project
 * Copyright 2018 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import PropertyTracker from "@ff/graph/PropertyTracker";

import { customElement, html } from "@ff/ui/CustomElement";
import "@ff/ui/Layout";
import "@ff/ui/Splitter";
import "@ff/ui/Button";
import "@ff/ui/IndexButton";
import { IButtonClickEvent } from "@ff/ui/Button";

import VoyagerScene from "../../../core/components/VoyagerScene";
import Model from "../../../core/components/Model";

import "../../ui/ItemList";
import "../../ui/PropertyView";
import ItemProperties from "../../ui/ItemProperties";

import PoseManip, { EManipMode } from "../../components/PoseManip";
import TaskEditor from "./TaskEditor";
import PoseTask from "../PoseTask";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-pose-task-editor")
export default class PoseTaskEditor extends TaskEditor
{
    protected task: PoseTask;

    protected firstConnected()
    {
        super.firstConnected();

        this.setStyle({
            display: "flex",
            flexDirection: "column"
        });
    }

    protected render()
    {
        const system = this.task.system;

        return html`
            <div class="sv-section" style="flex: 1 1 25%">
                <sv-item-list .system=${system} .componentType=${Model}></sv-item-list>
            </div>
            <ff-splitter direction="vertical"></ff-splitter>
            <div class="sv-section" style="flex: 1 1 75%">
                <sv-item-pose-properties .system=${system}></sv-item-pose-properties>
            </div>
        `;
    }
}

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-item-pose-properties")
class ItemPoseProperties extends ItemProperties<Model>
{
    protected scene: VoyagerScene = null;
    protected modeProp = new PropertyTracker(this.onPropertyUpdate, this);

    constructor()
    {
        super(Model);
    }

    protected connected()
    {
        super.connected();
        this.modeProp.property = this.system.components.get(PoseManip).ins.mode;
    }

    protected disconnected()
    {
        super.disconnected();
        this.modeProp.detach();
    }

    protected render()
    {
        const model = this.component;
        console.log("posePropRender", model);

        if (!model) {
            return html``;
        }

        const mode = this.modeProp.getValue(EManipMode.Rotate);

        const globalUnits = this.scene.ins.units;
        const itemUnits = model.ins.units;
        const position = model.ins.position;
        const rotation = model.ins.rotation;

        return html`
            <ff-flex-row wrap>
                <ff-index-button text="Rotate" index=${EManipMode.Rotate} selectedIndex=${mode} @click=${this.onClickMode}></ff-index-button>
                <ff-index-button text="Move" index=${EManipMode.Translate} selectedIndex=${mode} @click=${this.onClickMode}></ff-index-button>
                <ff-button text="Center" @click=${this.onClickCenter}></ff-button>
                <ff-button text="Zoom Views" @click=${this.onClickZoomViews}></ff-button>
            </ff-flex-row>
            <sv-property-view .property=${globalUnits} label="Global Units"></sv-property-view>    
            <sv-property-view .property=${itemUnits} label="Item Units"></sv-property-view>
            <sv-property-view .property=${position}></sv-property-view>
            <sv-property-view .property=${rotation}></sv-property-view>
        `;
    }

    protected onClickMode(event: IButtonClickEvent)
    {
        this.modeProp.setValue(event.target.index);
    }

    protected onClickCenter()
    {
        this.component.ins.center.set();
    }

    protected onClickZoomViews()
    {
        this.scene.zoomViews();
    }

    protected setComponent(model: Model)
    {
        if (model) {
            this.scene = model.transform.getParent(VoyagerScene, true);

            if (this.modeProp.getValue() === EManipMode.Off) {
                this.modeProp.setValue(EManipMode.Rotate);
            }
        }
        else {
            this.scene = null;
        }

        super.setComponent(model);
    }

    protected onPropertyUpdate()
    {
        this.requestUpdate();
    }
}