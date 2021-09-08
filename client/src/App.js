import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./App.css";
import { PhoneOutlined } from "@ant-design/icons";
import * as faceapi from "face-api.js";
import TokMenu from "./blocks/TokMenu";
import TokVideo from "./blocks/TokVideo";
import TokChat from "./blocks/TokChat";
import TokRoom from "./blocks/TokRoom";
import TokLogin from "./blocks/TokLogin";
import PrivateRoute from "./utils/PrivateRoute";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";

import {
  Form,
  Button,
  Card,
  Input,
  Select,
  Row,
  Col,
  Layout,
  Menu,
  Breadcrumb,
  InputNumber,
} from "antd";

const { Header, Content, Footer, Sider } = Layout;
const { SubMenu } = Menu;

const OT = require("@opentok/client");
const { Option } = Select;
function App() {
  const [auth, setAuth] = useState(true);

  const [msgData, setMsgData] = useState([
    { msg: "Welcome", classText: "self", time: new Date() },
  ]);
  const [form] = Form.useForm();
  const prefixSelector = (
    <Form.Item name="prefix" noStyle>
      <Select style={{ width: 70 }}>
        <Option value="1">+1</Option>
      </Select>
    </Form.Item>
  );
  const formItemLayout = {
    labelCol: {
      xs: { span: 24 },
      sm: { span: 8 },
    },
    wrapperCol: {
      xs: { span: 24 },
      sm: { span: 16 },
    },
  };
  const tailFormItemLayout = {
    wrapperCol: {
      xs: {
        span: 24,
        offset: 0,
      },
      sm: {
        span: 16,
        offset: 8,
      },
    },
  };

  const onFinish = (values) => {
    fetch("http://192.168.254.66:3001/call/" + values.prefix + "" + values.phone, {
      method: "GET",
    })
      .then((res) => res.json())
      .then((response) => {})
      .catch((error) => console.log(error));
    console.log("Received values of form: ", values);
  };

  return (
    <Router>
      <Switch>
        <PrivateRoute authed={auth} path="/room">
          <div className="App">
            <Layout style={{ minHeight: "100vh" }}>
              <TokMenu />
              <Layout className="site-layout">
                <Content style={{ margin: "0 16px" }}>
                  <div
                    className="site-layout-background"
                    style={{ padding: 24, minHeight: 360 }}
                  >
                    {" "}
                    <TokRoom />
                  </div>
                </Content>
                <Footer style={{ textAlign: "center" }}>Vonage ©2020</Footer>
              </Layout>
            </Layout>
          </div>
        </PrivateRoute>

        <PrivateRoute authed={auth} path="/voice">
          <div className="App">
            <Layout style={{ minHeight: "100vh" }}>
              <TokMenu />
              <Layout className="site-layout">
                <Content style={{ margin: "0 16px" }}>
                  <div
                    className="site-layout-background"
                    style={{ padding: 24, minHeight: 360 }}
                  >
                    <Card
                      title="Voice Api Demo - Comminicate with Customers"
                      style={{ width: 450 }}
                    >
                      <Form
                        {...formItemLayout}
                        form={form}
                        name="register"
                        onFinish={onFinish}
                        initialValues={{
                          prefix: "1",
                        }}
                        scrollToFirstError
                      >
                        <Form.Item
                          name="phone"
                          label="Phone Number"
                          rules={[
                            {
                              required: true,
                              message: "Please input your phone number!",
                            },
                          ]}
                        >
                          <Input
                            addonBefore={prefixSelector}
                            style={{ width: "100%" }}
                          />
                        </Form.Item>
                        <Form.Item {...tailFormItemLayout}>
                          <Button
                            shape="circle"
                            icon={<PhoneOutlined />}
                            type="primary"
                            htmlType="submit"
                          />
                        </Form.Item>
                      </Form>
                    </Card>
                  </div>
                </Content>
                <Footer style={{ textAlign: "center" }}>Vonage ©2020</Footer>
              </Layout>
            </Layout>
          </div>
        </PrivateRoute>

        <PrivateRoute authed={auth} path="/party">
          <div className="App">
            <Layout style={{ minHeight: "100vh" }}>
              <TokMenu />
              <Layout className="site-layout">
                <Content style={{ margin: "0 16px" }}>
                  <div
                    className="site-layout-background"
                    style={{ padding: 24, minHeight: 360 }}
                  ></div>
                </Content>
                <Footer style={{ textAlign: "center" }}>Vonage ©2020</Footer>
              </Layout>
            </Layout>
          </div>
          }
        </PrivateRoute>

        <PrivateRoute authed={auth} path="/together">
          <div className="App">
            <Layout style={{ minHeight: "100vh" }}>
              <TokMenu />
              <Layout className="site-layout">
                <Content style={{ margin: "0 16px" }}>
                  <div
                    className="site-layout-background"
                    style={{ padding: 24, minHeight: 360 }}
                  >
                    <Row>
                      <Col flex="520px">
                        <TokVideo idx="subscribers_custom" role="subscriber" />
                      </Col>
                      <Col flex="auto">
                        <TokVideo idx="publisher_custom" role="publisher" />
                      </Col>
                    </Row>
                  </div>
                </Content>
                <Footer style={{ textAlign: "center" }}>Vonage ©2020</Footer>
              </Layout>
            </Layout>
          </div>
          }
        </PrivateRoute>

        <PrivateRoute authed={auth} path="/interaction">
          <div className="App">
            <Layout style={{ minHeight: "100vh" }}>
              <TokMenu />
              <Layout className="site-layout">
                <Content style={{ margin: "0 16px" }}>
                  <div
                    className="site-layout-background"
                    style={{ padding: 24, minHeight: 360 }}
                  >
                    <Row>
                      <Col flex="auto">
                        <TokVideo
                          idx="publisher_custom"
                          role="publisher"
                          extra="interaction"
                        />
                      </Col>
                    </Row>
                  </div>
                </Content>
                <Footer style={{ textAlign: "center" }}>Vonage ©2020</Footer>
              </Layout>
            </Layout>
          </div>
          }
        </PrivateRoute>

        <Route path="/login">
          <div className="App">
            <Layout style={{ minHeight: "100vh" }}>
              <Layout id="site-layout-login" className="site-layout-login">
                <Content style={{ margin: "0 16px" }}>
                  <div
                    className="site-layout-background-login"
                    style={{
                      padding: 24,
                      minHeight: 360,
                      left: "calc(50vw - 380px)",
                      top: 60,
                      position: "absolute",
                    }}
                  >
                    <TokLogin setAppAuth={setAuth} />
                  </div>
                </Content>
              </Layout>
            </Layout>
          </div>
        </Route>
        <PrivateRoute authed={auth} exact path="/">
          <div className="App">
            <Layout style={{ minHeight: "100vh" }}>
              <TokMenu />
              <Layout className="site-layout">
                <Content style={{ margin: "0 16px" }}>
                  <div
                    className="site-layout-background"
                    style={{ padding: 24, minHeight: 360 }}
                  >
                    <Row>
                      <Col flex="520px">
                        <TokVideo idx="subscribers_custom" role="subscriber" />
                      </Col>
                      <Col flex="auto">
                        <TokVideo
                          idx="publisher_custom"
                          role="publisher"
                          chat={true}
                        />
                      </Col>
                    </Row>
                  </div>
                </Content>
                <Footer style={{ textAlign: "center" }}>Vonage ©2020</Footer>
              </Layout>
            </Layout>
          </div>
        </PrivateRoute>
      </Switch>
    </Router>
  );
}

function handleError(error) {
  if (error) {
    alert(error.message);
  }
}
export default App;
