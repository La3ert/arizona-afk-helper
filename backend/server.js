import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();
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
  dbPlayerId: null,
  dbSessionId: null,
  isOnline: false,
  isAuthorized: false,
  pendingMessages: [],
  messageId: 0,
  timers: {
    disconnectTimer: null,
    playerTimeout: null,
  },
});

// ==========================================
// ##########################################
// ==========================================

const broadcastSessionData = async (sessionKey) => {
  const sessionMem = activeSessions.get(sessionKey);
  if (!sessionMem) return;

  try {
    const user = await prisma.user.findUnique({ where: { sessionKey } });
    if (!user) return;

    let player = {
      nickname: 'No info',
      server: 'No info',
      isOnline: sessionMem.isOnline,
      isAuthorized: sessionMem.isAuthorized,
      level: 0,
      curExp: 0,
      maxExp: 0,
      bankBalance: 0,
      depositBalance: 0,
      AZCoinsBalance: 0,
    };

    let sessionStats = {
      totalEarnedAZCoins: 0,
      totalEarnedExp: 0,
      totalEarned: 0,
      totalSalary: 0,
      totalDeposit: 0,
      totalDividends: 0,
      totalPayDays: 0,
      hourlyPayDays: 0,
    };

    let lastPayDay = {
      time: null,
      earnedAZCoins: 0,
      earnedExp: 0,
      totalEarned: 0,
      salary: 0,
      deposit: 0,
      dividends: 0,
    };

    if (sessionMem.dbPlayerId) {
      const dbPlayer = await prisma.player.findUnique({
        where: { id: sessionMem.dbPlayerId },
      });
      if (dbPlayer) {
        player = {
          ...player,
          nickname: dbPlayer.nickname,
          server: dbPlayer.server,
          level: dbPlayer.level,
          curExp: dbPlayer.curExp,
          maxExp: dbPlayer.maxExp,
          bankBalance: Number(dbPlayer.bankBalance),
          depositBalance: Number(dbPlayer.depositBalance),
          AZCoinsBalance: dbPlayer.AZCoinsBalance,
        };
      }
    }

    if (sessionMem.dbSessionId) {
      const events = await prisma.payDayEvent.findMany({
        where: { sessionId: sessionMem.dbSessionId },
        orderBy: { timestamp: 'desc' },
      });

      sessionStats.totalPayDays = events.length;

      events.forEach((ev) => {
        const hourTotal = ev.salary + ev.deposit + ev.dividends;
        sessionStats.totalEarned += hourTotal;
        sessionStats.totalSalary += ev.salary;
        sessionStats.totalDeposit += ev.deposit;
        sessionStats.totalDividends += ev.dividends;
        sessionStats.totalEarnedAZCoins += ev.earnedAZCoins;

        const mins = ev.timestamp.getMinutes();
        if (mins >= 58 || mins <= 15) {
          sessionStats.hourlyPayDays++;
        }
      });

      if (events.length > 0) {
        const last = events[0];
        lastPayDay = {
          time: last.timestamp.getTime(),
          earnedAZCoins: last.earnedAZCoins,
          salary: last.salary,
          deposit: last.deposit,
          dividends: last.dividends,
          totalEarned: last.salary + last.deposit + last.dividends,
        };
      }
    }

    io.to(sessionKey).emit('sessionData', {
      settings: {
        chatForwarding: user.chatForwarding,
        payDayStats: user.payDayStats,
        remoteControl: user.remoteControl,
        auto2FA: user.auto2FA,
      },
      player,
      session: sessionStats,
      lastPayDay,
    });
  } catch (error) {
    console.error(`[DB Error] Broadcast failed for ${sessionKey}:`, error);
  }
};

// ==========================================
// ##########################################
// ==========================================

async function handlePlayerDisconnect(sessionKey, sessionMem) {
  sessionMem.isOnline = false;
  sessionMem.isAuthorized = false;

  await broadcastSessionData(sessionKey);

  if (sessionMem.dbSessionId) {
    try {
      await prisma.session.update({
        where: { id: sessionMem.dbSessionId },
        data: { endTime: new Date() },
      });
      sessionMem.dbSessionId = null;
    } catch (e) {
      console.error('DB Error on disconnect:', e);
    }
  }

  if (!sessionMem.timers.disconnectTimer) {
    sessionMem.timers.disconnectTimer = setTimeout(() => {
      console.log(`💀 [${sessionKey}] Session expired.`);
      broadcastSessionData(sessionKey);
      sessionMem.timers.disconnectTimer = null;
    }, 120000);
  }
}

// ==========================================
// ##########################################
// ==========================================

