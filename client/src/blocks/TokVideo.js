import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Card, Button } from "antd";
import TokChat from "./TokChat";
import {
  SaveFilled,
  CameraOutlined,
  EditOutlined,
  EllipsisOutlined,
  SettingOutlined,
  FireOutlined,
  SlackOutlined,
} from "@ant-design/icons";

import * as bodyPix from "@tensorflow-models/body-pix";
//import * as facemesh_module from '@tensorflow-models/facemesh';
const facemesh_module = require('@tensorflow-models/facemesh');
//import * as tf from '@tensorflow/tfjs';
const { Meta } = Card;
const OT = require("@opentok/client");
var session;
var publisher;
var bgImageData;
var bgCanvas;
var maskBackground = true;

const defaultPoseNetArchitecture = 'MobileNetV1';
const defaultQuantBytes = 2;
const defaultMultiplier = 1.0;
const defaultStride = 16;
const defaultInputResolution = 200;

const facePartName2Index = {
    'topMid': 10,
    'rightTop0': 67,
    'rightTop1': 54,
    'leftTop0': 297,
    'leftTop1': 284,
    'rightJaw0': 21,
    'rightJaw1': 162,
    'rightJaw2': 127,
    'rightJaw3': 234,
    'rightJaw4': 132,
    'rightJaw5': 172,
    'rightJaw6': 150,
    'rightJaw7': 176,
    'jawMid': 152,   // 0 - 8
    'leftJaw7': 400,
    'leftJaw6': 379,
    'leftJaw5': 397,
    'leftJaw4': 361,
    'leftJaw3': 454,
    'leftJaw2': 356,
    'leftJaw1': 389,
    'leftJaw0': 251, // 9 - 16
    'rightBrow0': 46,
    'rightBrow1': 53,
    'rightBrow2': 52,
    'rightBrow3': 65,
    'rightBrow4': 55, // 17 - 21
    'leftBrow4': 285,
    'leftBrow3': 295,
    'leftBrow2': 282,
    'leftBrow1': 283,
    'leftBrow0': 276, // 22 - 26
    'nose0': 6,
    'nose1': 197,
    'nose2': 195,
    'nose3': 5, // 27 - 30
    'rightNose0': 48,
    'rightNose1': 220,
    'nose4': 4,
    'leftNose1': 440,
    'leftNose0': 278, // 31 - 35
    'rightEye0': 33,
    'rightEye1': 160,
    'rightEye2': 158,
    'rightEye3': 133,
    'rightEye4': 153,
    'rightEye5': 144, // 36 - 41
    'leftEye3': 362,
    'leftEye2': 385,
    'leftEye1': 387,
    'leftEye0': 263,
    'leftEye5': 373,
    'leftEye4': 380, // 42 - 47
    'rightMouthCorner': 61,
    'rightUpperLipTop0': 40,
    'rightUpperLipTop1': 37,
    'upperLipTopMid': 0,
    'leftUpperLipTop1': 267,
    'leftUpperLipTop0': 270,
    'leftMouthCorner': 291, // 48 - 54
    'leftLowerLipBottom0': 321,
    'leftLowerLipBottom1': 314,
    'lowerLipBottomMid': 17,
    'rightLowerLipBottom1': 84,
    'rightLowerLipBottom0': 91, // 55 - 59
    'rightMiddleLip': 78,
    'rightUpperLipBottom1': 81,
    'upperLipBottomMid': 13,
    'leftUpperLipBottom1': 311,
    'leftMiddleLip': 308, // 60 - 64
    'leftLowerLipTop0': 402,
    'lowerLipTopMid': 14,
    'rightLowerLipTop0': 178, // 65 - 67
};

