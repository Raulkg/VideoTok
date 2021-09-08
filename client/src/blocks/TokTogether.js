import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Card, Button } from "antd";

import {
  SaveFilled,
  SlackOutlined,
  CameraOutlined,
  EditOutlined,
  EllipsisOutlined,
  SettingOutlined,
  FireOutlined,
} from "@ant-design/icons";
import * as bodyPix from "@tensorflow-models/body-pix";
const { Meta } = Card;
const OT = require("@opentok/client");
var session;
var publisher;
var bgImageData;
var bgCanvas;
var maskBackground = true;
function TokTogether(props) {
  const [bgProcess, setBgProcess] = useState(false);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [isScreenShare, setIsScreenShare] = useState(false);
  const [data, setData] = useState({});
  const [msgData, setMsgData] = useState([
    { msg: "Welcome", classText: "self", time: new Date() },
  ]);
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

  var Filter = require("bad-words"),
    filter = new Filter();

  filter.addWords("some", "bad", "word");

  const addMessage = (t, c, time) => {
    setMsgData((msgData) => [
      ...msgData,
      { msg: filter.clean(t), classText: c, time: new Date(time) },
    ]);
  };

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

    session.on("signal:msg", function signalCallback(event) {
      addMessage(
        event.data,
        event.from.connectionId === session.connection.connectionId
          ? "self"
          : "others",
        event.from.creationTime
      );
    });
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

  function submitMsgData(val) {
    session.signal(
      {
        type: "msg",
        data: val,
      },
      function signalCallback(error) {
        if (error) {
          console.error("Error sending signal:", error.name, error.message);
        } else {
        }
      }
    );
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
      extractPerson(segmentation, canvas, videoElement);

      //      bodyPix.drawMask(
      //        canvas,
      //        videoElement,
      //        backgroundDarkeningMask,
      //        opacity,
      //        maskBlurAmount,
      //        flipHorizontal
      //      );
      requestAnimationFrame(drawMaskRender);
    }
    drawMaskRender();
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

  function extractPerson(
    personOrPartSegmentation:
      | SemanticPersonSegmentation
      | SemanticPartSegmentation
      | PersonSegmentation[]
      | PartSegmentation[],
    canvas,
    image
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
    const subBytes = new Uint8ClampedArray(width * height * 4);

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.drawImage(image, 0, 0);
    let currData = ctx.getImageData(0, 0, width, height);
    let subData;
    const subscriberVideoElement = document.querySelector(
      "#subscribers_custom  div.OT_widget-container > video"
    );
    if (subscriberVideoElement) {
      ctx.drawImage(subscriberVideoElement, 0, 0);
      subData = ctx.getImageData(0, 0, width, height);
    }

    for (let i = 0; i < height; i += 1) {
      for (let j = 0; j < width; j += 1) {
        //(row + i) * width + (column + j)
        const n = i * width + j;
        bytes[4 * n + 0] = 0;
        bytes[4 * n + 1] = 0;
        bytes[4 * n + 2] = 0;
        bytes[4 * n + 3] = 0;

        if (multiPersonOrPartSegmentation[0].data[n]) {
          bytes[4 * n + 0] = currData.data[4 * n + 0];
          bytes[4 * n + 1] = currData.data[4 * n + 1];
          bytes[4 * n + 2] = currData.data[4 * n + 2];
          bytes[4 * n + 3] = currData.data[4 * n + 3];
        }
      }
    }
    if (subData)
      for (let i = 0; i < height; i += 1) {
        for (let j = width; j < width; j += 1) {
          //(row + i) * width + (column + j)
          const n = i * width + j;
          subBytes[4 * n + 0] = 0;
          subBytes[4 * n + 1] = 0;
          subBytes[4 * n + 2] = 0;
          subBytes[4 * n + 3] = 0;

          if (multiPersonOrPartSegmentation[0].data[n]) {
            subBytes[4 * n + 0] = subData.data[4 * n + 0];
            subBytes[4 * n + 1] = subData.data[4 * n + 1];
            subBytes[4 * n + 2] = subData.data[4 * n + 2];
            subBytes[4 * n + 3] = subData.data[4 * n + 3];
          }
        }
      }

    ctx.putImageData(new ImageData(bytes, width, height), 0, 0);
    const mergeCanvas = document.getElementById("merge-output");
    mergeCanvas.width = width;
    mergeCanvas.height = height;

    let img = document.getElementById("bg");
    let tempContext = bgCanvas.getContext("2d");
    tempContext.drawImage(img, 0, 0, img.width, img.height, 0, 0, 640, 480);
    bgImageData = tempContext.getImageData(0, 0, 640, 480);

    let mergeCxt = mergeCanvas.getContext("2d");
    mergeCxt.putImageData(bgImageData, 0, 0);
    mergeCxt.drawImage(
      canvas,
      0,
      canvas.height * 0.6,
      canvas.width * 0.4,
      canvas.height * 0.4
    );

    ctx.putImageData(new ImageData(subBytes, width, height), 0, 0);
    mergeCxt.drawImage(
      canvas,
      canvas.width * 0.2,
      canvas.height * 0.6,
      canvas.width * 0.4,
      canvas.height * 0.4
    );
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
    <div id="main">
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

  return (
    <Wrapper>
      <div id={props.idx} className="video-tok"></div>
      {screenProxy}
      {props.role == "publisher" ? actions : []}
      {props.role == "publisher" ? bg : ""}
      {props.role == "publisher" ? backGroundDom : ""}
      <div id="screen-capture" style={{ position: "absolute" }}>
        {" "}
      </div>
    </Wrapper>
  );
}
export default TokVideo;