io.on('connection', (socket) => {
  console.log('⚡ React-client connected! ID:', socket.id);

  socket.on('register_new_code', async (newCode, callback) => {
    if (activeSessions.has(newCode)) {
      callback({ exists: true });
    } else {
      activeSessions.set(newCode, createEmptySession());
      socket.join(newCode);
      socket.sessionCode = newCode;

      try {
        await prisma.user.upsert({
          where: { sessionKey: newCode },
          update: {},
          create: { sessionKey: newCode },
        });
      } catch (e) {
        console.error('DB Error on register:', e);
      }

      console.log(`✅ New session registered: ${newCode}`);
      callback({ exists: false });
    }
  });

  socket.on('verify_code', async (code, callback) => {
    if (!activeSessions.has(code)) {
      const user = await prisma.user.findUnique({
        where: { sessionKey: code },
      });
      if (user) {
        activeSessions.set(code, createEmptySession());
      }
    }

    if (activeSessions.has(code)) {
      socket.join(code);
      socket.sessionCode = code;
      console.log(`🔗 Browser joined session: ${code}`);

      const user = await prisma.user.findUnique({
        where: { sessionKey: code },
      });

      if (user) {
        socket.emit('settings_update', {
          chatForwarding: user.chatForwarding,
          payDayStats: user.payDayStats,
          remoteControl: user.remoteControl,
          auto2FA: user.auto2FA,
        });
      }

      await broadcastSessionData(code);
      callback({ valid: true });
    } else {
      callback({ valid: false });
    }
  });

  socket.on('toggle_setting', async (data) => {
    const code = socket.sessionCode;
    if (code && activeSessions.has(code)) {
      try {
        const updatedUser = await prisma.user.update({
          where: { sessionKey: code },
          data: { [data.key]: data.value },
        });
        io.to(code).emit('settings_update', {
          chatForwarding: updatedUser.chatForwarding,
          payDayStats: updatedUser.payDayStats,
          remoteControl: updatedUser.remoteControl,
          auto2FA: updatedUser.auto2FA,
        });
        await broadcastSessionData(code);
      } catch (e) {
        console.error('DB Error on setting toggle:', e);
      }
    }
  });

  socket.on('client_message', (data) => {
    const code = socket.sessionCode;
    if (code && activeSessions.has(code)) {
      activeSessions.get(code).pendingMessages.push(data.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ React-client disconnected! ID:', socket.id);
  });
});

// ==========================================
// ##########################################
// ==========================================

const requireSession = async (req, res, next) => {
  const key = req.body?.sessionKey || req.query?.sessionKey;

  if (!key) {
    return res.status(401).send({ status: 'error', message: 'Unauthorized' });
  }

  if (!activeSessions.has(key)) {
    const user = await prisma.user.findUnique({ where: { sessionKey: key } });
    if (user) {
      activeSessions.set(key, createEmptySession());
    } else {
      return res.status(401).send({ status: 'error', message: 'Unauthorized' });
    }
  }

  req.sessionMem = activeSessions.get(key);
  req.sessionKey = key;
  next();
};

// ==========================================
// ##########################################
// ==========================================

app.post('/api/verify-key', (req, res) => {
  const { sessionKey } = req.body;
  res.status(200).send({ valid: activeSessions.has(sessionKey) });
});

app.get('/api/get-messages', requireSession, (req, res) => {
  res.json({ messages: req.sessionMem.pendingMessages });
  if (req.sessionMem.pendingMessages.length > 0)
    req.sessionMem.pendingMessages = [];
});

app.post('/api/settings', requireSession, async (req, res) => {
  const { key, value } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { sessionKey: req.sessionKey },
      data: { [key]: value },
    });
    io.to(req.sessionKey).emit('settings_update', {
      chatForwarding: updatedUser.chatForwarding,
      payDayStats: updatedUser.payDayStats,
      remoteControl: updatedUser.remoteControl,
      auto2FA: updatedUser.auto2FA,
    });
    res.status(200).send({ status: 'ok' });
  } catch (e) {
    res.status(400).send({ status: 'error', message: 'Unknown setting' });
  }
});

app.post('/api/chat', requireSession, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { sessionKey: req.sessionKey },
  });
  if (user && user.chatForwarding) {
    const message = { ...req.body, id: req.sessionMem.messageId++ };
    io.to(req.sessionKey).emit('chat_message', message);
  }
  res.status(200).send({ status: 'ok' });
});

