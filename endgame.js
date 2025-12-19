// ===== СИСТЕМА КІНЦЯ ЧАСУ =====

const EndGameSystem = {
    // Стан системи
    state: {
        keysObtained: 0, // 0, 1 або 2
        endTimeUpgradeUnlocked: false,
        miniGamesCompleted: 0, // 0-3
        clockDefeated: false,
        timeStopped: false,
        lastSecretCode: '',
        miniGamesState: {1: false, 2: false, 3: false}
    },
    
    // Ініціалізація
    init() {
        this.loadState();
        this.checkForFirstKey();
        this.setupEventListeners();
        console.log('EndGame System loaded. Keys:', this.state.keysObtained);
    },
    
    // Завантаження стану
    loadState() {
        const saved = localStorage.getItem('timeClickerEndGame');
        if (saved) {
            try {
                this.state = {...this.state, ...JSON.parse(saved)};
            } catch(e) {
                console.error('Помилка завантаження EndGame:', e);
            }
        }
    },
    
    // Збереження стану
    saveState() {
        localStorage.setItem('timeClickerEndGame', JSON.stringify(this.state));
    },
    
    // Перевірка чи всі зірки відкриті для першого ключа
    checkForFirstKey() {
        if (this.state.keysObtained >= 1) return;
        
        // Перевіряємо чи всі зірки в сузір'ї відкриті
        const allStars = [
            ...constellation.hourHand.stars,
            ...constellation.minuteHand.stars,
            ...constellation.secondHand.stars
        ];
        
        const allUnlocked = allStars.every(star => star.unlocked) && 
                           constellation.center.unlocked;
        
        if (allUnlocked && !this.state.keysObtained) {
            this.grantFirstKey();
        }
    },
    
    // Видати перший ключ
    grantFirstKey() {
        this.state.keysObtained = 1;
        this.state.endTimeUpgradeUnlocked = true;
        
        // Показати повідомлення
        this.showKeyNotification();
        
        // Оновити апгрейди
        this.addEndTimeUpgrade();
        
        this.saveState();
    },
    
    // Показати сповіщення про ключ
    showKeyNotification() {
        const notification = document.createElement('div');
        notification.className = 'key-notification';
        notification.innerHTML = `
            <div class="key-notification-content">
                <h3>🔑 Ключ отримано!</h3>
                <p>Ви отримали 1 з 2 ключів!</p>
                <p>Відкрито новий апгрейд: <strong>Кінець часу</strong></p>
                <button onclick="this.parentElement.parentElement.remove()">OK</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Автоматично прибрати через 10 секунд
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    },
    
    // Додати апгрейд "Кінець часу"
    addEndTimeUpgrade() {
        // Перевіряємо чи вже є такий апгрейд
        if (document.querySelector('.upgrade-btn[data-id="end-time"]')) return;
        
        // Знаходимо контейнер апгрейдів
        const upgradesContainer = document.getElementById('upgrades');
        if (!upgradesContainer) return;
        
        // Створюємо кнопку апгрейду
        const endTimeBtn = document.createElement('button');
        endTimeBtn.className = 'upgrade-btn';
        endTimeBtn.dataset.id = 'end-time';
        endTimeBtn.innerHTML = `Кінець часу<span>0 сек</span>`;
        endTimeBtn.onclick = () => this.startEndTimeSequence();
        
        // Додаємо в кінець списку
        upgradesContainer.appendChild(endTimeBtn);
    },
    
    // Початок сюжетної лінії
    startEndTimeSequence() {
        // Перевірка чи є ключ
        if (this.state.keysObtained < 1) {
            showToast("Спочатку отримайте ключ!");
            return;
        }
        
        // Початок діалогу
        this.showDialogueScene();
    },
    
    // Показати сцену з діалогами
    showDialogueScene() {
        // Створюємо оверлей
        const overlay = this.createOverlay();
        
        // Перший діалог
        this.showDialogueStep(1, overlay);
    },
    
    // Створити оверлей для діалогів
    createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'endgameOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at center, #0a0a2a 0%, #000 100%);
            z-index: 20000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: 'Poppins', sans-serif;
            padding: 20px;
        `;
        
        document.body.appendChild(overlay);
        return overlay;
    },
    
    // Показати крок діалогу
    showDialogueStep(step, overlay) {
        overlay.innerHTML = '';
        
        switch(step) {
            case 1:
                this.showClockDialogue(overlay);
                break;
            case 2:
                this.showPlayerResponse(overlay);
                break;
            case 3:
                this.showSecondClockDialogue(overlay);
                break;
            case 4:
                this.showChoice(overlay);
                break;
            case 5:
                this.showMiniGamesTable(overlay);
                break;
        }
    },
    
    // Діалог годинника
    showClockDialogue(overlay) {
        const dialogue = document.createElement('div');
        dialogue.className = 'dialogue-box';
        dialogue.innerHTML = `
            <div class="clock-avatar">🕰️</div>
            <div class="dialogue-text" id="dialogueText">
                Так так так, ти той хто реально хоче зупинити час?
            </div>
            <button class="continue-btn" onclick="EndGameSystem.continueDialogue(2)">
                Продовжити
            </button>
        `;
        
        overlay.appendChild(dialogue);
        this.typeText(document.getElementById('dialogueText'), 
                     "Так так так, ти той хто реально хоче зупинити час?");
    },
    
    // Відповідь гравця
    showPlayerResponse(overlay) {
        const dialogue = document.createElement('div');
        dialogue.className = 'dialogue-box player-response';
        dialogue.innerHTML = `
            <div class="player-avatar">...</div>
            <div class="dialogue-text" id="dialogueText">
                ...
            </div>
            <button class="continue-btn" onclick="EndGameSystem.continueDialogue(3)">
                Продовжити
            </button>
        `;
        
        overlay.appendChild(dialogue);
        this.typeText(document.getElementById('dialogueText'), "...");
    },
    
    // Другий діалог годинника
    showSecondClockDialogue(overlay) {
        const dialogue = document.createElement('div');
        dialogue.className = 'dialogue-box';
        dialogue.innerHTML = `
            <div class="clock-avatar">🕰️</div>
            <div class="dialogue-text" id="dialogueText">
                Навіть мовчання це відповідь. Ну якщо ти дійсно хочеш його зупинити, то тобі треба мене перемогти в 3 іграх.
            </div>
            <button class="continue-btn" onclick="EndGameSystem.continueDialogue(4)">
                Продовжити
            </button>
        `;
        
        overlay.appendChild(dialogue);
        this.typeText(document.getElementById('dialogueText'), 
                     "Навіть мовчання це відповідь. Ну якщо ти дійсно хочеш його зупинити, то тобі треба мене перемогти в 3 іграх.");
    },
    
    // Вибір гравця
    showChoice(overlay) {
        const dialogue = document.createElement('div');
        dialogue.className = 'dialogue-box';
        dialogue.innerHTML = `
            <div class="clock-avatar">🕰️</div>
            <div class="dialogue-text">
                Ти готовий відважитися і спробувати мене перемогти?
            </div>
            <div class="choice-buttons">
                <button class="choice-btn ready" onclick="EndGameSystem.playerChoice(true)">
                    Готовий
                </button>
                <button class="choice-btn not-ready" onclick="EndGameSystem.playerChoice(false)">
                    Не готовий
                </button>
            </div>
        `;
        
        overlay.appendChild(dialogue);
    },
    
    // Показати таблицю міні-ігор
    showMiniGamesTable(overlay) {
        overlay.innerHTML = `
            <div class="mini-games-table">
                <h2>⚔️ Виклик Часу</h2>
                <div class="score-table">
                    <div class="score-row clock-score">
                        <div class="player-name">Годинник</div>
                        <div class="game-cells">
                            <div class="game-cell" id="clockGame1">-</div>
                            <div class="game-cell" id="clockGame2">-</div>
                            <div class="game-cell" id="clockGame3">-</div>
                        </div>
                    </div>
                    <div class="score-row player-score">
                        <div class="player-name">Ви</div>
                        <div class="game-cells">
                            <div class="game-cell" id="playerGame1">-</div>
                            <div class="game-cell" id="playerGame2">-</div>
                            <div class="game-cell" id="playerGame3">-</div>
                        </div>
                    </div>
                </div>
                <p class="instructions">Якщо ти хоча б в одній грі програєш, то ти програв.</p>
                <button class="continue-btn" onclick="EndGameSystem.chooseFirstGame()">
                    Обрати першу гру
                </button>
            </div>
        `;
    },
    
    // Вибір першої гри
    chooseFirstGame() {
        const overlay = document.getElementById('endgameOverlay');
        overlay.innerHTML = `
            <div class="game-selection">
                <h2>🎮 Обери першу гру</h2>
                <div class="game-options">
                    <div class="game-option" onclick="EndGameSystem.startMiniGame(1)">
                        <div class="game-icon">🚀</div>
                        <div class="game-title">Космічний шутер</div>
                        <div class="game-desc">2D шутер з хвилями ворогів</div>
                    </div>
                    <div class="game-option" onclick="EndGameSystem.startMiniGame(2)">
                        <div class="game-icon">🏒</div>
                        <div class="game-title">Арохокей</div>
                        <div class="game-desc">Класична гра на реакцію</div>
                    </div>
                    <div class="game-option" onclick="EndGameSystem.startMiniGame(3)">
                        <div class="game-icon">🎱</div>
                        <div class="game-title">Пінбол</div>
                        <div class="game-desc">Аркадна гра з фізикою</div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Запустити міні-гру
    startMiniGame(gameNumber) {
        // Приховуємо оверлей
        const overlay = document.getElementById('endgameOverlay');
        overlay.style.display = 'none';
        
        // Запускаємо відповідну гру
        switch(gameNumber) {
            case 1:
                this.startSpaceShooter();
                break;
            case 2:
                this.startAirHockey();
                break;
            case 3:
                this.startPinball();
                break;
        }
    },
    
    // Космічний шутер (простий приклад)
    startSpaceShooter() {
        // Створюємо канвас для гри
        const gameContainer = document.createElement('div');
        gameContainer.id = 'spaceShooterGame';
        gameContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            z-index: 20001;
        `;
        
        gameContainer.innerHTML = `
            <canvas id="shooterCanvas" width="800" height="600"></canvas>
            <div class="game-ui">
                <div class="score">Рахунок: <span id="shooterScore">0</span></div>
                <div class="waves">Хвиля: <span id="currentWave">1</span>/3</div>
                <button onclick="EndGameSystem.endMiniGame(1, true)">Завершити (тест)</button>
            </div>
        `;
        
        document.body.appendChild(gameContainer);
        
        // Тут буде код гри...
        // Поки що тестова кнопка для завершення
    },
    
    // Завершити міні-гру
    endMiniGame(gameNumber, won) {
        // Оновлюємо стан
        this.state.miniGamesState[gameNumber] = won;
        this.state.miniGamesCompleted++;
        
        // Прибираємо гру
        const gameElement = document.getElementById('spaceShooterGame') || 
                           document.getElementById('airHockeyGame') || 
                           document.getElementById('pinballGame');
        if (gameElement) {
            gameElement.remove();
        }
        
        // Показуємо результат
        const overlay = document.getElementById('endgameOverlay');
        overlay.style.display = 'flex';
        
        if (won) {
            this.showGameResult(true, gameNumber);
        } else {
            this.showGameResult(false, gameNumber);
        }
    },
    
    // Показати результат гри
    showGameResult(won, gameNumber) {
        const overlay = document.getElementById('endgameOverlay');
        
        if (won) {
            overlay.innerHTML = `
                <div class="result-screen win">
                    <h2>🎉 Перемога!</h2>
                    <p>Ти переміг у грі ${gameNumber}!</p>
                    ${this.state.miniGamesCompleted < 3 ? 
                        `<button onclick="EndGameSystem.showMiniGamesTable(overlay)">
                            Продовжити
                        </button>` : 
                        `<button onclick="EndGameSystem.completeAllGames()">
                            Завершити виклик
                        </button>`
                    }
                </div>
            `;
            
            // Оновити таблицю
            const playerCell = document.getElementById(`playerGame${gameNumber}`);
            if (playerCell) playerCell.textContent = '✓';
            const clockCell = document.getElementById(`clockGame${gameNumber}`);
            if (clockCell) clockCell.textContent = '✗';
        } else {
            overlay.innerHTML = `
                <div class="result-screen lose">
                    <h2>💔 Поразка</h2>
                    <p>Ти програв у грі ${gameNumber}...</p>
                    <p>Годинник: "Я так і знав!"</p>
                    <button onclick="EndGameSystem.returnToMain()">
                        Повернутися
                    </button>
                </div>
            `;
        }
    },
    
    // Всі гри завершено
    completeAllGames() {
        if (this.state.miniGamesCompleted === 3) {
            this.grantSecondKey();
        }
    },
    
    // Видати другий ключ
    grantSecondKey() {
        this.state.keysObtained = 2;
        this.state.clockDefeated = true;
        
        const overlay = document.getElementById('endgameOverlay');
        overlay.innerHTML = `
            <div class="final-dialogue">
                <div class="clock-avatar">🕰️</div>
                <div class="dialogue-text">
                    Я тебе недооцінював. Твоє прагнення зупинити час реально дуже сильне. Ось твій ключ.
                </div>
                <button onclick="EndGameSystem.showFinalLetter()">
                    Продовжити
                </button>
            </div>
        `;
        
        this.saveState();
    },
    
    // Показати фінальний лист
    showFinalLetter() {
        const overlay = document.getElementById('endgameOverlay');
        overlay.innerHTML = `
            <div class="final-letter">
                <div class="parchment">
                    <h3>Легенда мовить...</h3>
                    <p>Той хто отримає 2 ключі зможе зупинити сам потік часу.</p>
                    <p>Встав обидва ключі одночасно та поверни їх проти годинникової стрілки.</p>
                    <p>Тоді настане Кінець Часу.</p>
                    <div class="key-icon">🔑</div>
                    <button onclick="EndGameSystem.closeEndgameOverlay()">
                        Завершити
                    </button>
                </div>
            </div>
        `;
    },
    
    // Закрити оверлей
    closeEndgameOverlay() {
        const overlay = document.getElementById('endgameOverlay');
        if (overlay) overlay.remove();
        
        // Скинути ресурси
        if (typeof score !== 'undefined') {
            score = Math.floor(score * 0.1); // Втратити 90% ресурсів
            updateScore();
        }
    },
    
    // Вибір гравця (готовий/не готовий)
    playerChoice(ready) {
        if (!ready) {
            const overlay = document.getElementById('endgameOverlay');
            overlay.innerHTML = `
                <div class="rejection">
                    <div class="clock-avatar">🕰️</div>
                    <div class="dialogue-text">Я так і знав</div>
                    <button onclick="EndGameSystem.returnToMain()">
                        Повернутися
                    </button>
                </div>
            `;
        } else {
            this.continueDialogue(5);
        }
    },
    
    // Повернутися в головне меню
    returnToMain() {
        const overlay = document.getElementById('endgameOverlay');
        if (overlay) overlay.remove();
        
        // Скинути ресурси
        if (typeof score !== 'undefined') {
            score = Math.floor(score * 0.1);
            updateScore();
        }
    },
    
    // Допоміжні функції
    continueDialogue(nextStep) {
        const overlay = document.getElementById('endgameOverlay');
        this.showDialogueStep(nextStep, overlay);
    },
    
    typeText(element, text, speed = 30) {
        let i = 0;
        element.textContent = '';
        
        const typeChar = () => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(typeChar, speed);
            }
        };
        
        typeChar();
    },
    
    setupEventListeners() {
        // Додаємо обробник для двох клавіш миші
        document.addEventListener('mousedown', (e) => {
            if (this.state.keysObtained === 2 && e.buttons === 3) {
                this.activateTimeStop();
            }
        });
        
        // Обробник для двох дотиків
        document.addEventListener('touchstart', (e) => {
            if (this.state.keysObtained === 2 && e.touches.length >= 2) {
                this.activateTimeStop();
            }
        });
    },
    
    activateTimeStop() {
        if (this.state.timeStopped) return;
        
        this.state.timeStopped = true;
        
        // Анімація зупинки часу
        this.showTimeStopAnimation();
        
        // Зупинити годинник
        this.freezeClock();
        
        this.saveState();
    },
    
    showTimeStopAnimation() {
        // Тут буде анімація вставлення ключів та зупинки стрілок
        console.log('Час зупинено!');
    },
    
    freezeClock() {
        // Додати CSS клас для зупинки анімації
        document.getElementById('clickableClock').classList.add('time-frozen');
    }
};

// Ініціалізувати систему при завантаженні
window.addEventListener('load', () => {
    setTimeout(() => {
        EndGameSystem.init();
    }, 1000);
});
