import {
  EffectPass,
  BlurPass,
  KernelSize,
  SavePass,
  TextureEffect,
  BlendFunction,
} from 'postprocessing';

import {
  Mesh,
  MeshBasicMaterial,
  TextureLoader,
  Vector3,
  Vector2,
} from 'three';
import { renderPass, webcamEffect } from '../setup';

import { faceGeometry } from '../faceMesh';
import { SmokeEffect } from '../effects/SmokeEffect';

import eyesMouthUrl from '../assets/eyes_mouth_inverted.png';

const eyesMouthTex = new TextureLoader().load(eyesMouthUrl);
const mat = new MeshBasicMaterial({
  map: eyesMouthTex,
  transparent: true,
});

export class Smoke {
  constructor({ composer, scene }) {
    // Add mesh with eyes/mouth/nostrils texture
    const mesh = new Mesh(faceGeometry, mat);
    scene.add(mesh);

    // Setup all the passes used below
    const saveSmokePass = new SavePass();

    this.smokeEffect = new SmokeEffect({
      prevFrameTex: saveSmokePass.renderTarget.texture,
      frame: 0,
      smokeColorHSL: new Vector3(0.95, 0.9, 0.6),
      smokeTextureAmp: 0.1,
      smokeVelocity: new Vector2(0, 0.004),
      smokeDecay: 0.001,
      smokeRot: 0.01,
    });

    const smokeEffectPass = new EffectPass(null, this.smokeEffect);

    const smokeTexEffect = new TextureEffect({
      texture: saveSmokePass.renderTarget.texture,
      blendFunction: BlendFunction.ALPHA,
    });

    const overlaySmokePass = new EffectPass(null, webcamEffect, smokeTexEffect);

    const blurPass = new BlurPass({
      KernelSize: KernelSize.SMALL,
    });
    blurPass.scale = 0.2;

    // Render eyes, mouth, nostrils
    composer.addPass(renderPass);
    // Add previous frame and manipulate for smoke effect
    composer.addPass(smokeEffectPass);
    // Blur each frame
    composer.addPass(blurPass);
    // Save frame to be fed into next frame
    composer.addPass(saveSmokePass);
    // Render webcam image and overlay smoke
    composer.addPass(overlaySmokePass);

    this.frame = 0;
  }

  update() {
    this.smokeEffect.uniforms.get('frame').value = this.frame;

    this.frame++;
  }
}
