-- Основний ефект перезапуску
local restartEffect = {
    active = false,
    bubbles = {},
    stats = {},
    flash = 0,
    multiplier = 1.0
}

-- Ініціалізація бульбашок-годинників
function restartEffect.init()
    for i = 1, 12 do
        restartEffect.bubbles[i] = {
            x = math.random(50, 750),
            y = math.random(50, 550),
            r = math.random(25, 60),
            time = string.format("%02d:%02d", math.random(0,23), math.random(0,59)),
            alpha = math.random(3, 7) * 0.1
        }
    end
end

-- Оновлення ефекту
function restartEffect.update(dt)
    if not restartEffect.active then return end
    
    -- Оновлення вспишки
    if restartEffect.flash > 0 then
        restartEffect.flash = restartEffect.flash - dt
    end
    
    -- Додавання випадкової статистики
    if math.random() < 0.1 then
        local statsList = {
            "Комбо: " .. (maxCombo or 0),
            "Кліків: " .. (totalClicks or 0),
            "Апгрейдів: " .. (upgradesCount or 0),
            "Рекорд: " .. (record or 0)
        }
        table.insert(restartEffect.stats, {
            text = statsList[math.random(#statsList)],
            x = math.random(100, 700),
            y = 600,
            life = 2,
            alpha = 1
        })
    end
    
    -- Оновлення бульбашок статистики
    for i = #restartEffect.stats, 1, -1 do
        local stat = restartEffect.stats[i]
        stat.y = stat.y - 60 * dt
        stat.life = stat.life - dt
        stat.alpha = stat.life / 2
        if stat.life <= 0 then
            table.remove(restartEffect.stats, i)
        end
    end
end

-- Малювання ефекту
function restartEffect.draw()
    if not restartEffect.active then return end
    
    -- Фон з бульбашками-годинниками
    for _, b in ipairs(restartEffect.bubbles) do
        love.graphics.setColor(1,1,1,b.alpha)
        love.graphics.circle("line", b.x, b.y, b.r)
        love.graphics.print(b.time, b.x-15, b.y-5)
    end
    
    -- Бульбашки статистики
    for _, stat in ipairs(restartEffect.stats) do
        love.graphics.setColor(0.8,0.9,1,stat.alpha)
        love.graphics.circle("fill", stat.x, stat.y, 30)
        love.graphics.setColor(0,0,0,stat.alpha)
        love.graphics.print(stat.text, stat.x-28, stat.y-5)
    end
    
    -- Фінальний екран після вспишки
    if restartEffect.flash <= 0 then
        love.graphics.setColor(1,1,1,1)
        love.graphics.printf("Ви успішно повернулися в часі!", 0, 250, 800, "center")
        love.graphics.printf("Ваш множник: "..string.format("%.2f",restartEffect.multiplier).."x", 0, 300, 800, "center")
        love.graphics.printf("Натисніть будь-де щоб продовжити", 0, 350, 800, "center")
    else
        -- Біла вспишка
        love.graphics.setColor(1,1,1,restartEffect.flash)
        love.graphics.rectangle("fill", 0, 0, 800, 600)
    end
end

-- Запуск перезапуску
function restartEffect.start()
    restartEffect.active = true
    restartEffect.flash = 0.5
    restartEffect.stats = {}
    restartEffect.multiplier = calculateMultiplier() -- Ваша функція
end

-- Завершення перезапуску
function restartEffect.finish()
    restartEffect.active = false
end

-- Обробка кліку
function restartEffect.mousepressed()
    if restartEffect.active and restartEffect.flash <= 0 then
        restartEffect.finish()
        return true
    end
    return false
end

-- Ініціалізуємо при завантаженні
restartEffect.init()
