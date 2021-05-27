/**
 * 3D Foundation Project
 * Copyright 2019 Smithsonian Institution
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

import resolvePathname from "resolve-pathname";
import { LoadingManager, Object3D, Scene, Group, Mesh, MeshStandardMaterial, sRGBEncoding } from "three";

import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

import UberPBRMaterial from "../shaders/UberPBRMaterial";

////////////////////////////////////////////////////////////////////////////////

export default class ModelReader
{
    static readonly extensions = [ "gltf", "glb" ];
    static readonly mimeTypes = [ "model/gltf+json", "model/gltf-binary" ];

    protected loadingManager: LoadingManager;
    protected gltfLoader;

    protected customDracoPath = null;

    set dracoPath(path: string) 
    {
        this.customDracoPath = path;
        if(this.gltfLoader.dracoLoader !== null) {
            this.gltfLoader.dracoLoader.setDecoderPath(this.customDracoPath);
        }
    }
   
    constructor(loadingManager: LoadingManager)
    {
        this.loadingManager = loadingManager;

        const dracoPath = resolvePathname("js/draco/", window.location.origin + window.location.pathname);
        if (ENV_DEVELOPMENT) {
            console.log("ModelReader.constructor - DRACO path: %s", this.customDracoPath ? this.customDracoPath : dracoPath);
        }

        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath(this.customDracoPath ? this.customDracoPath : dracoPath);

        this.gltfLoader = new GLTFLoader(loadingManager);
        this.gltfLoader.setDRACOLoader(dracoLoader);
    }

    isValid(url: string): boolean
    {
        const extension = url.split(".").pop().toLowerCase();
        return ModelReader.extensions.indexOf(extension) >= 0;
    }

    isValidMimeType(mimeType: string): boolean
    {
        return ModelReader.mimeTypes.indexOf(mimeType) >= 0;
    }

    get(url: string): Promise<Object3D>
    {
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(url, gltf => {
                resolve(this.createModelGroup(gltf));
            }, null, error => {
                console.error(`failed to load '${url}': ${error}`);
                reject(new Error(error));
            })
        });
    }

    protected createModelGroup(gltf): Object3D
    {
        const scene: Scene = gltf.scene;
        //if (scene.type !== "Scene") {
        //    throw new Error("not a valid gltf scene");
        //}

        const model = new Group();
        scene.children.forEach(child => model.add(child));

        model.traverse((object: any) => {
            if (object.type === "Mesh") {
                const mesh: Mesh = object;
                mesh.castShadow = true;
                const material = mesh.material as MeshStandardMaterial;

                if (material.map) {
                   material.map.encoding = sRGBEncoding;
                }

                mesh.geometry.computeBoundingBox();

                const uberMat = new UberPBRMaterial();

                // copy properties from previous material
                if (material.type === "MeshStandardMaterial") {
                    uberMat.copyStandardMaterial(material);
                }

                // check if the material's normal map uses object space (indicated in glTF extras)
                if (material.userData["objectSpaceNormals"]) {
                    uberMat.enableObjectSpaceNormalMap(true);

                    if (ENV_DEVELOPMENT) {
                        console.log("ModelReader.createModelGroup - objectSpaceNormals: ", true);
                    }
                }

                mesh.material = uberMat;
            }
        });

        return model;
    }
}