import * as THREE from '../modules/three.module.js';

/*
https://thebookofshaders.com/11/ здесь про шумы.

if(position.y > 0.) - условие нужно для того, чтобы волновалась только верхнаяя грань меша
y = уровень воды + sin(шум + время) * cила волны
*/
const customTransform = `
vec3 transformed = vec3(position);
if(position.y > 0.) transformed.y = .3 + sin(fract(sin(dot(position.xz,
  vec2(12.9898,78.233))) * 43758.5453123) + time) * .05;       
`;

export const buildOcean = () => {

    const geometry = new THREE.BoxGeometry(100, 0.5, 100, 15, 15, 15);
    geometry.widthSegments = 15;
    geometry.depthSegments = 15;
    geometry.heightSegments = 15;


    const material = new THREE.MeshPhongMaterial({ color: 0x3CE1FA, flatShading: true, side: THREE.DoubleSide, wireframe: false, shininess: 100, transparent: true, opacity: 0.6 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.setY(0.046);
    mesh.scale.x = 0.02005;
    mesh.scale.z = 0.02005;

    const ocean = {
        mesh,
    }

    material.onBeforeCompile = (shader) => {
        shader.uniforms.time = { value: 0 };
        shader.vertexShader = `
            uniform float time;
            ` + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", customTransform);
        ocean.shader = shader;
    }


    return ocean;
}