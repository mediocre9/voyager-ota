import { Logger } from "@utils/logger";
import mqtt from "mqtt";
import { Server } from "socket.io";
import { log } from "console";

const io = new Server({
  transports: ["websocket"],
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (_) => {
  Logger.info("webscoket server up!");
});

const client = mqtt.connect("mqtts://z8112f26.ala.asia-southeast1.emqxsl.com:8883", {
  port: 8883,
  clean: true,
  clientId: "voyager",
  username: "voyager_telemetry_sub_service",
  password: "123",
  connectTimeout: 4000,
  reconnectPeriod: 1000,
});

client.on("error", (error: unknown) => {
  if (error === "string") Logger.error(`Error: ${error.toString()}`);
});

client.on("connect", (packet: mqtt.IConnackPacket) => {
  Logger.info("Telemetry Service is Up!");
  client.subscribe("telemetry-data");
});

type SocketData = {
  rssi: string;
  version: string;
  freeHeap: string;
  username: string;
  deviceId: string;
  clientId: string;
  projectId: string;
};

client.on("message", (topic, payload) => {
  if (topic === "telemetry/#") {
    log(topic);
    const data = JSON.parse(payload.toString()) as SocketData;
    log({ ...data });
    io.emit("message", data);
  }
});

export default io;
