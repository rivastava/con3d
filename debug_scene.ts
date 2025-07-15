/**
 * Debug utility for checking scene objects and selection issues
 */
export function debugSceneObjects(scene: any): void {
  console.log('🔍 Scene Debug Info:');
  console.log(`Total scene children: ${scene.children.length}`);
  
  const meshes: any[] = [];
  const helpers: any[] = [];
  const others: any[] = [];
  
  scene.traverse((object: any) => {
    const info = {
      name: object.name || 'unnamed',
      type: object.type,
      constructor: object.constructor.name,
      visible: object.visible,
      userData: object.userData,
      position: object.position ? `(${object.position.x.toFixed(2)}, ${object.position.y.toFixed(2)}, ${object.position.z.toFixed(2)})` : 'none'
    };
    
    if (object.type === 'Mesh') {
      meshes.push(info);
    } else if (object.name.includes('Helper') || object.userData.isHelper) {
      helpers.push(info);
    } else {
      others.push(info);
    }
  });
  
  console.log('📦 Meshes:', meshes);
  console.log('🔧 Helpers:', helpers);
  console.log('🔹 Others:', others);
  
  // Test selection filtering
  const selectableObjects: any[] = [];
  scene.traverse((object: any) => {
    if (
      object.visible &&
      !object.userData.isHelper &&
      !object.userData.hideInOutliner &&
      !object.userData.isTransformControls &&
      !object.name.includes('helper') &&
      !object.name.includes('Helper') &&
      !object.name.includes('gizmo') &&
      !object.name.includes('Gizmo') &&
      !object.name.includes('_target') &&
      !object.name.includes('AxesHelper') &&
      !object.name.includes('GridHelper') &&
      !object.name.match(/^[XYZ]$/i) &&
      !object.name.includes('axis') &&
      !object.name.includes('Axis') &&
      (
        (object.type === 'Mesh' && !object.name.includes('_selector')) ||
        (object.userData.isLightSelector)
      )
    ) {
      selectableObjects.push({
        name: object.name || 'unnamed',
        type: object.type,
        hasMaterial: !!object.material,
        materialType: object.material ? (Array.isArray(object.material) ? `Array[${object.material.length}]` : object.material.type) : 'none'
      });
    }
  });
  
  console.log('✅ Selectable Objects:', selectableObjects);
}

// Global debug function
(window as any).debugScene = debugSceneObjects;
