import { Button, Card, Col, Input, Row, Space, Tabs, message } from "antd";
import "./App.css";
import FileUpload from "./file-upload";
import { convertXmlToCollection } from "../utils/convertXmlToCollection";
import { useState } from "react";
import axios from "axios";

const initData = {
  info: {
    _postman_id: "8792db4d-d865-42c1-9fcd-94ab49284740",
    name: "USMH-auto-collection",
    schema:
      "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  item: null,
  event: [
    {
      listen: "prerequest",
      script: {
        type: "text/javascript",
        exec: [""],
      },
    },
    {
      listen: "test",
      script: {
        type: "text/javascript",
        exec: [""],
      },
    },
  ],
  variable: [
    {
      key: "URL",
      value: "http://13.112.81.234:65443",
    },
  ],
};

function App() {
  const [textCollection, setTextCollection] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = (dataXmlText, scenarioName) => {
    setTextCollection("");
    const items = convertXmlToCollection(dataXmlText, scenarioName);
    const newData = { ...initData };
    newData.item = [items];
    setTextCollection(JSON.stringify(newData));
  };

  const handleDownload = () => {
    if (!textCollection) {
      return message.error(`Bạn chưa chọn file xml cần convert!`);
    }
    const element = document.createElement("a");
    const file = new Blob([textCollection], {
      type: "application/json",
    });
    element.href = URL.createObjectURL(file);
    element.download = "collection.json";
    document.body.appendChild(element);
    element.click();
  };

  const readFileData = (reader, file) => {
    return new Promise((resolve) => {
      reader.onload = (e) => {
        if (e.target.result) {
          const scenarioName = file.name.split(".")[0];
          resolve(convertXmlToCollection(e.target.result, scenarioName));
        } else {
          message.error(`file tải lên thất bại!`);
        }
      };
      reader.readAsText(file);
    });
  };

  const handleDirectoryChange = async (event) => {
    setLoading(true);
    setTextCollection("");
    const files = event.target.files;
    const rootFolderName = files[0].webkitRelativePath.split("/")[0]?.trim();
    const items = [];
    await [...files].forEach(async (item, index) => {
      let reader = new FileReader();
      const data = await readFileData(reader, files[index]);
      items.push(data);
      if (index === [...files]?.length - 1) {
        const newData = { ...initData };
        newData.item = [
          {
            name: rootFolderName,
            item: items,
          },
        ];
        setTextCollection(JSON.stringify(newData));
        setLoading(false);
      }
    });
  };
  const items = [
    {
      key: "1",
      label: "Scenario",
      children: (
        <Space direction="vertical" size="large">
          <FileUpload setLoading={setLoading} onUpload={handleUpload} />
          <Button
            loading={loading}
            disabled={!textCollection}
            onClick={handleDownload}
          >
            Download
          </Button>
        </Space>
      ),
    },
    {
      key: "2",
      label: "Folder of scenario",
      children: (
        <Space direction="vertical" size="middle">
          <Input
            type="file"
            webkitdirectory="true"
            onChange={handleDirectoryChange}
          />
          <Button
            disabled={!textCollection}
            loading={loading}
            onClick={handleDownload}
            style={{ alignSelf: "flex-start" }}
          >
            Download
          </Button>
        </Space>
      ),
    },
  ];
  return (
    <>
      <Row
        style={{
          height: "100vh",
          background: "#000",
          justifyContent: "center",
        }}
      >
        <Col
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
          }}
        >
          <Card
            style={{ maxHeight: 460, width: 520, overflow: "auto" }}
            title="Tool convert xml to collection of postman"
          >
            <Tabs
              onChange={() => setTextCollection("")}
              defaultActiveKey="1"
              items={items}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}

export default App;
