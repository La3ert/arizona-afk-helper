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
    nickname: 'No info',
    server: 'No info',
    isOnline: false,
    isAuthorized: false,
    level: 0,
    curExp: 0,
    maxExp: 0,
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
    time: 'No info',
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
let pendingMessages = [];

const broadcastSessionData = () => {
  io.emit('sessionData', sessionData);
};

io.on('connection', (socket) => {
  console.log('⚡ React-client connected! ID:', socket.id);

  socket.emit('settings_update', sessionData.settings);
  socket.emit('sessionData', sessionData);

  socket.on('toggle_setting', (data) => {
    sessionData.settings[data.key] = data.value;
    console.log(`⚙️ Setting updated: ${data.key} = ${data.value}`);
    io.emit('settings_update', sessionData.settings);
  });

  socket.on('client_message', (data) => {
    console.log('💻 Catch message from client:', data.message);
    pendingMessages.push(data.message);
  });

  socket.on('disconnect', () => {
    console.log('❌ React-client disconnected!. ID:', socket.id);
  });
});

//###########################################################

app.get('/api/get-messages', (req, res) => {
  res.json({ messages: pendingMessages });

  if (pendingMessages.length > 0) {
    pendingMessages = [];
  }
});

app.post('/api/settings', (req, res) => {
  const { key, value } = req.body;

  if (sessionData.settings[key] !== undefined) {
    sessionData.settings[key] = value;
    console.log(`🎮 Настройка изменена из игры: ${key} = ${value}`);

    io.emit('settings_update', sessionData.settings);

    res.status(200).send({ status: 'ok' });
  } else {
    res.status(400).send({ status: 'error', message: 'Unknown setting' });
  }
});

app.post('/api/chat', (req, res) => {
  if (sessionData.settings.chatForwarding) {
    const message = { ...req.body, id: messageId++ };
    io.emit('chat_message', message);
  }
  res.status(200).send({ status: 'ok' });
});

app.post('/api/connect', (req, res) => {
  console.log(
    `🎮 Player ${req.body.nickname} connected to server ${req.body.server}`
  );
  sessionData.player.nickname = req.body.nickname;
  sessionData.player.server = req.body.server;
  sessionData.player.isOnline = true;

  if (disconnectTimer) {
    clearTimeout(disconnectTimer);
    disconnectTimer = null;
  }

  broadcastSessionData();
  res.status(200).send({ status: 'ok' });
});

// Маршрут для успешной авторизации
app.post('/api/auth', (req, res) => {
  console.log(`✅ Player authorized!`);
  sessionData.player.isAuthorized = true;
  sessionData.player.level = req.body.level;
  sessionData.player.curExp = req.body.curExp;
  sessionData.player.maxExp = req.body.maxExp;
  sessionData.player.bankBalance = req.body.bankBalance;
  sessionData.player.depositBalance = req.body.depositBalance;

  broadcastSessionData();
  res.status(200).send({ status: 'ok' });
});

app.post('/api/payday', (req, res) => {
  console.log(`💰 PayDay is arrived!`);

  const {
    salary,
    deposit,
    dividends,
    earnedAZCoins,
    earnedExp,
    level,
    curExp,
    maxExp,
    bankBalance,
    depositBalance,
  } = req.body;

  const hourTotal = (salary || 0) + (deposit || 0) + (dividends || 0);

  sessionData.player.level = level;
  sessionData.player.curExp = curExp;
  sessionData.player.maxExp = maxExp;
  sessionData.player.bankBalance = bankBalance;
  sessionData.player.depositBalance = depositBalance;

  sessionData.lastPayDay = {
    time: new Date().toLocaleTimeString('ru-RU'),
    earnedAZCoins: earnedAZCoins || 0,
    earnedExp: earnedExp || 0,
    salary: salary || 0,
    deposit: deposit || 0,
    dividends: dividends || 0,
    totalEarned: hourTotal,
  };

  sessionData.session.totalEarnedAZCoins += earnedAZCoins || 0;
  sessionData.session.totalEarnedExp += earnedExp || 0;
  sessionData.session.totalSalary += salary || 0;
  sessionData.session.totalDeposit += deposit || 0;
  sessionData.session.totalDividends += dividends || 0;
  sessionData.session.totalEarned += hourTotal;

  broadcastSessionData();
  res.status(200).send({ status: 'ok', serverComputedTotal: hourTotal });
});

app.post('/api/disconnect', (req, res) => {
  console.log(`⚠️ Player disconnected.`);
  sessionData.player.isOnline = false;
  sessionData.player.isAuthorized = false;
  broadcastSessionData();

  disconnectTimer = setTimeout(() => {
    console.log('💀 Session expired.');

    sessionData.session = {
      totalEarnedAZCoins: 0,
      totalEarnedExp: 0,
      totalEarned: 0,
      totalSalary: 0,
      totalDeposit: 0,
      totalDividends: 0,
    };

    sessionData.lastPayDay = {
      time: 'no info',
      earnedAZCoins: 0,
      earnedExp: 0,
      totalEarned: 0,
      salary: 0,
      deposit: 0,
      dividends: 0,
    };
    broadcastSessionData();
  }, 120000);

  res.status(200).send({ status: 'ok' });
});

//############################################################

app.get('/', (req, res) => {
  res.send('AFK Helper Backend is running! 🚀');
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Sever is successfully started on http://localhost:${PORT}`);
});
