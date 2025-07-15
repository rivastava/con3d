/**
 * Debug utility for testing material selection after transform application
 */
import * as THREE from 'three';

export function debugMaterialSelection(mesh: THREE.Mesh | null): void {
  if (!mesh) {
    console.log('❌ No mesh selected for material debugging');
    return;
  }

  console.log('🔍 Material Debug Info:');
  console.log(`- Mesh name: "${mesh.name}"`);
  console.log(`- Has material: ${!!mesh.material}`);
  console.log(`- Material type: ${mesh.material ? (mesh.material as any).type : 'null'}`);
  
  if (mesh.material) {
    if (Array.isArray(mesh.material)) {
      console.log(`- Material array length: ${mesh.material.length}`);
      mesh.material.forEach((mat, index) => {
        console.log(`  [${index}] ${mat.type} - UUID: ${mat.uuid.substring(0, 8)}`);
      });
    } else {
      const mat = mesh.material as THREE.Material;
      console.log(`- Material UUID: ${mat.uuid.substring(0, 8)}`);
      console.log(`- Material name: "${mat.name}"`);
      console.log(`- Is MeshPhysicalMaterial: ${mat instanceof THREE.MeshPhysicalMaterial}`);
      console.log(`- Material properties:`, {
        transparent: mat.transparent,
        opacity: mat.opacity,
        visible: mat.visible,
        needsUpdate: mat.needsUpdate
      });
      
      if (mat instanceof THREE.MeshPhysicalMaterial) {
        console.log(`- Physical material properties:`, {
          color: mat.color.getHexString(),
          metalness: mat.metalness,
          roughness: mat.roughness,
          transmission: mat.transmission,
          clearcoat: mat.clearcoat
        });
      }
    }
  }
  
  console.log(`- Geometry info:`, {
    hasGeometry: !!mesh.geometry,
    geometryType: mesh.geometry?.type,
    hasAttributes: !!mesh.geometry?.attributes,
    vertexCount: mesh.geometry?.attributes?.position?.count || 0
  });
  
  console.log(`- Transform info:`, {
    position: `(${mesh.position.x.toFixed(2)}, ${mesh.position.y.toFixed(2)}, ${mesh.position.z.toFixed(2)})`,
    rotation: `(${mesh.rotation.x.toFixed(2)}, ${mesh.rotation.y.toFixed(2)}, ${mesh.rotation.z.toFixed(2)})`,
    scale: `(${mesh.scale.x.toFixed(2)}, ${mesh.scale.y.toFixed(2)}, ${mesh.scale.z.toFixed(2)})`
  });
}
