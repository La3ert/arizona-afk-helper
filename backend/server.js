import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
};
app.use(cors(corsOptions));
app.use(express.json());

const io = new Server(server, { cors: corsOptions });

let sessionData = {
  settings: {
    chatForwarding: true,
    payDayStats: true,
    remoteControl: false,
    auto2FA: false,
  },
  player: {
    nickname: 'Federico_Richter',
    server: 'Winslow [14]',
    isOnline: true,
    isAuthorized: false,
    level: 75,
    curExp: 120,
    maxExp: 400,
    bankBalance: 0,
    depositBalance: 0,
  },
  session: {
    totalEarnedAZCoins: 0,
    totalEarnedExp: 0,
    totalEarned: 0,
    totalSalary: 0,
    totalDeposit: 0,
    totalDividends: 0,
  },
  lastPayDay: {
    time: null,
    earnedAZCoins: 0,
    earnedExp: 0,
    totalEarned: 0,
    salary: 0,
    deposit: 0,
    dividends: 0,
  },
};

let disconnectTimer = null;
let messageId = 0;

const broadcastSessionData = () => {
  io.emit('sessionData', sessionData);
};

io.on('connection', (socket) => {
  console.log('⚡ React-клиент подключился! ID:', socket.id);

  socket.emit('settings_update', sessionData.settings);
  socket.emit('sessionData', sessionData);

  socket.on('toggle_setting', (data) => {
    sessionData.settings[data.key] = data.value;
    console.log(`⚙️ Настройка изменена: ${data.key} = ${data.value}`);
    io.emit('settings_update', sessionData.settings);
  });

  socket.on('client_message', (data) => {
    console.log('💻 Команда с сайта:', data.message);
  });

  socket.on('disconnect', () => {
    console.log('❌ React-клиент отключился. ID:', socket.id);
  });
});

app.get('/', (req, res) => {
  res.send('AFK Helper Backend is running! 🚀');
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Sever is successfully started on http://localhost:${PORT}`);
});
