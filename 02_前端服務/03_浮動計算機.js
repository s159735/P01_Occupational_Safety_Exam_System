// ============================================================
// 🧮 計算機模組 - 國家考試規格
// 完整保留原計算機功能 (科學計算 + 拖曳)
// ============================================================

let calcExpression = '';
let calcAns = 0;

function calcInput(value) {
    if (value === 'ANS') value = String(calcAns);
    if (value === '²') value = '^2';
    if (value === '!') value = '!';
    calcExpression += value;
    const resultEl = document.getElementById('calcResult');
    if (resultEl) resultEl.textContent = calcExpression || '0';
}

function calcClear() {
    calcExpression = '';
    const resultEl = document.getElementById('calcResult');
    if (resultEl) resultEl.textContent = '0';
}

function calcBackspace() {
    calcExpression = calcExpression.slice(0, -1);
    const resultEl = document.getElementById('calcResult');
    if (resultEl) resultEl.textContent = calcExpression || '0';
}

function calcCalculate() {
    try {
        let expr = calcExpression.replace(/√\(/g, 'Math.sqrt(').replace(/\^/g, '**').replace(/×/g, '*').replace(/÷/g, '/')
            .replace(/π/g, 'Math.PI').replace(/e(?![xp])/g, 'Math.E').replace(/exp\(/g, 'Math.exp(')
            .replace(/ln\(/g, 'Math.log(').replace(/log\(/g, 'Math.log10(');
        expr = expr.replace(/(\d+)!/g, function(_, n) { return 'factorial(' + n + ')'; });
        const factorial = function(n) { if (n < 0) return NaN; if (n === 0 || n === 1) return 1; let r = 1;
            for (let i = 2; i <= n; i++) r *= i; return r; };
        const result = Function('factorial', 'return ' + expr)(factorial);
        const resultEl = document.getElementById('calcResult');
        if (isNaN(result) || !isFinite(result)) {
            if (resultEl) resultEl.textContent = '錯誤';
        } else {
            const display = Number(result.toFixed(12));
            if (resultEl) resultEl.textContent = String(display);
            calcAns = display;
        }
    } catch (e) {
        const resultEl = document.getElementById('calcResult');
        if (resultEl) resultEl.textContent = '錯誤';
    }
}

function toggleCalculator() {
    const container = document.getElementById('calculatorContainer');
    const btn = document.getElementById('btnCalcFloat');
    if (!container || !btn) return;
    container.classList.toggle('visible');
    btn.classList.toggle('active');
    btn.textContent = container.classList.contains('visible') ? '🧮 關閉計算機' : '🧮 計算機';
    if (container.classList.contains('visible')) {
        setTimeout(initCalculatorDrag, 50);
    }
}

function closeCalculator() {
    const container = document.getElementById('calculatorContainer');
    const btn = document.getElementById('btnCalcFloat');
    if (container) container.classList.remove('visible');
    if (btn) { btn.classList.remove('active');
        btn.textContent = '🧮 計算機'; }
}

function initCalculatorDrag() {
    const container = document.getElementById('calculatorContainer');
    const handle = document.getElementById('calcDragHandle');
    if (!container || !handle) return;
    handle.removeEventListener('mousedown', handle._dragStart);
    let isDragging = false,
        offsetX = 0,
        offsetY = 0;

    function onMouseDown(e) {
        if (e.target.classList.contains('close-btn')) return;
        isDragging = true;
        const rect = container.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        container.style.cursor = 'grabbing';
        e.preventDefault();
    }

    function onMouseMove(e) {
        if (!isDragging) return;
        container.style.left = (e.clientX - offsetX) + 'px';
        container.style.top = (e.clientY - offsetY) + 'px';
        container.style.right = 'auto';
        container.style.bottom = 'auto';
    }

    function onMouseUp() {
        if (isDragging) {
            isDragging = false;
            container.style.cursor = '';
        }
    }
    handle._dragStart = onMouseDown;
    handle.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

console.log('✅ 計算機模組已載入 (國家考試規格)');
