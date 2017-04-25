
const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'

// used to animate the icosahedron
var programStartTime;
// used to keep track of animations when paused
var pauseTime;

var myMaterial = new THREE.ShaderMaterial({
  uniforms: {
      time: { // Check the Three.JS documentation for the different allowed types and values
        type: "f", 
        value: Date.now()
      },
      noiseStrength: {
        type: "f",
        value: 2.0
      }, 
      numOctaves: {
        type: "f",
        value: 3
      },
      audioScale: {
        type: "f",
        value: 1
      }
    },
    vertexShader: require('./shaders/my-vert.glsl'),
    fragmentShader: require('./shaders/my-frag.glsl')
  });

// called after the scene loads
function onLoad(framework) {
  programStartTime = Date.now();
  var scene = framework.scene;
  var camera = framework.camera;
  var renderer = framework.renderer;
  var gui = framework.gui;

  // LOOK: the line below is synyatic sugar for the code above. Optional, but I sort of recommend it.
  // var {scene, camera, renderer, gui, stats} = framework; 

  // initialize icosahedron object
  var guiFields = {
    icosahedronDetail: 3, 
    noiseStrength: 2.0,
    numOctaves: 3
  }

  var icosahedronGeometry = new THREE.IcosahedronGeometry(1, guiFields.icosahedronDetail);

  var texturedIcosahedron = new THREE.Mesh(icosahedronGeometry, myMaterial);
  scene.add(texturedIcosahedron);
  
  // set camera position
  camera.position.set(1, 1, 5);
  camera.lookAt(new THREE.Vector3(0,0,0));

  // edit params and listen to changes like this
  // more information here: https://workshop.chromeexperiments.com/examples/gui/#1--Basic-Usage
  gui.add(camera, 'fov', 0, 180).onChange(function(newVal) {
    camera.updateProjectionMatrix();
  });
}

function getAverageVolume(array) {
      var values = 0;
      var average;

      var length = array.length;

      // get all the frequency amplitudes
      for (var i = 0; i < length; i++) {
          values += array[i];
      }

      average = values / length;
      return average;
}

function mapVolumeToNoiseStrength(vol) {
  // map range from 0 -> 150 to 4 -> 1
  var result = vol / 150 * (1 - 4) + 4;
  return result;
}

// called on frame updates
function onUpdate(framework) {
  if (!framework.paused) {
    // animates icosahedron
    if (pauseTime != undefined) {
      myMaterial.uniforms.time.value = pauseTime - programStartTime;
    } else {
      myMaterial.uniforms.time.value = Date.now() - programStartTime;
    } 

    // get the average for the first channel
    if (framework.audioSourceBuffer.buffer != undefined) {
        // var array = new Uint8Array(framework.audioAnalyser.frequencyBinCount);
        // framework.audioAnalyser.getByteFrequencyData(array);

        // var step = Math.round(array.length / 60);

        // var value = 0;
        // //Iterate through the bars and scale the z axis
        // for (var i = 0; i < 60; i++) {
        //     var temp = array[i * step] / 4;
        //     value += temp < 1 ? 1 : temp;
        //     console.log(value);
        //     myMaterial.audioScale = value;
        // }
       // get the average, bincount is fftsize / 2
        var array =  new Uint8Array(framework.audioAnalyser.frequencyBinCount);
        framework.audioAnalyser.getByteFrequencyData(array);
        var average = getAverageVolume(array)

        //console.log('VOLUME:' + average); //here's the volume
        var newNoiseStrength = mapVolumeToNoiseStrength(average); 
        //console.log(newNoiseStrength);
        myMaterial.uniforms.noiseStrength.value = newNoiseStrength;

    }
    myMaterial.needsUpdate = true;
    pauseTime = undefined;
  } else {
    console.log(pauseTime);
    if (pauseTime == undefined) {
      pauseTime = Date.now();
    }
  }
}

// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);
