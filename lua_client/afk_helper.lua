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
        local lastPingTime = os.clock()

        while true do
            wait(20)

            if #httpQueue > 0 then
                local req = table.remove(httpQueue, 1)
                local success, jsonData = pcall(cjson.encode, req.data)

                if success and jsonData then
                    local response = requests.post(API_URL .. req.endpoint, {
                        headers = { ['Content-Type'] = 'application/json' },
                        data = jsonData
                    })

                    if response and response.status_code == 200 then
                        pcall(function()
                            local resData = cjson.decode(response.text)
                            if req.endpoint == '/ping' and resData.status == 'needs_auth' then
                                isHiddenStatsRequested = true
                                sampSendChat('/stats')
                            end
                        end)
                    end
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

            if os.clock() - lastPingTime >= 10.0 then
                lastPingTime = os.clock()

                if sampGetGamestate() == 3 and sampIsLocalPlayerSpawned() then
                    sendDataAsync('/ping', { status = 'Online' })
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

        local currentMinute = tonumber(os.date('%M'))
        local isHourly = false
        if currentMinute >= 58 or currentMinute <= 15 then
            isHourly = true
        end

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
            depositBalance = 0,
            AZCoinsBalance = 0,
            hourlyPayDay = isHourly
        }

        isHiddenStatsRequested = true
        sampSendChat('/stats')

        lua_thread.create(function()
            wait(2000)
            if isParsingPayDay then
                isParsingPayDay = false
                sendDataAsync('/payday', pdData)
                sampAddChatMessage('{00FF00}[AFK Helper] {FFFFFF}Данные PayDay и балансы успешно собраны!', -1)
            end
        end)
        return
    end

    if isParsingPayDay then
        pcall(function()
            if plainText:find('уровень') and plainText:find('респект') then
                local expPart = plainText:match('%(([^%)]+)%)')
                if expPart then
                    pdData.earnedExp = parseMoney(expPart)
                end
            end

            if plainText:find('депозите:') then
                local earnPart = plainText:match('%(([^%)]+)%)')
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

        local levelNum = tonumber(plainText:match('Уровень:%s*%[(%d+)%]')) or sampGetPlayerScore(PLAYER_PED)
        local curExpNum = tonumber(plainText:match('Уважение:%s*%[(%d+)/')) or 0
        local maxExpNum = tonumber(plainText:match('Уважение:%s*%[%d+/(%d+)%]')) or 0

        local bankLine = plainText:match('Деньги в банке:([^\n]+)')
        local depLine = plainText:match('Деньги на депозите:([^\n]+)')

        local azLine =
            plainText:match('состояние счета:([^\n]+AZ%-Coins[^\n]*)') or plainText:match('AZ%-Coins:([^\n]+)')
        local azBalanceNum = parseMoney(azLine)

        if isParsingPayDay then
            pdData.level = levelNum
            pdData.curExp = curExpNum
            pdData.maxExp = maxExpNum
            pdData.bankBalance = parseMoney(bankLine)
            pdData.depositBalance = parseMoney(depLine)
            pdData.AZCoinsBalance = azBalanceNum
        else
            sendDataAsync('/auth', {
                level = levelNum,
                curExp = curExpNum,
                maxExp = maxExpNum,
                bankBalance = parseMoney(bankLine),
                depositBalance = parseMoney(depLine),
                AZCoinsBalance = azBalanceNum
            })
        end

        sampSendDialogResponse(dialogId, 0, 0, '')
        return false
    end
end
