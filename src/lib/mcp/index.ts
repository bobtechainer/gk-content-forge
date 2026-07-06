import { defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";

export default defineMcp({
  name: "gk-content-forge-mcp",
  title: "Trường học số MCP",
  version: "0.1.0",
  instructions:
    "Công cụ cho ứng dụng Trường học số (gk-content-forge). Dùng `echo` để kiểm tra kết nối.",
  tools: [echoTool],
});