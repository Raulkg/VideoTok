import React, { useState, useEffect } from "react";
import { Input, Card } from "antd";
import {
  SaveFilled,
  SlackCircleFilled,
  CameraOutlined,
  EditOutlined,
  EllipsisOutlined,
  SettingOutlined,
} from "@ant-design/icons";
const { Meta } = Card;
const OT = require("@opentok/client");

const { Search } = Input;

function TokChat(props) {
  const [myValues, setMyValues] = useState(props.session);

  useEffect(() => {
    setMyValues(props.session);
  }, [props.session]);

  const [msgData, setMsgData] = useState([
    { msg: "Welcome", classText: "self", time: new Date() },
  ]);

  const addMessage = (t, c, time) => {
    setMsgData((msgData) => [
      ...msgData,
      { msg: filter.clean(t), classText: c, time: new Date(time) },
    ]);
  };
  var Filter = require("bad-words"),
    filter = new Filter();

  filter.addWords("some", "bad", "word");

  if (myValues)
    myValues.on("signal:msg", function signalCallback(event) {
      addMessage(
        event.data,
        event.from.connectionId === myValues.connection.connectionId
          ? "self"
          : "others",
        event.from.creationTime
      );
    });

  function submitMsgData(val) {
    //      myValues.signal(
    //        {
    //          type: "msg",
    //          data: val,
    //        },
    //        function signalCallback(error) {
    //          if (error) {
    //            console.error("Error sending signal:", error.name, error.message);
    //          } else {
    //          }
    //        }
    //      );
  }
  return (
    <div id="textchat">
      <div id="history">
        <ul className="discussion">
          {msgData.map((item, i) => {
            return (
              <li key={i} className={item.classText}>
                <div className="avatar">
                  <img src="http://10.0.0.18:3001/images/user.png" />
                </div>
                <div className="messages">
                  <p>{item.msg}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <Search
        placeholder="Input your text here"
        enterButton="Send"
        size="large"
        id="msgTxt"
        onSearch={(e) => submitMsgData(e)}
      />
    </div>
  );
}
export default TokChat;
