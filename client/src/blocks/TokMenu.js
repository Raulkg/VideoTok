import React, { useState } from "react";
import { Layout, Menu } from "antd";

import {
  VideoCameraOutlined,
  PhoneOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import { useHistory } from "react-router-dom";
import { ThunderboltOutlined } from "@ant-design/icons";
const { Header, Content, Footer, Sider } = Layout;
const { SubMenu } = Menu;

function TokMenu(props) {
  const [collapsed, setCollapsed] = useState(false);
  let history = useHistory();

  const onCollapse = (collapsed) => {
    setCollapsed(collapsed);
  };
  const handleClick = (e) => {
    if (e.key == 1) {
      history.push("/");
    } else if (e.key == 2) {
      history.push("/voice");
    } else if (e.key == 3) {
      history.push("/room");
    } else if (e.key == 4) {
      history.push("/party");
    } else if (e.key == 5) {
      history.push("/interaction");
    }
  };

  return (
    <Sider collapsible collapsed={collapsed} onCollapse={onCollapse}>
      <div className="logo" />
      <Menu
        theme="dark"
        defaultSelectedKeys={["1"]}
        onClick={handleClick}
        mode="inline"
      >
        <Menu.Item key="1" icon={<VideoCameraOutlined />}>
          Video API Demo
        </Menu.Item>
        <Menu.Item key="2" icon={<PhoneOutlined />}>
          Voice API Demo
        </Menu.Item>

        <Menu.Item key="3" icon={<ThunderboltOutlined />}>
          UseCase Demo
        </Menu.Item>

        <Menu.Item key="4" icon={<CrownOutlined />}>
          Party Demo
        </Menu.Item>

        <Menu.Item key="5" icon={<CrownOutlined />}>
          Interaction Demo
        </Menu.Item>
      </Menu>
    </Sider>
  );
}

export default TokMenu;
