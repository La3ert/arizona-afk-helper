---@diagnostic disable: undefined-global
script_name('AFK Helper Client')
script_author('la3ert & AI')
script_version('1.3 - Async Queue')

require'lib.moonloader'
local sampEvents = require'lib.samp.events'
local cjson = require'cjson'
local requests = require'requests'
local bit = require'bit'
local inicfg = require'inicfg'
local encoding = require'encoding'
local effil = require'effil'
encoding.default = 'CP1251'
local u8 = encoding.UTF8

local API_URL = 'https://arizona-afk-helper.duckdns.org/api'

local configFileName = 'afk_helper.ini'
local defaultConfig = {
    main = { sessionKey = '' }
}
local config = inicfg.load(defaultConfig, configFileName)
inicfg.save(config, configFileName)

local isHiddenStatsRequested = false
local isParsingPayDay = false
local pdData = {}

local chatQueue = {}
local isSendingChat = false
local lastMessageText = ''
local lastMessageTime = 0

local function asyncHttpRequest(method, url, args, callback)
    local runner = effil.thread(function(thread_method, thread_url, thread_args)
        local thread_req = require'requests'
        local result, response
        if thread_method == 'GET' then
            result, response = pcall(thread_req.get, thread_url, thread_args)
        else
            result, response = pcall(thread_req.post, thread_url, thread_args)
        end
        if result and response then
            return {
                status_code = response.status_code,
                text = response.text
            }
        else
            return nil, response and tostring(response) or 'Unknown error'
        end
    end)

    lua_thread.create(function()
        local thread = runner(method, url, args)
        while true do
            local status = thread:status()
            if status == 'completed' then
                local response, err = thread:get()
                if callback then
                    callback(response, err)
                end
                break
            elseif status == 'canceled' or status == 'failed' then
                local err = thread:get()
                if callback then
                    callback(nil, err)
                end
                break
            end
            wait(0)
        end
    end)
end

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
    if not config.main.sessionKey or config.main.sessionKey == '' then return end
    dataTable.sessionKey = config.main.sessionKey

    local success, jsonData = pcall(cjson.encode, dataTable)
    if success and jsonData then
        asyncHttpRequest(
            'POST',
            API_URL .. endpoint,
            {
                headers = { ['Content-Type'] = 'application/json' },
                data = jsonData
            },
            function(response)
                if response and response.status_code == 200 then
                    pcall(function()
                        local resData = cjson.decode(response.text)
                        if endpoint == '/ping' and resData.status == 'needs_auth' then
                            isHiddenStatsRequested = true
                            sampSendChat('/stats')
                        end
                    end)
                end
            end
        )
    end
end

