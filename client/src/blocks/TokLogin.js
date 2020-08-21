import React, { useRef, useEffect, useState } from "react";
import { Redirect, useHistory, useLocation } from "react-router-dom";

import { Card, Avatar, Form, Input, Button, Checkbox } from "antd";
import { PhoneOutlined } from "@ant-design/icons";
import { TweenMax, Linear } from "gsap";
import CSSPlugin from "gsap/CSSPlugin";
const { Meta } = Card;

const C = CSSPlugin;
function TokLogin(props) {
  let history = useHistory();
  let location = useLocation();
  let { from } = location.state || { from: { pathname: "/" } };
  const [requestId, setRequestId] = useState("");
  const [login, setLogin] = useState(false);
  const [twofactor, setTwofactor] = useState("");
  const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
  };
  const tailLayout = {
    wrapperCol: { offset: 8, span: 8 },
  };

  const onFinish = (values) => {
    let pin = values.password;

    fetch(
      `http://10.0.0.18:3001/validate/${requestId.request_id}?code=${pin}`,
      {
        method: "GET",
      }
    )
      .then((res) => res.json())
      .then((response) => {
        console.log(response);
        if (response.result.status == 0) {
          setLogin(true);
          props.setAppAuth(true);
          history.push(from, { auth: true });

          setTwofactor(response.result);
        } else {
          setLogin(false);
          setTwofactor(response.result);
        }
      })
      .catch((error) => console.log(error));

    console.log("Success:", values);
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  const requestOtp = () => {
    fetch(`http://10.0.0.18:3001/verify`, {
      method: "GET",
    })
      .then((res) => res.json())
      .then((response) => {
        console.log(response);
        setRequestId(response);
      })
      .catch((error) => console.log(error));
  };
  let blobRef1 = useRef(null);
  let blobRef2 = useRef(null);
  let blobRef3 = useRef(null);
  let blobRef4 = useRef(null);
  let blobRef5 = useRef(null);

  useEffect(() => {
    TweenMax.to(
      blobRef1,
      1,
      {
        duration: 10,
        repeat: -1,
        rotation: 360,
        yoyo: true,
        ease: Linear.easeNone,
      },
      0.3
    ).duration(10);

    TweenMax.to(
      blobRef3,
      1,
      {
        duration: 200,
        repeat: -1,
        yoyo: true,
        rotation: 160,
        x: Math.random() * 800,
        y: Math.random() * 600,
        ease: Linear.easeNone,
      },
      0.3
    ).duration(10);
  }, []);

  let radius = 8;

  return (
    <>
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" id="loader">
        <defs>
          <filter id="goo">
            <feGaussianBlur
              in="SourceGraphic"
              result="blur"
              stdDeviation="10"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"
            />
            <feBlend in2="goo" in="SourceGraphic" result="mix" />
          </filter>
          <linearGradient id="MyGradient">
            <stop offset="0%" stopColor="#ff9ab8" />
            <stop offset="45%" stopColor="#ff7eb8" />

            <stop offset="100%" stopColor="#b232ba" />
          </linearGradient>
        </defs>
        <mask id="maska">
          <g className="blobs">
            <circle
              className="blob"
              ref={(element) => {
                blobRef1 = element;
              }}
              cx="440"
              cy="250"
              r="30"
              transform="rotate(0) translate(0, 0) rotate(0)"
            />
            <circle
              className="blob"
              ref={(element) => {
                blobRef2 = element;
              }}
              cx="500"
              cy="320"
              r="70"
              transform="rotate(0) translate(0, 0) rotate(0)"
            />
            <circle
              className="blob"
              ref={(element) => {
                blobRef3 = element;
              }}
              cx="300"
              cy="390"
              r="40"
              transform="rotate(0) translate(0, 0) rotate(0)"
            />
            <circle
              className="blob"
              ref={(element) => {
                blobRef4 = element;
              }}
              cx="380"
              cy="390"
              r="80"
              transform="rotate(0) translate(0, 0) rotate(0)"
            />
            <circle
              className="blob"
              ref={(element) => {
                blobRef5 = element;
              }}
              cx="470"
              cy="450"
              r="20"
              transform="rotate(0) translate(0, 0) rotate(0)"
            />
          </g>
        </mask>
        <rect
          x="200"
          y="200"
          mask="url(#maska)"
          fill="url(#MyGradient)"
          width="400"
          height="400"
        />
      </svg>

      <Form
        {...layout}
        name="basic"
        initialValues={{ remember: true }}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
      >
        <Card
          style={{ width: 650 }}
          cover={
            <img alt="example" src="http://localhost:3001/images/logo.png" />
          }
          actions={[
            <Form.Item {...tailLayout}>
              <Button
                type="primary"
                shape="round"
                icon={<PhoneOutlined />}
                onClick={requestOtp}
              >
                Request OTP
              </Button>
            </Form.Item>,
            <Form.Item {...tailLayout}>
              <Button type="primary" shape="round" htmlType="submit">
                Submit
              </Button>
            </Form.Item>,
          ]}
        >
          <Form.Item
            label="OTP"
            name="password"
            rules={[{ required: true, message: "Please input your OTP!" }]}
          >
            <Input.Password />
          </Form.Item>

          {requestId
            ? `PIN is sent to +1 315 420 7439 . Request ID : ${requestId.request_id}`
            : ""}
          <br />

          {login
            ? `Login Success. Charged : ${twofactor.price}`
            : twofactor
            ? `${twofactor.error_text} . Please Retry `
            : ""}
        </Card>
      </Form>
    </>
  );
}

export default TokLogin;
