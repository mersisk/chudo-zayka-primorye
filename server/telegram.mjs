import net from "node:net";
import tls from "node:tls";

const timeout = (socket, ms = 15_000) => new Promise((_, reject) => socket.setTimeout(ms, () => reject(new Error("Превышено время ожидания Telegram"))));
const once = (emitter, event) => new Promise((resolve, reject) => {
  emitter.once(event, resolve);
  emitter.once("error", reject);
});

function createReader(socket) {
  const chunks = [];
  let length = 0;
  const waiters = [];
  socket.on("data", (chunk) => {
    chunks.push(chunk);
    length += chunk.length;
    while (waiters.length && length >= waiters[0].length) waiters.shift().resolve();
  });
  socket.on("error", (error) => waiters.splice(0).forEach((waiter) => waiter.reject(error)));
  return {
    async read(size) {
      if (length < size) await new Promise((resolve, reject) => waiters.push({ length: size, resolve, reject }));
      const data = Buffer.concat(chunks, length);
      const value = data.subarray(0, size);
      const rest = data.subarray(size);
      chunks.length = 0;
      length = rest.length;
      if (rest.length) chunks.push(rest);
      return value;
    },
  };
}

const write = (socket, payload) => new Promise((resolve, reject) => socket.write(payload, (error) => error ? reject(error) : resolve()));

async function connectSocks5(proxy) {
  const socket = net.createConnection({ host: proxy.proxyHost, port: proxy.proxyPort });
  const timer = timeout(socket);
  try {
    await Promise.race([once(socket, "connect"), timer]);
    const reader = createReader(socket);
    await write(socket, Buffer.from([0x05, 0x02, 0x00, 0x02]));
    const method = await reader.read(2);
    if (method[0] !== 0x05 || method[1] !== 0x02) throw new Error("SOCKS5-прокси не принял авторизацию");
    const user = Buffer.from(proxy.proxyUser, "utf8");
    const pass = Buffer.from(proxy.proxyPass, "utf8");
    if (!user.length || user.length > 255 || !pass.length || pass.length > 255) throw new Error("Некорректные учётные данные SOCKS5-прокси");
    await write(socket, Buffer.concat([Buffer.from([0x01, user.length]), user, Buffer.from([pass.length]), pass]));
    const auth = await reader.read(2);
    if (auth[1] !== 0x00) throw new Error("SOCKS5-прокси отклонил учётные данные");
    const host = Buffer.from("api.telegram.org", "ascii");
    await write(socket, Buffer.concat([Buffer.from([0x05, 0x01, 0x00, 0x03, host.length]), host, Buffer.from([0x01, 0xbb])]));
    const reply = await reader.read(4);
    if (reply[1] !== 0x00) throw new Error("SOCKS5-прокси не подключился к Telegram");
    const addressLength = reply[3] === 0x01 ? 4 : reply[3] === 0x04 ? 16 : await reader.read(1).then((value) => value[0]);
    await reader.read(addressLength + 2);
    socket.setTimeout(0);
    return socket;
  } catch (error) {
    socket.destroy();
    throw error;
  }
}

export async function sendTelegramMessage(config, text) {
  const socket = await connectSocks5(config);
  const secureSocket = tls.connect({ socket, servername: "api.telegram.org", rejectUnauthorized: true });
  const timer = timeout(secureSocket);
  try {
    await Promise.race([once(secureSocket, "secureConnect"), timer]);
    const body = JSON.stringify({ chat_id: config.chatId, text });
    const request = [
      `POST /bot${config.botToken}/sendMessage HTTP/1.1`,
      "Host: api.telegram.org",
      "Content-Type: application/json",
      `Content-Length: ${Buffer.byteLength(body)}`,
      "Connection: close",
      "",
      body,
    ].join("\r\n");
    await write(secureSocket, request);
    const response = await new Promise((resolve, reject) => {
      const chunks = [];
      secureSocket.on("data", (chunk) => chunks.push(chunk));
      secureSocket.once("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      secureSocket.once("error", reject);
    });
    const status = Number(/^HTTP\/1\.1\s+(\d{3})/m.exec(response)?.[1] || 0);
    if (status < 200 || status >= 300) throw new Error(`Telegram ответил HTTP ${status || "неизвестно"}`);
  } finally {
    secureSocket.destroy();
  }
}
