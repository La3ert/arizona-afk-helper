---@diagnostic disable: undefined-global
script_name('AFK Helper Client')
script_author('la3ert & AI')
script_version('1.0')

require'lib.moonloader'
local sampEvents = require'lib.samp.events'
local cjson = require'cjson'
local requests = require'requests'
local bit = require'bit'

local encoding = require'encoding'
encoding.default = 'CP1251'
local u8 = encoding.UTF8

local API_URL = 'http://localhost:3000/api'

local isHiddenStatsRequested = false
local isParsingPayDay = false
local pdData = {}

local httpQueue = {}

local function parseMoney(str)
    if type(str) ~= 'string' then
        str = tostring(str)
    end
    if not str or str == 'nil' then
        return 0
    end

    local result = ''
    local isFirst = true

    for numStr in str:gmatch('%d+') do
        if isFirst then
            result = result .. numStr
            isFirst = false
        else
            local zerosNeeded = 3 - #numStr
            if zerosNeeded > 0 then
                result = result .. string.rep('0', zerosNeeded) .. numStr
            else
                result = result .. numStr
            end
        end
    end

    if result == '' then
        return 0
    end
    return tonumber(result) or 0
end

local function sendDataAsync(endpoint, dataTable)
    table.insert(httpQueue, {
        endpoint = endpoint,
        data = dataTable
    })
end

function main()
    if not isSampLoaded() or not isSampfuncsLoaded() then return end
    while not isSampAvailable() do
        wait(100)
    end

    sampAddChatMessage('{00FF00}[AFK Helper] {FFFFFF}Скрипт успешно загружен/перезагружен!', -1)

    local _, myId = sampGetPlayerIdByCharHandle(PLAYER_PED)
    local myNick = sampGetPlayerNickname(myId)
    local serverName = 'Arizona RP'

    sendDataAsync('/connect', {
        nickname = myNick,
        server = serverName
    })

    while not sampIsLocalPlayerSpawned() do
        wait(500)
    end

    sendDataAsync('/auth', {
        level = sampGetPlayerScore(myId),
        curExp = 0,
        maxExp = 0,
        bankBalance = 0,
        depositBalance = 0
    })

    isHiddenStatsRequested = true
    sampSendChat('/stats')

    --sampRegisterChatCommand("testpd", function()
    --    sampAddChatMessage("{00FF00}[AFK Helper] {FFFFFF}Запускаю симуляцию часового PayDay...", -1)
    --    sampEvents.onServerMessage(0xFFFFFF, " ? БАНКОВСКИЙ ЧЕК ?")
    --    sampEvents.onServerMessage(0xFFFFFF, "==========================================================================")
    --    sampEvents.onServerMessage(0xFFFFFF, "| Текущая сумма в банке: ? 4 ? 364.036 (+? 1 ? 83.509)")
    --    sampEvents.onServerMessage(0xFFFFFF, "| В данный момент у вас 78-й уровень и 129/316 респектов (+8 EXP)")
    --    sampEvents.onServerMessage(0xFFFFFF, "| Текущая сумма на депозите: ? 289 ? 424.100 (+? 981.996)")
    --    sampEvents.onServerMessage(0xFFFFFF, "| Общая заработная плата: ? 1 ? 83.509")
    --    sampEvents.onServerMessage(0xFFFFFF, "| Баланс на донат-счет: 2741 AZ (+8 AZ)")
    --    sampEvents.onServerMessage(0xFFFFFF, "==========================================================================")
    --    sampEvents.onServerMessage(0xFFFFFF, "Вы получили +? 30.000 за Дивидентный договор (выдается каждый часовой PayDay)")
    --end)

    sampRegisterChatCommand('afkhelper', function(arg)
        if #arg == 0 then
            sampAddChatMessage('{FCAA4D}[AFK Helper] {FFFFFF}Использование: /afkhelper [настройка] [true/false]', -1)
            sampAddChatMessage('{FCAA4D}[Доступные] {FFFFFF}chatForwarding, payDayStats, remoteControl, auto2FA', -1)
            return
        end

        local flagName, flagValueStr = string.match(arg, '^(%S+)%s+(%S+)$')
        if not flagName or not flagValueStr then return end
        if flagName == 'auto2FA' then return end

        local flagValue = (flagValueStr == 'true')
        sendDataAsync('/settings', {
            key = flagName,
            value = flagValue
        })
    end)

    lua_thread.create(function()
        local lastGetTime = os.clock()

        while true do
            wait(20)

            if #httpQueue > 0 then
                local req = table.remove(httpQueue, 1)
                local success, jsonData = pcall(cjson.encode, req.data)

                if success and jsonData then
                    requests.post(API_URL .. req.endpoint, {
                        headers = { ['Content-Type'] = 'application/json' },
                        data = jsonData
                    })
                end
            elseif os.clock() - lastGetTime >= 1.0 then
                lastGetTime = os.clock()

                local response = requests.get(API_URL .. '/get-messages')
                if response and response.status_code == 200 then
                    pcall(function()
                        local data = cjson.decode(response.text)
                        if data.messages and #data.messages > 0 then
                            for _, msg in ipairs(data.messages) do
                                sampSendChat(u8:decode(msg))
                            end
                        end
                    end)
                end
            end
        end
    end)

    while true do
        wait(0)
    end
