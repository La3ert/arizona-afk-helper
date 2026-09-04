import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST'],
};
app.use(cors(corsOptions));
app.use(express.json());

const io = new Server(server, { cors: corsOptions });

const activeSessions = new Map();

const createEmptySession = () => ({
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
    AZCoinsBalance: 0,
  },
  sessionStats: {
    totalEarnedAZCoins: 0,
    totalEarnedExp: 0,
    totalEarned: 0,
    totalSalary: 0,
    totalDeposit: 0,
    totalDividends: 0,
    totalPayDays: 0,
    hourlyPayDays: 0,
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
  pendingMessages: [],
  messageId: 0,
  timers: {
    disconnectTimer: null,
    playerTimeout: null,
  },
});

io.on('connection', (socket) => {
  console.log('⚡ React-client connected! ID:', socket.id);

  socket.on('register_new_code', (newCode, callback) => {
    if (activeSessions.has(newCode)) {
      console.log(`⚠️ Collision detected! Code already exists: ${newCode}`);
      callback({ exists: true });
    } else {
      activeSessions.set(newCode, createEmptySession());

      socket.join(newCode);
      socket.sessionCode = newCode;

      console.log(`✅ New session registered: ${newCode}`);
      callback({ exists: false });
    }
  });

  socket.on('verify_code', (code, callback) => {
    if (activeSessions.has(code)) {
      socket.join(code);
      socket.sessionCode = code;

      console.log(`🔗 Browser joined session: ${code}`);

      const sessionData = activeSessions.get(code);

      socket.emit('settings_update', sessionData.settings);
      socket.emit('sessionData', {
        settings: sessionData.settings,
        player: sessionData.player,
        session: sessionData.sessionStats,
        lastPayDay: sessionData.lastPayDay,
      });

      callback({ valid: true });
    } else {
      console.log(`❌ Connection failed. Code not found: ${code}`);
      callback({ valid: false });
    }
  });

  socket.on('toggle_setting', (data) => {
    const code = socket.sessionCode;
    if (code && activeSessions.has(code)) {
      const sessionData = activeSessions.get(code);
      sessionData.settings[data.key] = data.value;

      console.log(`⚙️ [${code}] Setting updated: ${data.key} = ${data.value}`);

      io.to(code).emit('settings_update', sessionData.settings);
    }
  });

  socket.on('client_message', (data) => {
    const code = socket.sessionCode;
    if (code && activeSessions.has(code)) {
      const sessionData = activeSessions.get(code);
      console.log(`💻 [${code}] Message from client:`, data.message);

      sessionData.pendingMessages.push(data.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ React-client disconnected! ID:', socket.id);
  });
});

// ==========================================

const broadcastSessionData = (sessionKey, session) => {
  io.to(sessionKey).emit('sessionData', {
    settings: session.settings,
    player: session.player,
    session: session.sessionStats,
    lastPayDay: session.lastPayDay,
  });
};

function handlePlayerDisconnect(sessionKey, session) {
  session.player.isOnline = false;
  session.player.isAuthorized = false;

  broadcastSessionData(sessionKey, session);

  if (!session.timers.disconnectTimer) {
    session.timers.disconnectTimer = setTimeout(() => {
      console.log(`💀 [${sessionKey}] Session expired.`);

      session.sessionStats = {
        totalEarnedAZCoins: 0,
        totalEarnedExp: 0,
        totalEarned: 0,
        totalSalary: 0,
        totalDeposit: 0,
        totalDividends: 0,
        totalPayDays: 0,
        hourlyPayDays: 0,
      };

      broadcastSessionData(sessionKey, session);
      session.timers.disconnectTimer = null;
    }, 120000);
  }
}

// ==========================================

const requireSession = (req, res, next) => {
  const key = req.body?.sessionKey || req.query?.sessionKey;

  if (!key || !activeSessions.has(key)) {
    return res.status(401).send({
      status: 'error',
      message: 'Unauthorized: Invalid or missing sessionKey',
    });
  }

  req.session = activeSessions.get(key);
  req.sessionKey = key;
  next();
};

// ==========================================

app.post('/api/verify-key', (req, res) => {
  const { sessionKey } = req.body;

  if (activeSessions.has(sessionKey)) {
    console.log(`🔑 Lua script successfully verified key: ${sessionKey}`);
    res.status(200).send({ valid: true });
  } else {
    console.log(
      `❌ Lua script attempted to link an invalid key: ${sessionKey}`
    );
    res.status(200).send({ valid: false });
  }
});

app.get('/api/get-messages', requireSession, (req, res) => {
  res.json({ messages: req.session.pendingMessages });

  if (req.session.pendingMessages.length > 0) {
    req.session.pendingMessages = [];
  }
});

app.post('/api/settings', requireSession, (req, res) => {
  const { key, value } = req.body;

  if (req.session.settings[key] !== undefined) {
    req.session.settings[key] = value;
    console.log(
      `🎮 [${req.sessionKey}] Setting changed from game: ${key} = ${value}`
    );

    io.to(req.sessionKey).emit('settings_update', req.session.settings);

    res.status(200).send({ status: 'ok' });
  } else {
    res.status(400).send({ status: 'error', message: 'Unknown setting' });
  }
});

app.post('/api/chat', requireSession, (req, res) => {
  if (req.session.settings.chatForwarding) {
    const message = { ...req.body, id: req.session.messageId++ };
    io.to(req.sessionKey).emit('chat_message', message);
  }
  res.status(200).send({ status: 'ok' });
});

app.post('/api/connect', requireSession, (req, res) => {
  console.log(
    `🎮 [${req.sessionKey}] Player ${req.body.nickname} connected to server ${req.body.server}`
  );

  req.session.player.nickname = req.body.nickname;
  req.session.player.server = req.body.server;
  req.session.player.isOnline = true;

  if (req.session.timers.disconnectTimer) {
    clearTimeout(req.session.timers.disconnectTimer);
    req.session.timers.disconnectTimer = null;
  }

  if (req.session.timers.playerTimeout)
    clearTimeout(req.session.timers.playerTimeout);

  req.session.timers.playerTimeout = setTimeout(() => {
    handlePlayerDisconnect(req.sessionKey, req.session);
  }, 25000);

  broadcastSessionData(req.sessionKey, req.session);
  res.status(200).send({ status: 'ok' });
});

app.post('/api/auth', requireSession, (req, res) => {
  console.log(`✅ [${req.sessionKey}] Player authorized!`);

  req.session.player.isAuthorized = true;
  req.session.player.level = req.body.level;
  req.session.player.curExp = req.body.curExp;
  req.session.player.maxExp = req.body.maxExp;
  req.session.player.bankBalance = req.body.bankBalance;
  req.session.player.depositBalance = req.body.depositBalance;
  req.session.player.AZCoinsBalance = req.body.AZCoinsBalance;

  broadcastSessionData(req.sessionKey, req.session);
  res.status(200).send({ status: 'ok' });
});

app.post('/api/ping', requireSession, (req, res) => {
  if (req.session.timers.playerTimeout)
    clearTimeout(req.session.timers.playerTimeout);

  if (req.session.timers.disconnectTimer) {
    clearTimeout(req.session.timers.disconnectTimer);
    req.session.timers.disconnectTimer = null;
  }

  if (!req.session.player.isOnline) {
    req.session.player.isOnline = true;
    broadcastSessionData(req.sessionKey, req.session);
  }

  req.session.timers.playerTimeout = setTimeout(() => {
    handlePlayerDisconnect(req.sessionKey, req.session);
  }, 25000);

  if (!req.session.player.isAuthorized) {
    return res.status(200).send({ status: 'needs_auth' });
  }

  res.status(200).send({ status: 'ok' });
});

app.post('/api/payday', requireSession, (req, res) => {
  console.log(`💰 [${req.sessionKey}] PayDay is arrived!`);

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
    AZCoinsBalance,
    hourlyPayDay,
  } = req.body;

  const hourTotal = (salary || 0) + (deposit || 0) + (dividends || 0);

  req.session.player.level = level;
  req.session.player.curExp = curExp;
  req.session.player.maxExp = maxExp;
  req.session.player.bankBalance = bankBalance;
  req.session.player.depositBalance = depositBalance;
  req.session.player.AZCoinsBalance = AZCoinsBalance;
  req.session.sessionStats.totalPayDays++;

  if (hourlyPayDay) {
    req.session.sessionStats.hourlyPayDays++;
  }

  req.session.lastPayDay = {
    time: Date.now(),
    earnedAZCoins: earnedAZCoins || 0,
    earnedExp: earnedExp || 0,
    salary: salary || 0,
    deposit: deposit || 0,
    dividends: dividends || 0,
    totalEarned: hourTotal,
  };

  req.session.sessionStats.totalEarnedAZCoins += earnedAZCoins || 0;
  req.session.sessionStats.totalEarnedExp += earnedExp || 0;
  req.session.sessionStats.totalSalary += salary || 0;
  req.session.sessionStats.totalDeposit += deposit || 0;
  req.session.sessionStats.totalDividends += dividends || 0;
  req.session.sessionStats.totalEarned += hourTotal;

  broadcastSessionData(req.sessionKey, req.session);
  res.status(200).send({ status: 'ok', serverComputedTotal: hourTotal });
});

app.post('/api/disconnect', requireSession, (req, res) => {
  if (req.session.timers.playerTimeout)
    clearTimeout(req.session.timers.playerTimeout);
  handlePlayerDisconnect(req.sessionKey, req.session);
  res.status(200).send({ status: 'ok' });
});

// ==========================================

app.get('/', (req, res) => {
  res.send('AFK Helper Backend is running! 🚀');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server is successfully started on port ${PORT}`);
});
