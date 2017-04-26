
const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'
import Scenes from './scenes'

// used to keep track of animations when paused
var pauseTime;

var currentVisualizer;

// called after the scene loads
function onLoad(framework) {
  Scenes.initializeAllScenes(framework);

  currentVisualizer = Scenes.getScene("icosahedron");
  var scene = currentVisualizer.scene;
  var camera = currentVisualizer.camera;
  framework.scene = scene;
  framework.camera = camera;
  var renderer = framework.renderer;
  var gui = framework.gui;

  // LOOK: the line below is syntactic sugar for the code above. Optional, but I sort of recommend it.
  // var {scene, camera, renderer, gui, stats} = framework; 

  // edit params and listen to changes like this
  // more information here: https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage
  gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
    camera.updateProjectionMatrix();
  });
}

// called on frame updates
function onUpdate(framework) {
  if (currentVisualizer != undefined) {
    currentVisualizer.onUpdate(framework);
  }
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);
