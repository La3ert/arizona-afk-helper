---@diagnostic disable: undefined-global
script_name("AFK Helper Client")
script_author("la3ert & AI")
script_version("1.0")

require "lib.moonloader"
local sampEvents = require 'lib.samp.events'
local cjson = require 'cjson'
local requests = require 'requests'
local bit = require 'bit'

local encoding = require 'encoding'
encoding.default = 'CP1251'
local u8 = encoding.UTF8

local API_URL = "http://localhost:3000/api"

local isHiddenStatsRequested = false
local isParsingPayDay = false
local pdData = {}

-- ==========================================
-- 1. АСИНХРОННАЯ ОТПРАВКА ДАННЫХ
-- ==========================================
local function sendDataAsync(endpoint, dataTable)
    lua_thread.create(function()
        local jsonData = cjson.encode(dataTable)

        pcall(function()
            requests.post(API_URL .. endpoint, {
                headers = { ['Content-Type'] = 'application/json' },
                data = jsonData
            })
        end)
    end)
end

-- ==========================================
-- 2. ГЛАВНЫЙ ЦИКЛ (ИНИЦИАЛИЗАЦИЯ)
-- ==========================================
function main()
    if not isSampLoaded() or not isSampfuncsLoaded() then return end
    while not isSampAvailable() do wait(100) end

    sampAddChatMessage("{00FF00}[AFK Helper] {FFFFFF}Скрипт успешно загружен/перезагружен!", -1)

    local _, myId = sampGetPlayerIdByCharHandle(PLAYER_PED)
    local myNick = sampGetPlayerNickname(myId)
    local serverName = "Arizona RP"

    sendDataAsync('/connect', {
        nickname = myNick,
        server = serverName
    })

    while not sampIsLocalPlayerSpawned() do
        wait(500)
    end

    sendDataAsync('/auth', {
        level = sampGetPlayerScore(myId),
        curExp = 0, maxExp = 0, bankBalance = 0, depositBalance = 0
    })

    isHiddenStatsRequested = true
    sampSendChat("/stats")

    sampRegisterChatCommand("testpd", function()
        sampAddChatMessage("{00FF00}[AFK Helper] {FFFFFF}Запускаю симуляцию часового PayDay...", -1)
        sampEvents.onServerMessage(0xFFFFFF, "______________________________Банковский чек______________________________")
        sampEvents.onServerMessage(0xFFFFFF, "Текущая сумма в банке: $194,261,750 {33AA33}(+$541,754)")
        sampEvents.onServerMessage(0xFFFFFF, "В данный момент у вас 76-й уровень и 74/308 респектов {33AA33}(+4 EXP)")
        sampEvents.onServerMessage(0xFFFFFF, "Текущая сумма на депозите: $272,347,170 {33AA33}(+$490,998)")
        sampEvents.onServerMessage(0xFFFFFF, "Общая заработная плата: $541,754")
        sampEvents.onServerMessage(0xFFFFFF, "Баланс на донат-счет: 395 AZ {ff6666}(+4 AZ)")
        sampEvents.onServerMessage(0xFFFFFF, "Вы получили {FFFFFF}+$30.000 {C2A2DA}за Дивидентный договор {C0C0C0}(выдается каждый часовой PayDay)")
        sampEvents.onServerMessage(0xFFFFFF, "__________________________________________________________________________")
    end)

    lua_thread.create(function()
            while true do
                wait(1000)

                pcall(function()
                    local response = requests.get(API_URL .. '/get-messages')

                    if response and response.status_code == 200 then
                        local data = cjson.decode(response.text)

                        if data.messages and #data.messages > 0 then
                            for _, msg in ipairs(data.messages) do
                                local sampMessage = u8:decode(msg)

                                sampSendChat(sampMessage)
                            end
                        end
                    end
                end)
            end
        end)

    while true do
        wait(0)
    end
end

function onScriptTerminate(script, quitGame)
    if script == thisScript() then
        sendDataAsync('/disconnect', {})
    end
end

