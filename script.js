import * as THREE from './modules/three.module.js';
import { OrbitControls } from './modules/OrbitControls.js';
import { resizeRendererToDisplaySize, addCamera, addScene, addBottomPlane } from './builders/defaultsBuilder.js';
import { buildSurface } from './builders/surfaceBuilder.js';
import { buildOcean } from './builders/oceanBuilder.js';

// ============= трассировка

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// ============= переменные

let isMouseDown = false;
let isSpaceBarDown = false;
let penRadius = 10;

// ============= методы для событий

const drawOnEditor = (x, y, surface, onlyPen = false) => {

  penCtx.clearRect(0, 0, surface.axisLength * 7.3, surface.axisLength * 7.3)
  penCtx.beginPath();
  penCtx.arc(x * 7.3, y * 7.3, penRadius * 7.3, 0, 2 * Math.PI);
  penCtx.closePath();
  penCtx.stroke()

    editorCtx.fillStyle = '#10101005'
    editorCtx.beginPath();
    editorCtx.arc(x, y, penRadius, 0, 2 * Math.PI);
    editorCtx.closePath();

    if(!onlyPen){
      const grd=editorCtx.createRadialGradient(
        x,
        y, 
        penRadius / 4,
        x,
        y,
        penRadius);
     grd.addColorStop(0,"#10101010");
     grd.addColorStop(1,"#10101000");
     editorCtx.fillStyle=grd;
     editorCtx.fill();
     redrawSurface(surface);
    }
}

const calcMouseCoord = (canvasMouseEvent) => {
  let x, y;
  const rect = canvasMouseEvent.target.getBoundingClientRect();
  
    if(canvasMouseEvent.touches){
      x = canvasMouseEvent.touches[0].clientX - rect.left / 7.3;
      y = canvasMouseEvent.touches[0].clientY - rect.top / 7.3;
    } else {
      x = (canvasMouseEvent.clientX - rect.left) / 7.3;
      y = (canvasMouseEvent.clientY - rect.top) / 7.3;
    }

  return [x, y];
}

/**
 * Меняет высоту вершин поверхности в зависимости от карты высот, в качестве параметра высоты использует из RGBA значения пикселя альфа-канал 
 * @param {number} axisLength - длина подмассива, если представить массив вершин как матрицу 
 */
const redrawSurface = (surface) => {
  const data = editorCtx.getImageData(0, 0, surface.axisLength, surface.axisLength).data;
  const flatMatrix = [];

  for(let i = 3; i < data.length; i += 4){
    flatMatrix.push(data[i])
  }

  for (let i = 1, n = 0; i < surface.axisLength * surface.axisLength * 3; n++, i += 3) {
    surface.position[i] = flatMatrix[n] / 255;
  }
  surface.updateMesh();
}

// ============= инициализация

const scene = addScene();
const camera = addCamera();

const canvas = document.querySelector('#three_canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
const controls = new OrbitControls(camera, renderer.domElement);

const surface = buildSurface();
const ocean = buildOcean();
const bottomPlane = addBottomPlane();

const editor = document.getElementById('height_map');
const penRange = document.querySelector('#pen_range');
const penLabel = document.querySelector('#label');
const penCanvas = document.querySelector('#height_map_pen_circle');
const penCtx = penCanvas.getContext('2d');
const editorCtx = editor.getContext('2d');

// TODO: Вместо конуса должны быть объекты
const helper = new THREE.Mesh( new THREE.ConeGeometry( 0.1, 0.2, 3 ),  new THREE.MeshPhongMaterial({ color: 0xcb4154, flatShading: true, side: THREE.DoubleSide, wireframe: false }));

const onPointerMove = (event) => {

  pointer.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
  pointer.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;
  raycaster.setFromCamera( pointer, camera );

  const intersects = raycaster.intersectObject( surface.mesh );

  if (intersects.length > 0) {

    if(helper){
     helper.position.set( 0, 0, 0 );
     helper.position.copy( intersects[ 0 ].point );
    }

    const x = (intersects[ 0 ].point.x + 1) * 20;
    const y = (intersects[ 0 ].point.z + 1) * 20;
    return [x, y]
  } else {          
    return undefined
  }
}
          


scene.add(surface.mesh);
scene.add(ocean.mesh);
scene.add(bottomPlane);
// scene.add(helper);


editorCtx.imageSmoothingEnabled = true;
penCanvas.width = surface.axisLength * 7.3;
penCanvas.height = surface.axisLength * 7.3;
editor.width = surface.axisLength;
editor.height = surface.axisLength;
penRange.value = 5;

function render(time) {
  time *= 0.001;
  controls.update();


  if (ocean.shader) {
    ocean.shader.uniforms.time.value = time;
  }
  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

requestAnimationFrame(render);

// ============= события браузера 

const changePenRadius = (value) => { penLabel.innerHTML = `размер: ${value}`; penRadius = value; penRange.value = value;}
const changePenRadiusByWheel =(event) => {
  if(event.deltaY > 0){
    if(penRadius > 1){
      changePenRadius(penRadius - 1);
    }
    
  } else {
    if(penRadius < 21){
      changePenRadius(penRadius + 1);
    }
  }
}

window.addEventListener('keydown', (e) => e.key === ' ' ? isSpaceBarDown = true : null)
window.addEventListener('keyup', (e) => isSpaceBarDown = false)
canvas.addEventListener('pointermove', event => {
  const value = onPointerMove(event);
  if(value){
    const [x, y] = value;
    if(isSpaceBarDown) drawOnEditor(x, y, surface)
  }
});

editor.addEventListener('wheel', (e) => changePenRadiusByWheel(e))
editor.addEventListener('mousedown', () => isMouseDown = true);                                                 
editor.addEventListener('mouseup', () => isMouseDown = false);
editor.addEventListener('mousemove', event => {
  const [x, y] = calcMouseCoord(event)
  if(isMouseDown) {
    drawOnEditor(x,y, surface)
  } else{
    drawOnEditor(x,y, surface, true)
  } 
});

editor.addEventListener('touchstart', () => isMouseDown = true);
editor.addEventListener('touchend', () => isMouseDown = false);
editor.addEventListener('touchmove', event => {
  const [x, y] = calcMouseCoord(event)
  if(isMouseDown) drawOnEditor(x,y, surface)
} );

penRange.addEventListener('change', event => changePenRadius(event.target.value));

// ============= мусор

/**
 * Преорбазует данные канваса в матрицу состоящую только из альфа-канала
 * @param {number} axisLength - длина подмассива, если представить массив вершин как матрицу
 * @returns 
 */

// const buildCanvasDataAsMatrix = (surface) => {
//   const data = editorCtx.getImageData(0, 0, surface.axisLength, surface.axisLength).data;
//   const matrix = [];
  
//   for(let hy = 0; hy < surface.axisLength; hy++){
//     for(let i = 3 + (surface.axisLength * hy * 4); i < (surface.axisLength * 4) + (surface.axisLength * 4 * hy); i += 4) {
//       if(!matrix[hy]) matrix[hy] = [];
//       matrix[hy].push(data[i]);
//     }
//   }

//   return matrix;
// }