function main()
    if not isSampLoaded() or not isSampfuncsLoaded() then return end
    while not isSampAvailable() do
        wait(100)
    end

    sampAddChatMessage('{00FF00}[AFK Helper] {FFFFFF}Скрипт загружен!', -1)

    if config.main.sessionKey == '' then
        sampAddChatMessage('{FCAA4D}[AFK Helper] {FFFFFF}Ключ не настроен! Введите {FCAA4D}/afkhelper key ВАШ-КЛЮЧ', -1)
    end

    while not sampIsLocalPlayerSpawned() do
        wait(500)
    end

    if config.main.sessionKey ~= '' then
        sendDataAsync('/connect', {})
        isHiddenStatsRequested = true
        sampSendChat('/stats')
    end

    sampRegisterChatCommand('afkhelper', function(arg)
        if #arg == 0 then
            sampAddChatMessage('{FCAA4D}[AFK Helper] {FFFFFF}Использование: /afkhelper [команда] [значение]', -1)
            sampAddChatMessage('{FCAA4D}[Привязка] {FFFFFF}key [ВАШ-КЛЮЧ]', -1)
            sampAddChatMessage(
                '{FCAA4D}[Настройки] {FFFFFF}chatForwarding, payDayStats, remoteControl, auto2FA (true/false)',
                -1
            )
            return
        end

        local flagName, flagValueStr = string.match(arg, '^(%S+)%s+(%S+)$')
        if not flagName or not flagValueStr then return end

        if flagName == 'key' then
            local testKey = flagValueStr:upper()
            sampAddChatMessage('{FCAA4D}[AFK Helper] {FFFFFF}Проверка ключа на сервере...', -1)

            asyncHttpRequest(
                'POST',
                API_URL .. '/verify-key',
                {
                    headers = { ['Content-Type'] = 'application/json' },
                    data = cjson.encode({ sessionKey = testKey })
                },
                function(response)
                    if response and response.status_code == 200 then
                        local resData = cjson.decode(response.text)
                        if resData.valid then
                            config.main.sessionKey = testKey
                            inicfg.save(config, configFileName)
                            sampAddChatMessage(
                                '{00FF00}[AFK Helper] {FFFFFF}Успех! Дашборд привязан к ключу: ' .. testKey,
                                -1
                            )

                            local _, myId = sampGetPlayerIdByCharHandle(PLAYER_PED)
                            sendDataAsync('/connect', {
                                nickname = sampGetPlayerNickname(myId),
                                server = 'Arizona RP'
                            })
                            sendDataAsync('/auth', {
                                level = sampGetPlayerScore(myId),
                                curExp = 0,
                                maxExp = 0,
                                bankBalance = 0,
                                depositBalance = 0
                            })
                            isHiddenStatsRequested = true
                            sampSendChat('/stats')
                        else
                            sampAddChatMessage('{FF0000}[AFK Helper] {FFFFFF}Ошибка: Ключ не найден!', -1)
                        end
                    else
                        sampAddChatMessage('{FF0000}[AFK Helper] {FFFFFF}Ошибка соединения с сервером.', -1)
                    end
                end
            )
            return
        end

        if flagName == 'auto2FA' then return end

        local flagValue = (flagValueStr == 'true')
        sendDataAsync('/settings', {
            key = flagName,
            value = flagValue
        })
    end)

    lua_thread.create(function()
        while true do
            wait(10)
            if #chatQueue > 0 and not isSendingChat and config.main.sessionKey ~= '' then
                isSendingChat = true
                local chatData = table.remove(chatQueue, 1)
                chatData.sessionKey = config.main.sessionKey

                local success, jsonData = pcall(cjson.encode, chatData)
                if success and jsonData then
                    asyncHttpRequest(
                        'POST',
                        API_URL .. '/chat',
                        {
                            headers = { ['Content-Type'] = 'application/json' },
                            data = jsonData
                        },
                        function(response)
                            isSendingChat = false
                        end
                    )
                else
                    isSendingChat = false
                end
            end
        end
    end)

    lua_thread.create(function()
        while true do
            wait(1500)
            if config.main.sessionKey ~= '' then
                local getUrl = API_URL .. '/get-messages?sessionKey=' .. config.main.sessionKey
                asyncHttpRequest('GET', getUrl, {}, function(response)
                    if response and response.status_code == 200 then
                        pcall(function()
                            local data = cjson.decode(response.text)
                            if data.messages and #data.messages > 0 then
                                for _, msg in ipairs(data.messages) do
                                    if type(msg) == 'string' then
                                        sampSendChat(u8:decode(msg))
                                    end
                                end
                            end
                        end)
                    end
                end)
            end
        end
    end)

    lua_thread.create(function()
        while true do
            wait(10000)
            if config.main.sessionKey ~= '' and sampGetGamestate() == 3 and sampIsLocalPlayerSpawned() then
                sendDataAsync('/ping', { status = 'Online' })
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
            local payload = {}
            if config.main.sessionKey and config.main.sessionKey ~= '' then
                payload.sessionKey = config.main.sessionKey
                local jsonData = cjson.encode(payload)
                requests.post(API_URL .. '/disconnect', {
                    headers = { ['Content-Type'] = 'application/json' },
                    data = jsonData
                })
            end
        end)
    end
end

function sampEvents.onServerMessage(color, text)
    local currentTime = os.clock()
    if text == lastMessageText and (currentTime - lastMessageTime) < 1.0 then return end
    lastMessageText = text
    lastMessageTime = currentTime

    local plainText = text:gsub('{%x+}', '')

    if plainText:match('^%s*$') then return end

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

    table.insert(chatQueue, {
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

function sampEvents.onShowDialog(dialogId, _style, title, _button1, _button2, text)
    if isHiddenStatsRequested and (title:find('Основная статистика') or title:find('ОСНОВНАЯ СТАТИСТИКА')) then
        isHiddenStatsRequested = false
        local plainText = text:gsub('{.-}', '')
        local rawServerName = sampGetCurrentServerName()
        local currentServer = rawServerName:match('|%s*(.+)') or 'Arizona RP'

        local _, myId = sampGetPlayerIdByCharHandle(PLAYER_PED)
        local nickName = plainText:match('Имя.-([%w_]+)') or sampGetPlayerNickname(myId)
        local accountIdNum = tonumber(plainText:match('%[№.-(%d+)%]')) or 0
        local levelNum = tonumber(plainText:match('Уровень.-(%d+)')) or sampGetPlayerScore(myId)

        local curExpStr, maxExpStr = plainText:match('Уважение.-(%d+)/(%d+)')
        local curExpNum = tonumber(curExpStr) or 0
        local maxExpNum = tonumber(maxExpStr) or 0

        local bankLine = plainText:match('банке.-([%d%.]+)')
        local depLine = plainText:match('депозите.-([%d%.]+)')
        local azLine = plainText:match('состояние счета.-([%d%.]+)') or plainText:match('AZ%-Coins.-([%d%.]+)')

        if isParsingPayDay then
            pdData.accountId = accountIdNum
            pdData.level = levelNum
            pdData.curExp = curExpNum
            pdData.maxExp = maxExpNum
            pdData.bankBalance = parseMoney(bankLine)
            pdData.depositBalance = parseMoney(depLine)
            pdData.AZCoinsBalance = parseMoney(azLine)
        else
            sendDataAsync('/auth', {
                accountId = accountIdNum,
                nickname = nickName,
                server = currentServer,
                level = levelNum,
                curExp = curExpNum,
                maxExp = maxExpNum,
                bankBalance = parseMoney(bankLine),
                depositBalance = parseMoney(depLine),
                AZCoinsBalance = parseMoney(azLine)
            })
        end

        sampSendDialogResponse(dialogId, 0, 0, '')
        return false
    end
end
