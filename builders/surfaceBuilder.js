import * as THREE from '../modules/three.module.js';
/**
 * @typedef {Object} Vertex
 * @property {[number, number, number]} pos - координаты позиции [X, Y, Z]
 * @property {[number, number, number]} norm - координаты нормали [X, Y, Z]
 * @property {[number, number]} uv - UV координаты [U, V]
 */

const calcAxisLength = (vertices) => Math.sqrt(vertices.length / 2);

/**
* Собирает типизированный массив координат
* @param {Vertex[]} vertices массив вершин 
*/
const buildPositions = (vertices) => {
  const positionNumComponents = 3;
  const positions = new Float32Array(vertices.length * positionNumComponents * 2);
  let positionIndex = 0;
  for (const vertex of vertices) {
    positions.set(vertex.pos, positionIndex);
    positionIndex += positionNumComponents;
  }

  return new THREE.BufferAttribute(positions, 3);
}

/**
 * Собирает типизированный массив нормалей
 * @param {Vertex[]} vertices массив вершин 
 */
const buildNormals = (vertices) => {
  const normalNumComponents = 3;
  const normals = new Float32Array(vertices.length * normalNumComponents);
  let normalIndex = 0;
  for (const vertex of vertices) {
    normals.set(vertex.norm, normalIndex);
    normalIndex += normalNumComponents;
  }

  return new THREE.BufferAttribute(normals, normalNumComponents);
}

/**
 * Собирает типизированный массив UV координат
 * @param {Vertex[]} vertices массив вершин 
 */
const buildUVS = (vertices) => {
  const uvNumComponents = 2;
  const uvs = new Float32Array(vertices.length * uvNumComponents);
  let uvIndex = 0;
  for (const vertex of vertices) {
    uvs.set(vertex.uv, uvIndex);
    uvIndex += uvNumComponents;
  }

  return new THREE.BufferAttribute(uvs, 2);
}

/**
* Рассчитывает индексы вершин для полигонов исходя из длины axisLength 
* @param {number} axisLength - длина подмассива, если представить массив вершин как матрицу 
* @returns Возвращает индексы вершин для правильной топологии плоскости
*/
const buildSurfaceTopology = (axisLength) => {
  const topology = [];

  // верхняя
  for (let hy = 0; hy <= axisLength - 2; hy++) { // (-2) пропускаем последние вершины т.к. там уже есть полигон
    for (let hx = 0; hx <= axisLength - 2; hx++) { // (-2) пропускаем последние вершины т.к. там уже есть полигон
      topology.push(
        (hy * axisLength) + hx,
        (hy * axisLength) + hx + 1,
        ((hy + 1) * axisLength) + hx,
      );
      topology.push(
        (hy * axisLength) + hx + 1,
        ((hy + 1) * axisLength) + hx,
        ((hy + 1) * axisLength) + hx + 1
      );
    }
  }

  // дальняя
  for (let hy = 0; hy < axisLength - 1; hy++) {
    topology.push(
      hy,
      hy + 1,
      hy + axisLength * axisLength,
    )

    topology.push(
      hy + 1,
      hy + 1 + axisLength ** 2,
      hy + axisLength * axisLength,
    )
  }

  // ближняя
  for (let hy = (axisLength * axisLength) - axisLength; hy < (axisLength * axisLength) + 2; hy += 1) {
    topology.push(
      hy,
      hy + 1,
      hy + axisLength * axisLength,
    )

    topology.push(
      hy + 1,
      hy + 1 + axisLength ** 2,
      hy + axisLength * axisLength,
    )
  }

  // левая
  for (let hy = 0; hy < (axisLength * axisLength) - (axisLength * 2) + 2; hy += axisLength) {
    topology.push(
      hy,
      hy + axisLength,
      hy + axisLength * axisLength,
    )

    topology.push(
      hy + axisLength,
      hy + axisLength + axisLength ** 2,
      hy + axisLength * axisLength,
    )
  }

  //правая
  for (let hy = axisLength - 1; hy < (axisLength * axisLength) - (axisLength * 2) + axisLength; hy += axisLength) {
    topology.push(
      hy,
      hy + axisLength,
      hy + axisLength * axisLength,
    )

    topology.push(
      hy + axisLength,
      hy + axisLength + axisLength ** 2,
      hy + axisLength * axisLength,
    )
  }

  return topology;
}

/**
 * Собирает геометрию для меша
 * @param {Vertex[]} vertices массив вершин 
 * @returns возвращает геометрию и буфер вершин, который в последующем будем обновлять
 */
const buildGeometry = (vertices) => {

  const geometry = new THREE.BufferGeometry();
  const axisLength = calcAxisLength(vertices);
  const positionAttribute = buildPositions(vertices);

  positionAttribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute(
    'position',
    positionAttribute
  );
  geometry.setAttribute(
    'normal',
    buildNormals(vertices)
  );
  geometry.setAttribute(
    'uv',
    buildUVS(vertices)
  );

  geometry.setIndex(buildSurfaceTopology(axisLength));

  return geometry;
}

/**
* Создаём вершины для меша
* @param {number} length Значение в координатах Three.js
//TODO: вероятно ошибка в комментарии
* @returns {[Vertex[], number]} Возвращает массив вершин и длину подмассива, если представить массив вершин как матрицу. 
* Пояснение: функция возвращает развёрнутый массив, однако в будущем, 
* при сборке топологии это будет квадрат axisLength вершин высоту и axisLength вершин в длину
*/
const createVertices = (length = 1) => {
  const vertices = [];
  //верхняя плоскость
  for (let iZ = length; iZ >= -length; iZ = parseFloat((iZ - 0.05).toFixed(2))) {
    for (let iX = -length; iX <= length; iX = parseFloat((iX + 0.05).toFixed(2))) {
      vertices.push({ pos: [iX, 0, -iZ], norm: [0, 1, 0], uv: [0, 0], })
    }
  }
  //нижняя плоскость
  //TODO: пересчиать нижнюю плоскость, там неиспользуемые вершины 
  for (let iZ = length; iZ >= -length; iZ = parseFloat((iZ - 0.05).toFixed(2))) {
    for (let iX = -length; iX <= length; iX = parseFloat((iX + 0.05).toFixed(2))) {
      vertices.push({ pos: [iX, -0.2, -iZ], norm: [0, 1, 0], uv: [0, 0], })
    }
  }

  return vertices;
}

const buildSurfaceMesh = (geometry) => {
  const material = new THREE.MeshPhongMaterial({ color: 0xFAEE9F, flatShading: true, side: THREE.DoubleSide, wireframe: false });
  const mesh = new THREE.Mesh(geometry, material);

  return mesh;
}

export const buildSurface = () => {
  const vertices = createVertices();
  const axisLength = calcAxisLength(vertices);
  const geometry = buildGeometry(vertices);
  const mesh = buildSurfaceMesh(geometry);

  return {
    mesh, // Сам мэш поверхности
    position: geometry.attributes.position.array, // Плоский массив координат вершин [X1, Y1, Z1 ... Xn, Yn, Zn]
    axisLength, // длина матрицы вершин по осям X и Y (у нас квадрат, поэтому значение одно)
    updateMesh: () => geometry.attributes.position.needsUpdate = true // Обновить вершины меша
  }
}

