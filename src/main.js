
const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'
import Scenes from './scenes'

var currentVisualizer;

// called after the scene loads
function onLoad(framework) {
  Scenes.initializeAllScenes(framework);

  //currentVisualizer = Scenes.getScene("icosahedron");
  currentVisualizer = Scenes.getScene("spiral");
  framework.scene = currentVisualizer.scene;
  framework.camera = currentVisualizer.camera;
  var renderer = framework.renderer;
  var gui = framework.gui;

  // LOOK: the line below is syntactic sugar for the code above. Optional, but I sort of recommend it.
  // var {scene, camera, renderer, gui, stats} = framework; 

  // edit params and listen to changes like this
  // more information here: https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage
  gui.add(framework.camera, 'fov', 0, 180).onChange(function(newVal) {
    framework.camera.updateProjectionMatrix();
  });
}

// called on frame updates
function onUpdate(framework) {
  if (currentVisualizer != undefined) {
    if (framework.visualizerIndex != undefined && currentVisualizer.index != framework.visualizerIndex) {
      currentVisualizer = Scenes.getSceneByIndex(framework.visualizerIndex);
      framework.scene = currentVisualizer.scene;
      framework.camera = currentVisualizer.camera;
    }

    currentVisualizer.onUpdate(framework);
  }
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);
