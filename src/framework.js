
const THREE = require('three');
const OrbitControls = require('three-orbit-controls')(THREE)
import Stats from 'stats-js'
import DAT from 'dat-gui'

// when the scene is done initializing, the function passed as `callback` will be executed
// then, every frame, the function passed as `update` will be executed
function init(callback, update) {
  var gui = new DAT.GUI();

  var framework = {
    gui: gui
  };

  // run this function after the window loads
  window.addEventListener('load', function() {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    var renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x020202, 0);

    var controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = true;
    controls.target.set(0, 0, 0);
    controls.rotateSpeed = 0.3;
    controls.zoomSpeed = 1.0;
    controls.panSpeed = 2.0;

    document.body.appendChild(renderer.domElement);

    // resize the canvas when the window changes
    window.addEventListener('resize', function() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // set up audio processing
    framework.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    // create analyser
    framework.audioAnalyser = framework.audioContext.createAnalyser();
    framework.audioAnalyser.smoothingTimeConstant = 0.3;
    framework.audioAnalyser.fftSize = 1024;
    
    // create the source buffer
    framework.audioSourceBuffer = framework.audioContext.createBufferSource();

    // connect source and analyser
    framework.audioSourceBuffer.connect(framework.audioAnalyser);
    framework.audioAnalyser.connect(framework.audioContext.destination);


    // add drag and drop functionality for uploading audio file
    window.addEventListener("dragenter", dragenter, false);  
    window.addEventListener("dragover", dragover, false);
    window.addEventListener("drop", drop, false);

    function dragenter(e) {
      e.stopPropagation();
      e.preventDefault();
    }

    function dragover(e) {
      e.stopPropagation();
      e.preventDefault();
    }

    function drop(e) {
      e.stopPropagation();
      e.preventDefault();
      if (framework.audioFile == undefined) {
        framework.audioFile = e.dataTransfer.files[0];

        var fileName = framework.audioFile.name;
        document.getElementById('guide').innerHTML = "Playing " + fileName;
        var fileReader = new FileReader();
        
        fileReader.onload = function (e) {
            var fileResult = fileReader.result;
            framework.audioContext.decodeAudioData(fileResult, function(buffer) {
              framework.audioSourceBuffer.buffer = buffer;
              framework.audioSourceBuffer.start();
              framework.audioSourceBuffer.loop = true;
            }, function(e){"Error with decoding audio data" + e.err});
            
            //visualizer.start(fileResult);
        };
        fileReader.readAsArrayBuffer(framework.audioFile);

        //handleFiles(files);
      } else {
        // stop current visualization and load new song
      }
    }

    // assign THREE.js objects to the object we will return
    framework.scene = scene;
    framework.camera = camera;
    framework.renderer = renderer;

    // begin the animation loop
    (function tick() {
      update(framework); // perform any requested updates
      renderer.render(scene, camera); // render the scene
      requestAnimationFrame(tick); // register to call this again when the browser renders a new frame
    })();

    // we will pass the scene, gui, renderer, camera, etc... to the callback function
    return callback(framework);
  });

}

export default {
  init: init
}

export const PI = 3.14159265
export const e = 2.7181718