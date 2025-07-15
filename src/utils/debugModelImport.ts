// Debug helper for model import issues
// This file can be used to debug model loading and material issues

import * as THREE from 'three';

export const debugModelImport = (model: THREE.Group) => {
  console.group('🔍 Model Import Debug');
  
  console.log('Model:', model.name || 'Unnamed');
  console.log('Root Transform:', {
    position: model.position.toArray(),
    rotation: model.rotation.toArray(),
    scale: model.scale.toArray()
  });
  
  let meshCount = 0;
  let materialCount = 0;
  const materialTypes: { [key: string]: number } = {};
  
  model.traverse((child: THREE.Object3D) => {
    if (child instanceof THREE.Mesh) {
      meshCount++;
      
      console.log(`Mesh ${meshCount}: "${child.name}"`);
      console.log('  Transform:', {
        position: child.position.toArray(),
        rotation: child.rotation.toArray(),
        scale: child.scale.toArray()
      });
      console.log('  UserData:', child.userData);
      
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat: THREE.Material, idx: number) => {
            materialCount++;
            const type = mat.type;
            materialTypes[type] = (materialTypes[type] || 0) + 1;
            console.log(`  Material ${idx}: ${type}`, mat.userData);
          });
        } else {
          materialCount++;
          const type = child.material.type;
          materialTypes[type] = (materialTypes[type] || 0) + 1;
          console.log(`  Material: ${type}`, child.material.userData);
        }
      }
      
      // Check geometry
      if (child.geometry) {
        console.log('  Geometry:', {
          type: child.geometry.type,
          hasUV: !!child.geometry.attributes.uv,
          hasBoundingBox: !!child.geometry.boundingBox,
          hasBoundingSphere: !!child.geometry.boundingSphere
        });
      }
    }
  });
  
  console.log(`Summary: ${meshCount} meshes, ${materialCount} materials`);
  console.log('Material types:', materialTypes);
  console.groupEnd();
};

export const debugMaterialEditor = (mesh: THREE.Mesh | null) => {
  if (!mesh) {
    console.log('🎨 No mesh selected for material editing');
    return;
  }
  
  console.group('🎨 Material Editor Debug');
  console.log('Selected Mesh:', mesh.name || 'Unnamed');
  console.log('Mesh UserData:', mesh.userData);
  
  if (mesh.material) {
    if (Array.isArray(mesh.material)) {
      console.log(`Multi-material (${mesh.material.length} materials):`);
      mesh.material.forEach((mat: THREE.Material, idx: number) => {
        console.log(`  ${idx}: ${mat.type}`, mat.userData);
      });
    } else {
      console.log('Material:', mesh.material.type);
      console.log('Material UserData:', mesh.material.userData);
      console.log('Material Properties:', {
        color: mesh.material instanceof THREE.MeshStandardMaterial ? mesh.material.color.getHexString() : 'N/A',
        metalness: mesh.material instanceof THREE.MeshStandardMaterial ? mesh.material.metalness : 'N/A',
        roughness: mesh.material instanceof THREE.MeshStandardMaterial ? mesh.material.roughness : 'N/A',
      });
    }
  } else {
    console.log('No material assigned');
  }
  
  console.groupEnd();
};