function TokVideo(props) {
  const [bgProcess, setBgProcess] = useState(false);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [isScreenShare, setIsScreenShare] = useState(false);
  const [data, setData] = useState({});

  useEffect(() => {
    fetch(`http://192.168.254.66:3001/apidata`, {
      method: "GET",
    })
      .then((res) => res.json())
      .then((response) => {
        setIsLoading(false);
        setData(response);
        if (props.role == "publisher") {
          initializeSession(
            response.apiKey,
            response.sessionId,
            response.token
          );
        }
        onLoad();
      })
      .catch((error) => console.log(error));
  }, [page]);

  function initializeSession(apiKey, sessionId, token) {
    // Initialize an OpenTok Session object
    session = OT.initSession(apiKey, sessionId);

    let canvas = document.getElementById("output");
    // Initialize a Publisher, and place it into the element with id="publisher"
    publisher = OT.initPublisher("publisher_custom", {
      videoSource: canvas.captureStream(20).getVideoTracks()[0],
    });

    // Attach event handlers
    session.on({
      // This function runs when session.connect() asynchronously completes
      sessionConnected: function () {
        // Publish the publisher we initialzed earlier (this will trigger 'streamCreated' on other
        // clients)
        session.publish(publisher);
      },

      // This function runs when another client publishes a stream (eg. session.publish())
      streamCreated: function (event) {
        session.subscribe(event.stream, "subscribers_custom", {
          insertMode: "append",
          width: "100%",
          height: "100%",
        });
      },
    });

    // Connect to the Session using the 'apiKey' of the application and a 'token' for permission
    session.connect(token);

    //
  }

  function onScreenCapture() {
    let imgData = publisher.getImgData();
    let img = document.createElement("img");
    img.className += " scapture";
    img.setAttribute("src", "data:image/png;base64," + imgData);
    let myNode = document.getElementById("screen-capture");
    myNode.innerHTML = "";
    myNode.appendChild(img);
    img.onclick = () =>
      downloadBase64File(myNode, imgData, "screen-capture.png");
  }

  function downloadBase64File(myNode, base64Data, fileName) {
    myNode.innerHTML = "";
    const linkSource = `data:image;base64,${base64Data}`;
    const downloadLink = document.createElement("a");
    downloadLink.href = linkSource;
    downloadLink.download = fileName;
    downloadLink.click();
  }

  function enableScreenShare() {
    setIsScreenShare(true);
    console.log("Screen Share Starting....");
    OT.checkScreenSharingCapability(function (response) {
      if (!response.supported || response.extensionRegistered === false) {
        console.log("This browser does not support screen sharing");
      } else if (response.extensionInstalled === false) {
        console.log("Prompt to install the extension.");
      } else {
        // Screen sharing is available. Publish the screen.
        var publisher = OT.initPublisher(
          "screen-preview",
          { videoSource: "screen", maxResolution: { width: 600, height: 600 } },
          function (error) {
            if (error) {
              console.log(error);
            } else {
              session.publish(publisher, function (error) {
                if (error) {
                  console.log(error);
                }
              });
            }
          }
        );

        publisher.on("mediaStopped", function (event) {
          console.log("Screen Sharing Stopped");
          setIsScreenShare(false);
        });

        publisher.on("streamDestroyed", function (event) {
          if (event.reason === "mediaStopped") {
            console.log("Screen Sharing Stopped");

            setIsScreenShare(false);
          } else if (event.reason === "forceUnpublished") {
            // A moderator forced the user to stop sharing.

            console.log("Screen Sharing Stopped by Moderator");
            console.log(event);
            setIsScreenShare(false);
          }
        });
      }
    });
  }

  async function getDeviceIdForLabel(cameraLabel) {
    const videoInputs = await getVideoInputs();

    for (let i = 0; i < videoInputs.length; i++) {
      const videoInput = videoInputs[i];
      if (videoInput.label === cameraLabel) {
        return videoInput.deviceId;
      }
    }

    return null;
  }

  async function getConstraints(cameraLabel) {
    let deviceId;
    let facingMode;

    if (cameraLabel) {
      deviceId = await getDeviceIdForLabel(cameraLabel);
      // on mobile, use the facing mode based on the camera.
      facingMode = null;
    }
    return { deviceId, facingMode };
  }

  async function getVideoInputs() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.log("enumerateDevices() not supported.");
      return [];
    }

    const devices = await navigator.mediaDevices.enumerateDevices();

    const videoDevices = devices.filter(
      (device) => device.kind === "videoinput"
    );

    return videoDevices;
  }

  async function onLoad() {
    let cameras = await getVideoInputs();
    const videoConstraints = await getConstraints(cameras[0]);
    const videoElement = document.getElementById("video");

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: videoConstraints,
    });
    videoElement.srcObject = stream;

    let t = await new Promise((resolve) => {
      videoElement.onloadedmetadata = () => {
        videoElement.width = videoElement.videoWidth;
        videoElement.height = videoElement.videoHeight;
        resolve(videoElement);
      };
    });

    t.play();

    const net = await bodyPix.load({
      architecture: "MobileNetV1",
      outputStride: 16,
      multiplier: 0.5,
      quantBytes: 2,
    });

