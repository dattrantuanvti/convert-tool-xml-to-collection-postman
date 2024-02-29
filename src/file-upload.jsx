import { UploadOutlined } from "@ant-design/icons";
import { Button, message, Space, Upload } from "antd";

const FileUpload = ({ onUpload, setLoading }) => {
  const props = {
    name: "file",
    headers: {
      authorization: "authorization-text",
    },
    beforeUpload(info) {
      let reader = new FileReader();
      reader.onload = (e) => {
        if (e.target.result) {
          const scenarioName = info.name.split(".")[0];
          onUpload(e.target.result, scenarioName);
          message.success(`File đã được tải lên thành công!`);
        } else {
          message.error(`${info.file.name} file tải lên thất bại!`);
        }
        setLoading(false);
      };
      reader.readAsText(info);
      return false;
    },
    accept: ".dar.webapiset",
    maxCount: 1,
  };
  return (
    <Space size="large">
      <Upload
        beforeUpload={() => {
          setLoading(true);
        }}
        {...props}
      >
        <Button icon={<UploadOutlined />}>Upload single file</Button>
      </Upload>
    </Space>
  );
};
export default FileUpload;