app.post('/api/connect', requireSession, async (req, res) => {
  req.sessionMem.isOnline = true;

  if (req.sessionMem.timers.disconnectTimer) {
    clearTimeout(req.sessionMem.timers.disconnectTimer);
    req.sessionMem.timers.disconnectTimer = null;
  }
  if (req.sessionMem.timers.playerTimeout)
    clearTimeout(req.sessionMem.timers.playerTimeout);

  req.sessionMem.timers.playerTimeout = setTimeout(() => {
    handlePlayerDisconnect(req.sessionKey, req.sessionMem);
  }, 25000);

  await broadcastSessionData(req.sessionKey);
  res.status(200).send({ status: 'ok' });
});

app.post('/api/auth', requireSession, async (req, res) => {
  const {
    accountId,
    nickname,
    server, // <-- Достаем сервер из запроса
    level,
    curExp,
    maxExp,
    bankBalance,
    depositBalance,
    AZCoinsBalance,
  } = req.body;

  req.sessionMem.isAuthorized = true;

  try {
    await prisma.user.upsert({
      where: { sessionKey: req.sessionKey },
      update: {},
      create: { sessionKey: req.sessionKey },
    });

    const playerServer = server || 'Arizona RP';

    const dbPlayer = await prisma.player.upsert({
      where: {
        accountId_server: { accountId: accountId || 0, server: playerServer },
      },
      update: {
        nickname: nickname || 'No Info',
        level,
        curExp,
        maxExp,
        bankBalance,
        depositBalance,
        AZCoinsBalance,
      },
      create: {
        accountId: accountId || 0,
        server: playerServer,
        nickname: nickname || 'No Info',
        userKey: req.sessionKey,
        level,
        curExp,
        maxExp,
        bankBalance,
        depositBalance,
        AZCoinsBalance,
      },
    });

    req.sessionMem.dbPlayerId = dbPlayer.id;

    if (!req.sessionMem.dbSessionId) {
      const newSession = await prisma.session.create({
        data: { playerId: dbPlayer.id },
      });
      req.sessionMem.dbSessionId = newSession.id;
    }

    await broadcastSessionData(req.sessionKey);
  } catch (e) {
    console.error('DB Error on auth:', e);
  }

  res.status(200).send({ status: 'ok' });
});

app.post('/api/ping', requireSession, async (req, res) => {
  if (req.sessionMem.timers.playerTimeout)
    clearTimeout(req.sessionMem.timers.playerTimeout);
  if (req.sessionMem.timers.disconnectTimer) {
    clearTimeout(req.sessionMem.timers.disconnectTimer);
    req.sessionMem.timers.disconnectTimer = null;
  }

  if (!req.sessionMem.isOnline) {
    req.sessionMem.isOnline = true;
    await broadcastSessionData(req.sessionKey);
  }

  req.sessionMem.timers.playerTimeout = setTimeout(() => {
    handlePlayerDisconnect(req.sessionKey, req.sessionMem);
  }, 25000);

  if (!req.sessionMem.isAuthorized)
    return res.status(200).send({ status: 'needs_auth' });
  res.status(200).send({ status: 'ok' });
});

app.post('/api/payday', requireSession, async (req, res) => {
  let {
    salary,
    deposit,
    dividends,
    earnedAZCoins,
    level,
    curExp,
    maxExp,
    bankBalance,
    depositBalance,
    AZCoinsBalance,
  } = req.body;

  if (curExp >= maxExp) {
    curExp -= maxExp;
    level++;
    maxExp = (level + 1) * 4;
  }

  const hourTotal = (salary || 0) + (deposit || 0) + (dividends || 0);

  if (req.sessionMem.dbSessionId && req.sessionMem.dbPlayerId) {
    try {
      await prisma.payDayEvent.create({
        data: {
          sessionId: req.sessionMem.dbSessionId,
          salary: salary || 0,
          deposit: deposit || 0,
          dividends: dividends || 0,
          earnedAZCoins: earnedAZCoins || 0,
        },
      });

      await prisma.player.update({
        where: { id: req.sessionMem.dbPlayerId },
        data: {
          level,
          curExp,
          maxExp,
          bankBalance,
          depositBalance,
          AZCoinsBalance,
        },
      });

      await broadcastSessionData(req.sessionKey);
    } catch (e) {
      console.error('DB Error on PayDay:', e);
    }
  }

  res.status(200).send({ status: 'ok', serverComputedTotal: hourTotal });
});

app.post('/api/disconnect', requireSession, (req, res) => {
  if (req.sessionMem.timers.playerTimeout)
    clearTimeout(req.sessionMem.timers.playerTimeout);
  handlePlayerDisconnect(req.sessionKey, req.sessionMem);
  res.status(200).send({ status: 'ok' });
});

app.get('/', (req, res) => res.send('AFK Helper Backend is running! 🚀'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`🚀 Server is successfully started on port ${PORT}`)
);
