// ============================================================
// 🎨 白板模組 - 國家考試規格
// 完整保留原白板功能 (繪圖 + 拖曳)
// ============================================================

let wbMode = 'pencil',
    wbColor = '#000000',
    wbSize = 4,
    isDrawing = false,
    lastX = 0,
    lastY = 0,
    wbCanvas, wbCtx;

function initWhiteboard() {
    wbCanvas = document.getElementById('whiteboardCanvas');
    if (!wbCanvas) return;
    const wrapper = wbCanvas.parentElement;
    wbCanvas.width = wrapper.clientWidth - 10;
    wbCanvas.height = wrapper.clientHeight - 10;
    wbCtx = wbCanvas.getContext('2d');
    wbCtx.fillStyle = '#ffffff';
    wbCtx.fillRect(0, 0, wbCanvas.width, wbCanvas.height);
    const canvas = wbCanvas,
        ctx = wbCtx;

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        return { x: (clientX - rect.left) * (canvas.width / rect.width), y: (clientY - rect.top) * (canvas.height / rect
                .height) };
    }

    function startDraw(e) { e.preventDefault();
        isDrawing = true;
        const pos = getPos(e);
        lastX = pos.x;
        lastY = pos.y; }

    function draw(e) {
        e.preventDefault();
        if (!isDrawing) return;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);
        if (wbMode === 'eraser') { ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = wbSize * 3; } else { ctx.strokeStyle = wbColor;
            ctx.lineWidth = wbSize; }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        lastX = pos.x;
        lastY = pos.y;
    }

    function endDraw(e) { isDrawing = false; }
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', endDraw, { passive: false });
    window.addEventListener('resize', function() {
        const oldData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.width = wrapper.clientWidth - 10;
        canvas.height = wrapper.clientHeight - 10;
        ctx.putImageData(oldData, 0, 0);
    });
}

function toggleWhiteboard() {
    const container = document.getElementById('whiteboardContainer');
    const btn = document.getElementById('btnWbFloat');
    if (!container || !btn) return;
    container.classList.toggle('visible');
    btn.classList.toggle('active');
    btn.textContent = container.classList.contains('visible') ? '🎨 關閉小畫家' : '🎨 小畫家';
    if (container.classList.contains('visible')) {
        setTimeout(initWhiteboard, 100);
        setTimeout(initWhiteboardDrag, 150);
    }
}

function closeWhiteboard() {
    const container = document.getElementById('whiteboardContainer');
    const btn = document.getElementById('btnWbFloat');
    if (container) container.classList.remove('visible');
    if (btn) { btn.classList.remove('active');
        btn.textContent = '🎨 小畫家'; }
}

function setWbMode(mode) {
    wbMode = mode;
    const pencil = document.getElementById('wbPencil');
    const eraser = document.getElementById('wbEraser');
    const status = document.getElementById('wbStatus');
    if (pencil) pencil.classList.toggle('active', mode === 'pencil');
    if (eraser) eraser.classList.toggle('active', mode === 'eraser');
    if (status) status.textContent = mode === 'pencil' ? '✏️ 鉛筆模式' : '🧹 橡皮擦模式';
    if (wbCanvas) wbCanvas.style.cursor = mode === 'eraser' ? 'cell' : 'crosshair';
}

function setWbColor(color) { wbColor = color; }

function setWbSize(size) { wbSize = parseInt(size); }

function clearWhiteboard() {
    if (!wbCanvas || !wbCtx) return;
    wbCtx.fillStyle = '#ffffff';
    wbCtx.fillRect(0, 0, wbCanvas.width, wbCanvas.height);
}

function initWhiteboardDrag() {
    const container = document.getElementById('whiteboardContainer');
    const handle = document.getElementById('wbDragHandle');
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
} // 已定義 // 已定義 // 已定義

console.log('✅ 白板模組已載入 (國家考試規格)');

