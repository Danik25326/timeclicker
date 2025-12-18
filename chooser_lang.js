(function() {
    // 1. Словник перекладів для екрану вибору
    const vocab = {
        'uk': { flag: '🇺🇦', pc: 'ПК-версія', mob: 'Мобільна версія', title: 'Times Clicker' },
        'en': { flag: '🇺🇸', pc: 'PC Version', mob: 'Mobile Version', title: 'Times Clicker' },
        'pl': { flag: '🇵🇱', pc: 'Wersja PC', mob: 'Wersja Mobilna', title: 'Times Clicker' },
        'de': { flag: '🇩🇪', pc: 'PC-Version', mob: 'Mobile Version', title: 'Times Clicker' },
        'fr': { flag: '🇫🇷', pc: 'Version PC', mob: 'Version Mobile', title: 'Times Clicker' },
        'es': { flag: '🇪🇸', pc: 'Versión PC', mob: 'Versión Móvil', title: 'Times Clicker' },
        'it': { flag: '🇮🇹', pc: 'Versione PC', mob: 'Versione Mobile', title: 'Times Clicker' }
    };

    // 2. Стилі для кнопки та меню (вставляємо динамічно)
    const styles = `
        .lang-wrapper { position: relative; margin-top: 20px; display: inline-block; }
        .flag-btn { 
            background: rgba(255,255,255,0.1); border: 2px solid #0ea5e9; border-radius: 50%; 
            width: 50px; height: 50px; font-size: 30px; cursor: pointer; 
            transition: all 0.3s; padding: 0; line-height: 46px; display: flex; 
            justify-content: center; align-items: center; 
        }
        .flag-btn:hover { transform: scale(1.1); background: rgba(14,165,233,0.3); }
        .lang-dropdown {
            display: none; position: absolute; bottom: 60px; left: 50%; transform: translateX(-50%);
            background: #0b1220; border: 2px solid #0ea5e9; border-radius: 15px;
            padding: 10px; width: 220px; text-align: center; z-index: 1000;
            box-shadow: 0 0 20px rgba(0,0,0,0.8);
            grid-template-columns: repeat(3, 1fr); gap: 10px;
        }
        .lang-dropdown.show { display: grid; }
        .lang-opt {
            font-size: 24px; cursor: pointer; padding: 5px; border-radius: 8px;
            transition: background 0.2s;
        }
        .lang-opt:hover { background: rgba(255,255,255,0.2); }
    `;

    // 3. Функція ініціалізації
    function initChooserLang() {
        const chooser = document.getElementById('chooser');
        if (!chooser) return;

        // Додаємо стилі
        const styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);

        // Створюємо контейнер для мови
        const wrapper = document.createElement('div');
        wrapper.className = 'lang-wrapper';
        
        // Кнопка поточного прапора (за замовчуванням Україна)
        const currentBtn = document.createElement('button');
        currentBtn.className = 'flag-btn';
        currentBtn.id = 'currFlagBtn';
        currentBtn.innerHTML = vocab['uk'].flag;
        currentBtn.setAttribute('aria-label', 'Change Language');
        
        // Випадаюче меню
        const dropdown = document.createElement('div');
        dropdown.className = 'lang-dropdown';
        
        // Наповнюємо меню прапорами
        Object.keys(vocab).forEach(code => {
            const opt = document.createElement('div');
            opt.className = 'lang-opt';
            opt.innerHTML = vocab[code].flag;
            opt.onclick = () => setLang(code);
            dropdown.appendChild(opt);
        });

        // Клік по головному прапору - показати/сховати меню
        currentBtn.onclick = (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        };

        // Клік деінде - закрити меню
        document.addEventListener('click', () => dropdown.classList.remove('show'));

        wrapper.appendChild(dropdown);
        wrapper.appendChild(currentBtn);
        chooser.appendChild(wrapper);
    }

    // 4. Функція зміни мови (міняє ТІЛЬКИ текст кнопок)
    function setLang(code) {
        const data = vocab[code];
        if (!data) return;

        // Оновлюємо іконку
        document.getElementById('currFlagBtn').innerHTML = data.flag;
        
        // Оновлюємо тексти кнопок (шукаємо за атрибутами або порядком)
        const title = document.querySelector('#chooser h2');
        const btns = document.querySelectorAll('#chooser .choose-btn');

        if (title) title.innerText = data.title;
        // Кнопка ПК (перша)
        if (btns[0]) btns[0].innerText = data.pc;
        // Кнопка Мобільна (друга)
        if (btns[1]) btns[1].innerText = data.mob;

        // Ховаємо меню
        document.querySelector('.lang-dropdown').classList.remove('show');
    }

    // Запускаємо після завантаження сторінки
    window.addEventListener('DOMContentLoaded', initChooserLang);
})();
