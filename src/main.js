
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

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function switchVisualizerOnBeat(framework) {
  var time = framework.audioContext.currentTime - framework.audioStartTime; // in seconds
  var divisor = (framework.songBPM == undefined) ? 120 : framework.songBPM;
  divisor = divisor/60;
  var epsilon = 0.02; 
  console.log(time); 
  console.log(divisor); 
  console.log(time % divisor);
  if (time % divisor < epsilon) {
    var randomNum = getRandomInt(0, Scenes.getNumScenes());
    while (randomNum == framework.visualizerIndex) {
      randomNum = getRandomInt(0, Scenes.getNumScenes());
    }
    switchVisualizer(framework, randomNum);
  }
} 

function switchVisualizer(framework, visualizerIndex) {
  currentVisualizer = Scenes.getSceneByIndex(visualizerIndex);
  framework.scene = currentVisualizer.scene;
  framework.camera = currentVisualizer.camera;
}

// called on frame updates
function onUpdate(framework) {
  if (currentVisualizer != undefined) {
    switchVisualizerOnBeat(framework);
    if (framework.visualizerIndex != undefined && currentVisualizer.index != framework.visualizerIndex) {
      switchVisualizer(framework, framework.visualizerIndex);
    }

    currentVisualizer.onUpdate(framework);
  }
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);