end

function onScriptTerminate(script, quitGame)
    if script == thisScript() then
        pcall(function()
            local jsonData = cjson.encode({})
            requests.post(API_URL .. '/disconnect', {
                headers = { ['Content-Type'] = 'application/json' },
                data = jsonData
            })
        end)
    end
end

function sampEvents.onServerMessage(color, text)
    local plainText = text:gsub('{%x+}', '')

    local cleanRGB = bit.band(bit.rshift(color, 8), 0xFFFFFF)
    local baseColor = string.format('#%06X', cleanRGB)
    local chatParts = {}
    local lastPos = 1

    while true do
        local startPos, endPos, hex = string.find(text, '{(%x%x%x%x%x%x)}', lastPos)
        if not startPos then
            break
        end

        if startPos > lastPos then
            table.insert(chatParts, {
                text = u8(string.sub(text, lastPos, startPos - 1)),
                color = baseColor
            })
        end

        baseColor = '#' .. string.upper(hex)
        lastPos = endPos + 1
    end

    if lastPos <= #text then
        table.insert(chatParts, {
            text = u8(string.sub(text, lastPos)),
            color = baseColor
        })
    end

    sendDataAsync('/chat', {
        time = os.date('%H:%M:%S'),
        parts = chatParts
    })

    if not isParsingPayDay and plainText:find('БАНКОВСКИЙ ЧЕК') then
        isParsingPayDay = true
        pdData = {
            salary = 0,
            deposit = 0,
            dividends = 0,
            earnedAZCoins = 0,
            earnedExp = 0,
            level = 0,
            curExp = 0,
            maxExp = 0,
            bankBalance = 0,
            depositBalance = 0
        }

        lua_thread.create(function()
            wait(1000)
            if isParsingPayDay then
                isParsingPayDay = false
                sendDataAsync('/payday', pdData)
                sampAddChatMessage('{00FF00}[AFK Helper] {FFFFFF}Данные PayDay успешно собраны и отправлены!', -1)
            end
        end)
        return
    end

    if isParsingPayDay then
        pcall(function()
            if plainText:find('банке:') then
                local mainPart = plainText:match('банке:([^%(]+)')
                if mainPart then
                    pdData.bankBalance = parseMoney(mainPart)
                end
            end

            if plainText:find('уровень') and plainText:find('респект') then
                local lvl, cur, max = plainText:match('(%d+)%-.-(%d+)/(%d+)')
                if lvl then
                    pdData.level, pdData.curExp, pdData.maxExp = tonumber(lvl), tonumber(cur), tonumber(max)
                end
                local expPart = plainText:match('%(([^%)]+)%)')
                if expPart then
                    pdData.earnedExp = parseMoney(expPart)
                end
            end

            if plainText:find('депозите:') then
                local mainPart = plainText:match('депозите:([^%(]+)')
                local earnPart = plainText:match('%(([^%)]+)%)')
                if mainPart then
                    pdData.depositBalance = parseMoney(mainPart)
                end
                if earnPart then
                    pdData.deposit = parseMoney(earnPart)
                end
            end

            if plainText:find('плата:') then
                local mainPart = plainText:match('плата:(.*)')
                if mainPart then
                    pdData.salary = parseMoney(mainPart)
                end
            end

            if plainText:find('AZ') and plainText:find('донат%-счет:') then
                local earnPart = plainText:match('%(([^%)]+)%)')
                if earnPart then
                    pdData.earnedAZCoins = parseMoney(earnPart)
                end
            end

            if plainText:find('Дивидентный договор') then
                local divPart = plainText:match('получили(.*)за Дивидентный')
                if divPart then
                    pdData.dividends = parseMoney(divPart)
                end
            end
        end)
    end
end

function sampEvents.onShowDialog(dialogId, style, title, button1, button2, text)
    if isHiddenStatsRequested and title:find('Основная статистика') then
        isHiddenStatsRequested = false
        local plainText = text:gsub('{%x+}', '')

        local levelNum = tonumber(plainText:match('Уровень:%s*%[(%d+)%]')) or sampGetPlayerScore(myId)
        local curExpNum = tonumber(plainText:match('Уважение:%s*%[(%d+)/')) or 0
        local maxExpNum = tonumber(plainText:match('Уважение:%s*%[%d+/(%d+)%]')) or 0

        local bankLine = plainText:match('Деньги в банке:([^\n]+)')
        local depLine = plainText:match('Деньги на депозите:([^\n]+)')

        sendDataAsync('/auth', {
            level = levelNum,
            curExp = curExpNum,
            maxExp = maxExpNum,
            bankBalance = parseMoney(bankLine),
            depositBalance = parseMoney(depLine)
        })

        sampSendDialogResponse(dialogId, 0, 0, '')
        return false
    end
end
