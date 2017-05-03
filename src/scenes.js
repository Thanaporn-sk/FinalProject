const THREE = require('three');
const OrbitControls = require('three-orbit-controls')(THREE);
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

function getNumScenes() {
  return allScenes.length;
}

function getSceneByIndex(sceneIndex) {
    return allScenes[sceneIndex];
}

function initializeAllScenes(framework) {
    programStartTime = Date.now();
    initializeIcosahedron(framework);
    initializeStarField(framework);
    initializeSpiral(framework);

    for (var i = 0; i < allScenes.length; i++) {
        allScenes[i].index = i;
    }
}

var tanh = Math.tanh || function tanh(x) {
    return (Math.exp(x) - Math.exp(-x)) / (Math.exp(x) + Math.exp(-x));
}; 
var cosh = Math.cosh || function cosh(x) {
    return (Math.exp(x) + Math.exp(-x)) / 2;
}; 
var sinh = Math.sinh || function sinh(x) {
    return (Math.exp(x) - Math.exp(-x)) / 2;
};

function initializeSpiral(framework) {
  var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
  camera.position.set(0, 0, -5);
  camera.lookAt(new THREE.Vector3(0,0,0));

  var controls = new OrbitControls(camera, framework.renderer.domElement);
  controls.enableDamping = true;
  controls.enableZoom = true;
  controls.target.set(0, 0, 0);
  controls.rotateSpeed = 0.3;
  controls.zoomSpeed = 1.0;
  controls.panSpeed = 2.0;
  
  var scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xffffff );
  scene.add(new THREE.AmbientLight(0x333333));
  
  var numSpirals = 10; 

  var offset = 0.5;
  for (var s = 0; s < numSpirals; s++) {
    var geometry = new THREE.Geometry();
    // sphere spiral
    var sz = 16, cxy = 100, cz = cxy * sz;
    var hxy = Math.PI / cxy, hz = Math.PI / cz;
    var r = 20;
    for (var i = -cz; i < cz; i++) {
        var lxy = i * hxy;
        var lz = i * hz;
        var rxy = r / Math.cosh(lz);
        var x = rxy * Math.cos(lxy);
        var y = rxy * Math.sin(lxy);
        var z = r * Math.tanh(lz);
        geometry.vertices.push(new THREE.Vector3(x, y, z));
    }
    //geometry.translate(offset, 0, 0);
    geometry.scale(offset, offset, offset);
    offset += 0.5

    var obj = new THREE.Line(geometry, new THREE.LineBasicMaterial({color: 0x339900, linewidth: 100}));
    var spiralName = "spiral" + s;
    obj.name = spiralName;
    scene.add(obj);
  }

  var spiralScene = {
        name: 'spiral',
        scene: scene,
        camera: camera,
        onUpdate: function(framework) {
          var offset = 0.05;
            if (framework.audioSourceBuffer.buffer != undefined) {
                var array =  new Uint8Array(framework.audioAnalyser.frequencyBinCount);
                framework.audioAnalyser.getByteFrequencyData(array);
                offset = getAverageVolume(array)/250;
            }
          for (var i = 0; i < numSpirals; i++) {
            var spiralName = "spiral" + i;
            var spiral = framework.scene.getObjectByName(spiralName);
            spiral.rotation.z += offset;
            spiral.geometry.verticesNeedUpdate = true;
          }
        }
    }

    allScenes.push(spiralScene);
}

function initializeIcosahedron(framework) {
	var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    var controls = new OrbitControls(camera, framework.renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = true;
    controls.target.set(0, 0, 0);
    controls.rotateSpeed = 0.3;
    controls.zoomSpeed = 1.0;
    controls.panSpeed = 2.0;

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

function initializeStarField() {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);

    var randomPoints = [];
    for ( var i = 0; i < 100; i ++ ) {
        randomPoints.push(
            new THREE.Vector3(Math.random() * 200 - 100, Math.random() * 200 - 100, Math.random() * 200 - 100)
        );
    }
    var spline = new THREE.SplineCurve3(randomPoints);
    var camPosIndex = 0;

    for (var i = 0; i < 400; i++) {
      var b = new THREE.Mesh(
        new THREE.BoxGeometry(1,1,1),
        new THREE.MeshBasicMaterial({color: "#EEEDDD"})
      );
      
      b.position.x = -300 + Math.random() * 600;
      b.position.y = -300 + Math.random() * 600;  
      b.position.z = -300 + Math.random() * 600;
      
      scene.add(b);
    }

    camera.position.z = 5;

    var starfieldScene = {
        name: 'starfield',
        scene: scene,
        camera: camera,
        onUpdate: function(framework) {
            camPosIndex++;
            if (camPosIndex > 10000) {
                camPosIndex = 0;
            }
            var offset = 0;
            if (framework.audioSourceBuffer.buffer != undefined) {
                var array =  new Uint8Array(framework.audioAnalyser.frequencyBinCount);
                framework.audioAnalyser.getByteFrequencyData(array);
                offset = getAverageVolume(array);
            }

            var camPos = spline.getPoint(camPosIndex / 10000);

            framework.camera.position.x = camPos.x + offset;
            framework.camera.position.y = camPos.y + offset;
            framework.camera.position.z = camPos.z + offset;

            framework.camera.lookAt(spline.getPoint((camPosIndex+1) / 10000));
        }
    }

    allScenes.push(starfieldScene);
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
  getScene: getScene,
  getSceneByIndex: getSceneByIndex,
  getNumScenes: getNumScenes
}