-- ==========================================
-- 3. ПЕРЕХВАТЧИК ЧАТА (Кусочки текста + PayDay)
-- ==========================================
function sampEvents.onServerMessage(color, text)
    -- Очищаем текст для работы PayDay (он остается без изменений)
    local plainText = text:gsub("{%x+}", "")

    -- 3.1 ПАРСЕР ЧАТА НА КУСОЧКИ ДЛЯ ФРОНТЕНДА
        -- bit.band отсекает лишний Альфа-канал и оставляет чистый RGB цвет
        -- Сдвигаем цвет на 8 бит вправо (убираем прозрачность FF в конце) и берем чистые 6 символов RGB
        local cleanRGB = bit.band(bit.rshift(color, 8), 0xFFFFFF)
        local baseColor = string.format("#%06X", cleanRGB)
        local chatParts = {}
        local currentColor = baseColor
        local lastPos = 1

        -- Железобетонный цикл, который по очереди ищет все теги {HEX}
        while true do
            local startPos, endPos, hex = string.find(text, "{(%x%x%x%x%x%x)}", lastPos)

            -- Если цветов больше нет, прерываем цикл
            if not startPos then break end

            -- Если перед найденным цветом есть текст, сохраняем его со старым цветом
            if startPos > lastPos then
                local textChunk = string.sub(text, lastPos, startPos - 1)
                table.insert(chatParts, {
                    text = u8(textChunk),
                    color = currentColor
                })
            end

            -- Обновляем текущий цвет на найденный
            currentColor = "#" .. string.upper(hex)
            -- Сдвигаем указатель поиска дальше (за закрывающую скобку '}')
            lastPos = endPos + 1
        end

        -- Сохраняем весь оставшийся хвост текста
        if lastPos <= #text then
            local textChunk = string.sub(text, lastPos)
            table.insert(chatParts, {
                text = u8(textChunk),
                color = currentColor
            })
        end

        -- Отправляем
        sendDataAsync('/chat', {
            time = os.date("%H:%M:%S"),
            parts = chatParts
        })

    -- 3.2 ЛОВЕЦ PAYDAY
    if plainText:find("Банковский чек") and plainText:find("____") then
        isParsingPayDay = true
        pdData = {
            salary = 0, deposit = 0, dividends = 0, earnedAZCoins = 0, earnedExp = 0,
            level = 0, curExp = 0, maxExp = 0, bankBalance = 0, depositBalance = 0
        }
        return
    end

    if isParsingPayDay then
        local bankStr = plainText:match("Текущая сумма в банке:%s+%$([%d%,]+)")
        if bankStr then pdData.bankBalance = tonumber((bankStr:gsub(",", ""))) end

        local lvl, cExp, mExp, eExp = plainText:match("у вас (%d+)%-й уровень и (%d+)/(%d+) респектов.*%+(%d+)%s*EXP")
        if lvl then
            pdData.level = tonumber(lvl)
            pdData.curExp = tonumber(cExp)
            pdData.maxExp = tonumber(mExp)
            pdData.earnedExp = tonumber(eExp)
        end

        local depBalStr = plainText:match("Текущая сумма на депозите:%s+%$([%d%,]+)")
        local depEarnedStr = plainText:match("Текущая сумма на депозите:.*%(%+%s*%$([%d%,]+)%)")
        if depBalStr then pdData.depositBalance = tonumber((depBalStr:gsub(",", ""))) end
        if depEarnedStr then pdData.deposit = tonumber((depEarnedStr:gsub(",", ""))) end

        local salStr = plainText:match("Общая заработная плата:%s+%$([%d%,]+)")
        if salStr then pdData.salary = tonumber((salStr:gsub(",", ""))) end

        local azStr = plainText:match("Баланс на донат%-счет:.*%+(%d+)%s*AZ")
        if azStr then pdData.earnedAZCoins = tonumber(azStr) end

        local divStr = plainText:match("Вы получили.*%+%s*%$([%d%.%,]+)%s*за Дивидентный договор")
        if divStr then
            local cleanDiv = divStr:gsub(",", ""):gsub("%.", "")
            pdData.dividends = tonumber(cleanDiv)
        end

        if plainText:find("^____+") and not plainText:find("Банковский чек") then
            isParsingPayDay = false
            sendDataAsync('/payday', pdData)
        end
    end
end

-- ==========================================
-- 4. ПЕРЕХВАТЧИК ДИАЛОГОВ (Режим Ниндзя)
-- ==========================================
function sampEvents.onShowDialog(dialogId, style, title, button1, button2, text)
    if isHiddenStatsRequested and title:find("Основная статистика") then
        isHiddenStatsRequested = false

        local plainText = text:gsub("{%x+}", "")

        local levelStr = plainText:match("Уровень:%s*%[(%d+)%]")
        local levelNum = tonumber(levelStr) or sampGetPlayerScore(myId)

        local curExpStr, maxExpStr = plainText:match("Уважение:%s*%[(%d+)/(%d+)%]")
        local curExpNum = tonumber(curExpStr) or 0
        local maxExpNum = tonumber(maxExpStr) or 0

        local bankStr = plainText:match("Деньги в банке:%s*%[%$([%d%,]+)%]")
        local bankNum = 0
        if bankStr then bankNum = tonumber((bankStr:gsub(",", ""))) or 0 end

        local depStr = plainText:match("Деньги на депозите:%s*%[%$([%d%,]+)%]")
        local depNum = 0
        if depStr then depNum = tonumber((depStr:gsub(",", ""))) or 0 end

        sendDataAsync('/auth', {
            level = levelNum,
            curExp = curExpNum,
            maxExp = maxExpNum,
            bankBalance = bankNum,
            depositBalance = depNum
        })

        sampSendDialogResponse(dialogId, 0, 0, "")
        return false
    end
end