//facemesh_module.load().then(mdl => {
//
//    console.log("model loaded");
//
//});
//   const facemesh = await facemesh_module.load();
    //more accurate
    //    const net = await bodyPix.load({
    //      architecture: "ResNet50",
    //      outputStride: 32,
    //      quantBytes: 2,
    //    });

    // Convert the segmentation into a mask to darken the background.
    const foregroundColor = { r: 0, g: 0, b: 0, a: 0 };
    const backgroundColor = { r: 0, g: 0, b: 0, a: 255 };

    const opacity = 1;
    const maskBlurAmount = 0;
    const flipHorizontal = false;
    const canvas = document.getElementById("output");
    //     Draw the mask onto the image on a canvas.  With opacity set to 0.7 and
    //     maskBlurAmount set to 3, this will darken the background and blur the
    //     darkened background's edge.

    bgCanvas = document.createElement("canvas");
    bgCanvas.id = "dummycanvas";
    bgCanvas.width = t.width;
    bgCanvas.height = t.height;

    getBgData(true);
    async function drawMaskRender() {

//    const faceDetection = await facemesh.estimateFaces(videoElement);
//    const faceDetection = await facemesh.estimateFaces(videoElement, false, true);


      const segmentation = await net.segmentPerson(videoElement, {
        flipHorizontal: false,
        internalResolution: "medium",
        segmentationThreshold: 0.7,
      });

      const backgroundDarkeningMask = toMask(
        segmentation,
        foregroundColor,
        bgImageData,
        false
      );

      if (props.extra == "interaction")
        if (segmentation.allPoses[0]) {
          let rightWrist = segmentation.allPoses[0].keypoints[10];
          let leftWrist = segmentation.allPoses[0].keypoints[9];
          console.log(segmentation.allPoses[0]);

          if (leftWrist.score > 0.1) {
            document.getElementById("yes-button").style.left =
              leftWrist.position.x - 50 + "px";
            document.getElementById("yes-button").style.top =
              leftWrist.position.y - 50 + "px";
          }

          if (rightWrist.score > 0.1) {
            document.getElementById("no-button").style.left =
              rightWrist.position.x - 50 + "px";
            document.getElementById("no-button").style.top =
              rightWrist.position.y - 50 + "px";
          }

          if (leftWrist.position.y - rightWrist.position.y > 0) {
            document.getElementById("count-button").innerHTML = "negative";
          } else {
            document.getElementById("count-button").innerHTML = "postive";
          }
        }

//              faceDetection.forEach(face => {
//              console.log(face)
//                Object.values(facePartName2Index).forEach(index => {
//                    let p = face.scaledMesh[index];
//                    drawPoint(canvas, p[1], p[0], 2, 'red');
//                });
//              });

      bodyPix.drawMask(
        canvas,
        videoElement,
        backgroundDarkeningMask,
        opacity,
        maskBlurAmount,
        flipHorizontal
      );
      requestAnimationFrame(drawMaskRender);
    }
    drawMaskRender();
  }

   function drawPoint(ctx, y, x, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }

  async function getBgData(isTransparent) {
    let img = document.getElementById("bg");
    let tempContext = bgCanvas.getContext("2d");
    if (isTransparent) {
      let imgData = tempContext.createImageData(640, 480);

      for (let i = 0; i < imgData.data.length; i += 4) {
        imgData.data[i + 0] = 255;
        imgData.data[i + 1] = 0;
        imgData.data[i + 2] = 0;
        imgData.data[i + 3] = 0;
      }

      bgImageData = imgData;
    } else {
      tempContext.drawImage(img, 0, 0, img.width, img.height, 0, 0, 640, 480);
      bgImageData = tempContext.getImageData(0, 0, 640, 480);
    }
  }

  function toMask(
    personOrPartSegmentation:
      | SemanticPersonSegmentation
      | SemanticPartSegmentation
      | PersonSegmentation[]
      | PartSegmentation[],
    foreground: Color = {
      r: 0,
      g: 0,
      b: 0,
      a: 0,
    },
    background: Color = {
      r: 0,
      g: 0,
      b: 0,
      a: 255,
    },
    drawContour = false,
    foregroundIds: number[] = [1]
  ) {
    if (
      Array.isArray(personOrPartSegmentation) &&
      personOrPartSegmentation.length === 0
    ) {
      return null;
    }

    let multiPersonOrPartSegmentation: Array<
      | SemanticPersonSegmentation
      | SemanticPartSegmentation
      | PersonSegmentation
      | PartSegmentation
    >;

    if (!Array.isArray(personOrPartSegmentation)) {
      multiPersonOrPartSegmentation = [personOrPartSegmentation];
    } else {
      multiPersonOrPartSegmentation = personOrPartSegmentation;
    }
    const { width, height } = multiPersonOrPartSegmentation[0];
    const bytes = new Uint8ClampedArray(width * height * 4);

    function drawStroke(
      bytes: Uint8ClampedArray,
      row: number,
      column: number,
      width: number,
      radius: number,
      color: Color = { r: 0, g: 255, b: 255, a: 255 }
    ) {
      for (let i = -radius; i <= radius; i++) {
        for (let j = -radius; j <= radius; j++) {
          if (i !== 0 && j !== 0) {
            const n = (row + i) * width + (column + j);
            bytes[4 * n + 0] = color.r;
            bytes[4 * n + 1] = color.g;
            bytes[4 * n + 2] = color.b;
            bytes[4 * n + 3] = color.a;
          }
        }
      }
    }

    function isSegmentationBoundary(
      segmentationData: Uint8Array | Int32Array,
      row: number,
      column: number,
      width: number,
      foregroundIds: number[] = [1],
      radius = 1
    ): boolean {
      let numberBackgroundPixels = 0;
      for (let i = -radius; i <= radius; i++) {
        for (let j = -radius; j <= radius; j++) {
          if (i !== 0 && j !== 0) {
            const n = (row + i) * width + (column + j);
            if (!foregroundIds.some((id) => id === segmentationData[n])) {
              numberBackgroundPixels += 1;
            }
          }
        }
      }
      return numberBackgroundPixels > 0;
    }

    for (let i = 0; i < height; i += 1) {
      for (let j = 0; j < width; j += 1) {
        //(row + i) * width + (column + j)
        const n = i * width + j;
        bytes[4 * n + 0] = background.data[4 * n + 0];
        bytes[4 * n + 1] = background.data[4 * n + 1];
        bytes[4 * n + 2] = background.data[4 * n + 2];
        bytes[4 * n + 3] = background.data[4 * n + 3];

        if (
          foregroundIds.some(
            (id) => id === multiPersonOrPartSegmentation[0].data[n]
          )
        ) {
          bytes[4 * n] = foreground.r;
          bytes[4 * n + 1] = foreground.g;
          bytes[4 * n + 2] = foreground.b;
          bytes[4 * n + 3] = foreground.a;
        }
      }
    }

    return new ImageData(bytes, width, height);
  }

  const Tray = styled.div`
    background: rgba(211, 211, 211, 0.3);
    border-radius: 6px;
    border: none;
    color: white;
    width: 300px;
    height: 35px;
    position: relative;
    left: 10%;
    top: -60px;
    list-style: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    opacity: 0.1;
    transition: 0.5s;
  `;

  const Wrapper = styled.div`
    &:hover ${Tray} {
      opacity: 1;
    }
  `;

  const BgHolder = styled.img`
    vertical-align: middle;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    margin: 5px 5px;
  `;

  const VerticalBox = styled.div`
    display: flex; /* establish flex container */
    flex-direction: column; /* make main axis vertical */
    justify-content: center; /* center items vertically, in this case */
    align-items: center; /* center items horizontally, in this case */
    height: 300px;
    position: absolute;
    top: 3px;
    opacity: 0;
    ${Wrapper}:hover & {
      opacity: 1;
    }
  `;

  const bg = (
    <div id="main" style={{ display: "none" }}>
      <video id="video" style={{ display: "none" }} playsInline></video>
      <canvas id="output"> </canvas>
      <canvas id="merge-output"> </canvas>
      <img id="bg" src="http://192.168.254.66:3001/images/bg1.png" />
    </div>
  );

  const actions = (
    <Tray>
      <SaveFilled key="save" />
      <SlackOutlined key="slack" onClick={enableScreenShare} />
      <CameraOutlined key="capture" onClick={onScreenCapture} />
      <FireOutlined
        key="bgremove"
        onClick={() => {
          getBgData(true);
        }}
      />
      <EllipsisOutlined key="ellipsis" />
      <SettingOutlined key="setting" />
    </Tray>
  );

  const screenProxy = (
    <div
      id="screen-preview"
      className={
        props.role == "publisher" && props.screenShare
          ? "screen-tok"
          : "no-video-tok"
      }
    ></div>
  );

  function replaceBg(e) {
    document.getElementById("bg").src = e.target.src;
    getBgData(false);
  }

  const OverlayBox = styled.div`
    display: flex; /* establish flex container */
    flex-direction: column; /* make main axis vertical */
    justify-content: center; /* center items vertically, in this case */
    align-items: center; /* center items horizontally, in this case */
    height: 300px;
    position: absolute;
    top: -93px;
    left: 60%;
  `;

  const backGroundDom = (
    <VerticalBox>
      <BgHolder
        src="http://192.168.254.66:3001/images/bg.jpg"
        onClick={(e) => replaceBg(e)}
      />
      <BgHolder
        src="http://192.168.254.66:3001/images/bg1.png"
        onClick={(e) => replaceBg(e)}
      />
      <BgHolder
        src="http://192.168.254.66:3001/images/bg2.png"
        onClick={(e) => replaceBg(e)}
      />
      <BgHolder
        src="http://192.168.254.66:3001/images/bg3.png"
        onClick={(e) => replaceBg(e)}
      />
    </VerticalBox>
  );

  const interactionDom = (
    <OverlayBox>
      <div id="count-button"> Count :</div>
      <div
        id="yes-button"
        style={{
          position: "absolute",
          padding: "20px",
          borderRadius: "4px",
          backgroundColor: "green",
          opacity: 0.8,
        }}
      >
        {" "}
        +{" "}
      </div>
      <div
        id="no-button"
        style={{
          position: "absolute",
          padding: "20px",
          borderRadius: "4px",
          backgroundColor: "red",
          opacity: 0.8,
        }}
      >
        {" "}
        -{" "}
      </div>
    </OverlayBox>
  );
  return (
    <>
      <Wrapper key={1}>
        <div id={props.idx} className="video-tok"></div>
        {screenProxy}
        {props.role == "publisher" ? actions : []}
        {props.role == "publisher" ? bg : ""}
        {props.role == "publisher" ? backGroundDom : ""}
        {props.extra == "interaction" ? interactionDom : ""}
        <div id="screen-capture" style={{ position: "absolute" }}>
          {" "}
        </div>
      </Wrapper>
      <div key={2}>{props.chat ? <TokChat session={session} /> : ""}</div>
    </>
  );
}
export default TokVideo;
