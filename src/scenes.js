const THREE = require('three');
import Framework from './framework'

var allScenes = [];
// used to animate the icosahedron
var programStartTime;

function getScene(sceneName) {
    for (var i = 0; i < allScenes.length; i++) {
        if (allScenes[i].name == sceneName) {
            return allScenes[i];
        }
    }
}

function initializeAllScenes() {
    programStartTime = Date.now();
    initializeIcosahedron();
}

function initializeIcosahedron() {
	var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    var icosahedronMaterial = new THREE.ShaderMaterial({
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

    // initialize icosahedron object
    var guiFields = {
    icosahedronDetail: 3, 
    noiseStrength: 2.0,
    numOctaves: 3
    }

    var icosahedronGeometry = new THREE.IcosahedronGeometry(1, guiFields.icosahedronDetail);

    var texturedIcosahedron = new THREE.Mesh(icosahedronGeometry, icosahedronMaterial);
    scene.add(texturedIcosahedron);

    // set camera position
    camera.position.set(1, 1, 5);
    camera.lookAt(new THREE.Vector3(0,0,0));

    var icosahedronScene = {
        name: 'icosahedron',
        scene: scene,
        camera: camera,
        onUpdate: function(framework) {
            icosahedronMaterial.uniforms.time.value = Date.now() - programStartTime;
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
              //     icosahedronMaterial.audioScale = value;
              // }
             // get the average, bincount is fftsize / 2
              var array =  new Uint8Array(framework.audioAnalyser.frequencyBinCount);
              framework.audioAnalyser.getByteFrequencyData(array);
              var average = getAverageVolume(array)

              //console.log('VOLUME:' + average); //here's the volume
              var newNoiseStrength = mapVolumeToNoiseStrength(average); 
              //console.log(newNoiseStrength);
              icosahedronMaterial.uniforms.noiseStrength.value = newNoiseStrength;

            }
            icosahedronMaterial.needsUpdate = true;
        }
    }

    allScenes.push(icosahedronScene);
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

export default {
  initializeAllScenes: initializeAllScenes,
  getScene: getScene
}
