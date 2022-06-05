import * as THREE from '../modules/three.module.js';


const addAmbientLight = () => {
  const color = 0xFFFFFF,
    intensity = 0.6,
    ambientLight = new THREE.AmbientLight(color, intensity);

  return ambientLight;
}

const addDirectionalLight = () => {
  const color = 0xFFFFFF,
    intensity = 0.2,
    directionalLight = new THREE.DirectionalLight(color, intensity);

  return directionalLight;
}
export const resizeRendererToDisplaySize = (renderer) => {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }

  return needResize;
}

export const addCamera = () => {
  const fov = 75,
    aspect = 2,
    near = 0.1,
    far = 100,
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 2;
  camera.position.y = 3;

  return camera;
}

export const addScene = () => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#DDF7FB');
  scene.add(addAmbientLight());
  scene.add(addDirectionalLight());

  return scene;
}

export const addBottomPlane = () => {
  const geometry = new THREE.PlaneGeometry( 2, 2 );
  const material = new THREE.MeshBasicMaterial( {color: 0x3CE1FA, side: THREE.DoubleSide,  flatShading: true,} );
  const plane = new THREE.Mesh( geometry, material );

  plane.rotateX(Math.PI/2)
  plane.position.y = -0.2;

  return plane
}



