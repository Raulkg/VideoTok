import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import * as THREE from "three";
import TokVideo from "./TokVideo";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
function TokRoom(props) {
  useEffect(() => {
    let scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcce0ff);
    scene.fog = new THREE.Fog(0xcce0ff, 500, 10000);
    let camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    scene.add(new THREE.AmbientLight(0x666666));

    var light = new THREE.DirectionalLight(0xdfebff, 1);
    light.position.set(50, 200, 100);
    light.position.multiplyScalar(1.3);

    light.castShadow = true;

    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    var d = 300;
    light.shadow.camera.left = -d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = -d;

    light.shadow.camera.far = 1000;

    scene.add(light);
    var loader = new THREE.TextureLoader();
    var groundTexture = loader.load(
      "http://192.168.254.66:3001/images/grasslight-big.jpg"
    );
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(25, 25);
    groundTexture.anisotropy = 16;
    groundTexture.encoding = THREE.sRGBEncoding;

    var groundMaterial = new THREE.MeshLambertMaterial({ map: groundTexture });

    var mesh = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(20000, 20000),
      groundMaterial
    );
    mesh.position.y = -250;
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);

    setTimeout(() => {
      let mount = document.querySelector("#threeRoom");

      let video = document.querySelector(".OT_video-element");
      console.log(video);
      let texture = new THREE.VideoTexture(video);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.format = THREE.RGBFormat;

      let geometry = new THREE.PlaneBufferGeometry(16, 9);
      //            let geometry = new THREE.CircleBufferGeometry(5, 32);
      geometry.scale(0.5, 0.5, 0.5);
      let material = new THREE.MeshBasicMaterial({ map: texture });

      var count = 5;
      var alternate = 2;
      var zVal = 1;

      for (var i = 1, l = count; i <= l; i++) {
        var phi = Math.acos((2 * i) / l);
        var theta = Math.sqrt(l * Math.PI) * phi;

        for (var j = 1; j <= count; j++) {
          var mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(alternate - 30 + j * 8, i * 3 - 10, zVal);

          //        mesh.lookAt(camera.position);
          scene.add(mesh);
        }
        alternate = -alternate;
        zVal--;
      }

      let renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);

      mount.appendChild(renderer.domElement);

      let controls = new OrbitControls(camera, renderer.domElement);
      controls.enableZoom = true;
      controls.enablePan = true;

      camera.position.z = 5;
      let animate = function () {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();
    }, 10000);
  });

  return (
    <>
      <TokVideo idx="publisher_custom" role="publisher" />
      <div id="threeRoom" />
    </>
  );
}

export default TokRoom;
