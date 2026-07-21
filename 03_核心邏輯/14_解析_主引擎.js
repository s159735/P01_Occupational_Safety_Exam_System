// ============================================================
// 🧠 14_解析_主引擎 v10.2.0（完整強化版 - API 模式）
// 檔案位置：03_核心邏輯/14_解析_主引擎.js
// 職責：法規查詢 + 解析摘要 + 答題秘訣 + 邏輯標籤 + 規格模板
// 更新日期：2026-07-18
// ============================================================

console.log('🧠 14_解析_主引擎 v10.2.0（完整強化版 - API 模式）載入中...');

(function() {
    'use strict';

    // ============================================================
    // 1. 法規資料庫（從 API 載入）
    // ============================================================

    var lawCache = {};
    var lawNameIndex = {};
    var isLawLoaded = false;
    var isLoadingLaw = false;
    var loadLawPromise = null;

    function loadLawDatabase() {
        console.log('🔍 從 API 載入法規資料庫...');
        
        if (isLawLoaded && lawCache && Object.keys(lawCache).length > 0) {
            console.log('✅ 使用快取法規資料（' + Object.keys(lawCache).length + ' 部）');
            return Promise.resolve(lawCache);
        }
        
        if (isLoadingLaw && loadLawPromise) {
            console.log('⏳ 法規資料載入中，等待完成...');
            return loadLawPromise;
        }
        
        isLoadingLaw = true;
        var apiUrl = window.API_BASE_URL || 'http://localhost:8001/api';
        
        loadLawPromise = fetch(apiUrl + '/laws')
            .then(function(response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            })
            .then(function(result) {
                isLoadingLaw = false;
                if (result.success && result.data) {
                    var lawMap = {};
                    var nameMap = {};
                    result.data.forEach(function(law) {
                        lawMap[law.pcode] = {
                            name: law.display_name || law.name,
                            display_name: law.display_name || law.name,
                            pcode: law.pcode,
                            level: law.level,
                            category: law.category,
                            data: law.data || {},
                            articles: law.data ? law.data.articles || [] : []
                        };
                        if (law.name) {
                            nameMap[law.name] = law.pcode;
                        }
                        if (law.display_name) {
                            nameMap[law.display_name] = law.pcode;
                        }
                    });
                    lawCache = lawMap;
                    lawNameIndex = nameMap;
                    isLawLoaded = true;
                    console.log('✅ 法規資料庫已從 API 載入 (' + Object.keys(lawCache).length + ' 部)');
                    return lawCache;
                }
                console.warn('⚠️ API 回傳資料格式異常，使用備用資料');
                return getFallbackLaws();
            })
            .catch(function(error) {
                isLoadingLaw = false;
                console.warn('⚠️ 從 API 載入法規失敗:', error.message);
                return getFallbackLaws();
            });
        
        return loadLawPromise;
    }

    function getFallbackLaws() {
        var fallback = {
            'N0010029': { name: '職業安全衛生法', pcode: 'N0010029', level: '法律', category: '行政＞勞動部＞職業安全衛生目' },
            'N0030025': { name: '勞動基準法', pcode: 'N0030025', level: '法律', category: '行政＞勞動部＞勞動關係目' },
            'N0060009': { name: '職業安全衛生設施規則', pcode: 'N0060009', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060014': { name: '營造安全衛生設施標準', pcode: 'N0060014', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060013': { name: '起重升降機具安全規則', pcode: 'N0060013', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060027': { name: '職業安全衛生管理辦法', pcode: 'N0060027', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060022': { name: '勞工健康保護規則', pcode: 'N0060022', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060017': { name: '有機溶劑中毒預防規則', pcode: 'N0060017', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060015': { name: '特定化學物質危害預防標準', pcode: 'N0060015', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060018': { name: '鉛中毒預防規則', pcode: 'N0060018', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060020': { name: '缺氧症預防規則', pcode: 'N0060020', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060030': { name: '高壓氣體勞工安全規則', pcode: 'N0060030', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060034': { name: '機械設備器具安全標準', pcode: 'N0060034', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060004': { name: '勞工作業場所容許暴露標準', pcode: 'N0060004', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060029': { name: '高架作業勞工保護措施標準', pcode: 'N0060029', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060033': { name: '勞工作業環境監測實施辦法', pcode: 'N0060033', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060039': { name: '危險性工作場所審查及檢查辦法', pcode: 'N0060039', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060010': { name: '職業安全衛生教育訓練規則', pcode: 'N0060010', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060007': { name: '高溫作業勞工作息時間標準', pcode: 'N0060007', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060011': { name: '鍋爐及壓力容器安全規則', pcode: 'N0060011', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060054': { name: '危害性化學品標示及通識規則', pcode: 'N0060054', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060041': { name: '職業災害勞工保護法', pcode: 'N0060041', level: '法律', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060065': { name: '女性勞工母性健康保護實施辦法', pcode: 'N0060065', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'N0060069': { name: '新化學物質登記管理辦法', pcode: 'N0060069', level: '法規命令', category: '行政＞勞動部＞職業安全衛生目' },
            'D0120036': { name: '消防法', pcode: 'D0120036', level: '法律', category: '行政＞內政部＞消防目' },
            'A0000001': { name: '中央法規標準法', pcode: 'A0000001', level: '法律', category: '行政＞法務部＞法規目' }
        };
        lawCache = fallback;
        isLawLoaded = true;
        return fallback;
    }

    function queryLaw(pcode) {
        if (!pcode) return null;
        if (lawCache[pcode]) return lawCache[pcode];
        for (var key in lawCache) {
            if (lawCache[key].name === pcode) {
                return lawCache[key];
            }
        }
        return null;
    }

    // ============================================================
    // 2. 解析規則（30+ 組關鍵字配對）
    // ============================================================

    var EXPLANATION_RULES = [
        { keywords: ['未滿18歲', '18歲', '未成年', '年齡限制'], summary: '未滿18歲不得從事危險性工作，220伏特以下電力線銜接屬非危險性工作。', detail: '勞動基準法第44條規定雇主不得使未滿18歲勞工從事危險性或有害性工作。', lawRef: { pcode: 'N0030025', article: '第 44 條' } },
        { keywords: ['車輛機械', '挖土機', '堆高機', '吊籠'], summary: '車輛機械包括挖土機、堆高機等。吊籠屬升降機具，非車輛機械。', detail: '職業安全衛生設施規則第6條規定車輛機械係指能自行移動或拖曳之動力機械。', lawRef: { pcode: 'N0060009', article: '第 6 條' } },
        { keywords: ['共同責任', '安全衛生管理', '職安人員'], summary: '職業安全衛生是雇主、管理人員及勞工共同的責任。', detail: '職業安全衛生法第5條規定雇主應採取必要之預防措施。', lawRef: { pcode: 'N0010029', article: '第 5 條' } },
        { keywords: ['休息日', '例假', '7日', '二日休息'], summary: '7日內應有2日休息，其中1日例假、1日休息日。', detail: '勞動基準法第36條明定：每7日應有2日休息。', lawRef: { pcode: 'N0030025', article: '第 36 條' } },
        { keywords: ['BMI', '身體質量指數', '體重', '身高'], summary: 'BMI = 體重(kg) / 身高(m)²。身高需換算為公尺（cm÷100）。', detail: '計算步驟：① 身高cm → 公尺 ② 身高平方 ③ 體重除以平方', lawRef: { pcode: 'N0060022', article: '第 12 條' } },
        { keywords: ['墜落', '護欄', '護蓋', '安全網', '開口'], summary: '高度二公尺以上之工作場所，應設置護欄、護蓋或安全網等防護設施。', detail: '營造安全衛生設施標準第17條規定雇主應設置防護設施。', lawRef: { pcode: 'N0060014', article: '第 17 條' } },
        { keywords: ['法令位階', '憲法', '法律', '法規命令', '行政規則'], summary: '我國法令位階：憲法 → 法律 → 法規命令 → 行政規則。', detail: '憲法為國家根本大法，法律不得牴觸憲法。', lawRef: { pcode: 'A0000001', article: '第 2 條' } },
        { keywords: ['主管機關', '勞動部', '經濟部', '環境部', '內政部'], summary: '職安法→勞動部；工廠管理輔導法→經濟部；空污法→環境部；消防法→內政部。', detail: '各法規對應之主管機關如上。', lawRef: { pcode: 'N0010029', article: '第 4 條' } },
        { keywords: ['AED', '自動體外心臟電擊去顫器', '貼片', '電擊'], summary: 'AED操作步驟為：開→貼→插→電。貼片位置為右上、左下。', detail: '管理員應每2年接受複訓一次。', lawRef: null },
        { keywords: ['CPR', '心肺復甦術', '呼吸終止', '心跳停頓'], summary: 'CPR適用於呼吸終止、心跳停頓之患者。', detail: '實施步驟：叫（確認意識）→叫（求救119）→壓（胸部按壓）→開（呼吸道）→吹（人工呼吸）。', lawRef: null },
        { keywords: ['熱中暑', '熱衰竭', '熱暈厥', '熱痙攣'], summary: '熱中暑：皮膚發紅、體溫>40℃、頭墊高。熱衰竭：皮膚蒼白、體溫<40℃、腳抬高。', detail: '熱暈厥：姿勢性低血壓。熱痙攣：電解質不平衡。', lawRef: { pcode: 'N0060007', article: '第 3 條' } },
        { keywords: ['骨折', '止血', '包紮', '固定'], summary: '骨折急救順序：先止血→包紮→固定→搬運。', detail: '不可先固定再止血，應優先處理出血與休克狀況。', lawRef: null },
        { keywords: ['燒傷', '燙傷', '沖脫泡蓋送'], summary: '燒燙傷處理口訣：沖（大量冷水）→脫（去除衣物）→泡（泡冷水）→蓋（覆蓋傷口）→送（送醫）。', detail: '化學灼傷不宜再浸泡。', lawRef: null },
        { keywords: ['著火', '身體著火', '停躺滾'], summary: '身體著火時應立即：停（停止動作）→躺（躺在地上）→滾（滾動滅火）。', detail: '不可奔跑，以免助長火勢。', lawRef: null },
        { keywords: ['鈉', '金屬鈉', 'Na'], summary: '鈉的密度0.97（比水小），會與水劇烈反應產生氫氣。', detail: '2Na+2H₂O→2NaOH+H₂，保存在石油中隔絕空氣與水分。', lawRef: null },
        { keywords: ['單純性窒息', '化學性窒息', '一氧化碳', '二氧化碳'], summary: '單純性窒息物質（CO₂、N₂、CH₄）排擠氧氣；化學性窒息物質（CO、H₂S）與血紅素結合。', detail: '一氧化碳屬於化學性窒息物質。', lawRef: null },
        { keywords: ['局限空間', '缺氧', '通風換氣', '進入許可'], summary: '局限空間作業程序：置備氣體偵測器→危害確認→通風換氣→設置救援三腳架→作業中隨時測定。', detail: '應指派監視人員全程監視。', lawRef: { pcode: 'N0060020', article: '第 4 條' } },
        { keywords: ['GHS', '危害圖式', '聯合國全球調和制度'], summary: 'GHS共有9種危害圖式：爆炸、加壓氣體、易燃、健康危害、腐蝕、警告、氧化、急毒性、水環境危害。', detail: '每個圖式有特定顏色和符號。', lawRef: { pcode: 'N0060054', article: '第 3 條' } },
        { keywords: ['MPOWER', '控菸', 'WHO'], summary: 'WHO控菸政策MPOWER：M監測、P保護、O提供戒菸協助、W警示、E禁止廣告、R提高菸稅。', detail: '台灣已實施菸害防制法多年。', lawRef: null },
        { keywords: ['冰山理論', '乳酪理論', '破窗理論', '木桶理論', '5M1E'], summary: '冰山理論(1:9)、乳酪理論(漏洞巧合)、破窗理論(小惡變大禍)、木桶理論(最短木板)、5M1E(人機料法環測)。', detail: '這些都是職業安全衛生管理的重要理論基礎。', lawRef: null },
        { keywords: ['FR', 'SR', 'FSI', '失能傷害頻率', '失能傷害嚴重率'], summary: 'FR=(人次×10⁶)/工時；SR=(日數×10⁶)/工時；FSI=√(FR×SR/1000)。', detail: 'FR取小數點第2位，SR取整數。', lawRef: null },
        { keywords: ['WBGT', '綜合溫度熱指數', '高溫作業'], summary: '室內無日曬：0.7濕球+0.3黑球；戶外有日曬：0.7濕球+0.2黑球+0.1乾球。', detail: '中度工作WBGT≧31℃時應調整休息比例。', lawRef: { pcode: 'N0060007', article: '第 4 條' } },
        { keywords: ['換氣量', '有機溶劑', '第一種', '第二種', '第三種'], summary: '第一種×0.3、第二種×0.04、第三種×0.01。', detail: '取最大值作為設計換氣量。', lawRef: { pcode: 'N0060017', article: '附表四' } },
        { keywords: ['研磨輪', '周速度', 'V=πDN'], summary: '研磨輪周速度 V = π × D × N，D為直徑（公尺），N為轉速（rpm）。', detail: '直徑要換算成公尺。', lawRef: { pcode: 'N0060034', article: '第 4 條' } },
        { keywords: ['教育訓練', '時數', '在職訓練', '新僱'], summary: '新僱3小時；業務主管每2年6小時；急救人員每3年12小時；一般勞工每3年3小時。', detail: '訓練時數不得少於規定。', lawRef: { pcode: 'N0060010', article: '第 7 條' } },
        { keywords: ['中風', '腦出血', '腦梗塞'], summary: '中風原因包括：腦出血、腦梗塞、蜘蛛膜下腔出血、高血壓性腦病變。', detail: '心肌梗塞屬心臟疾病，非中風。', lawRef: null },
        { keywords: ['不法侵害', '職場暴力', '職場霸凌', '就業歧視', '性騷擾'], summary: '職場不法侵害態樣：職場暴力、職場霸凌、就業歧視、性騷擾。', detail: '雇主應訂定預防措施。', lawRef: { pcode: 'N0010029', article: '第 6 條' } },
        { keywords: ['合梯', '移動梯'], summary: '合梯角度應在75度以內；移動梯寬度應在30公分以上。', detail: '梯腳與地面之角度應在75度以內。', lawRef: { pcode: 'N0060009', article: '第 230 條' } }
    ];

    // ============================================================
    // 3. 答題秘訣規則（30+ 組口訣）
    // ============================================================

    var TIP_RULES = [
        { keywords: ['未滿18歲', '18歲'], quick: ['💡 核心口訣：18歲以下只能做低壓電，其他危險工作不能做！'], mnemonic: '🧠 【18歲以下】＝保護對象\n不能碰：起重機、坑內、鍋爐\n可以碰：220伏特以下電力線', mistake: ['🚨 陷阱：未滿18歲「可以」從事220伏特以下電力線銜接。'] },
        { keywords: ['車輛機械', '挖土機'], quick: ['💡 核心口訣：會動的、能挖的、能堆的才是車輛機械！'], mnemonic: '🧠 【車輛機械】＝「會自己移動」的動力機械', mistake: ['🚨 陷阱：吊籠和捲揚機「不是」車輛機械！'] },
        { keywords: ['共同責任', '職安人員'], quick: ['💡 核心口訣：安全衛生大家扛，不是只有一個人！'], mnemonic: '🧠 【雇主】＝出錢出力\n【管理人員】＝規劃執行\n【勞工】＝遵守規定', mistake: ['🚨 陷阱：職業安全衛生「不是」只有職安人員的責任！'] },
        { keywords: ['休息日', '例假'], quick: ['💡 核心口訣：7日2休，1例1休'], mnemonic: '🧠 你每7天要放2天假\n其中1天是「例假」\n另1天是「休息日」', mistake: ['🚨 陷阱：很多人以為A是「1」，正確答案是「2」！'] },
        { keywords: ['BMI', '身體質量指數'], quick: ['💡 核心口訣：體重 ÷ 身高的平方'], mnemonic: '🧠 【BMI】＝Body Mass Index\n步驟1：公分換公尺\n步驟2：身高平方\n步驟3：體重除以平方', mistake: ['🚨 陷阱：身高要換成「公尺」！'] },
        { keywords: ['墜落', '護欄'], quick: ['💡 核心口訣：鋼構合梯施工架，開口屋頂都危險！'], mnemonic: '🧠 【鋼構上】＝踩空\n【合梯上】＝重心不穩\n【施工架上】＝高度超過2公尺\n【開口邊緣】＝旁邊沒護欄\n【屋頂】＝斜的會滑', mistake: ['🚨 陷阱：平面道路、樓梯間、電梯口不是墜落高風險地點！'] },
        { keywords: ['法令位階', '憲法'], quick: ['💡 核心口訣：憲法最大、法律次之、命令第三、規則最小'], mnemonic: '🧠 【憲法】＝國家根本大法\n【法律】＝立法院通過\n【法規命令】＝須有法律授權\n【行政規則】＝內部使用', mistake: ['🚨 陷阱：法規命令「有」法律授權，行政規則「沒有」！'] },
        { keywords: ['主管機關', '勞動部'], quick: ['💡 核心口訣：職安找勞動、工廠找經濟、空污找環境、消防找內政'], mnemonic: '🧠 【職業安全衛生法】→勞動部\n【工廠管理輔導法】→經濟部\n【空氣污染防制法】→環境部\n【消防法】→內政部', mistake: ['🚨 陷阱：消防法的主管機關是「內政部」，不是「環境部」！'] },
        { keywords: ['AED', '貼片'], quick: ['💡 核心口訣：右上左下，開貼插電！'], mnemonic: '🧠 AED操作：開（電源）→貼（貼片右上+左下）→插（電擊插孔）→電（執行電擊）', mistake: ['🚨 陷阱：貼片位置是「右上、左下」，不要搞反！'] },
        { keywords: ['CPR', '心肺復甦術'], quick: ['💡 核心口訣：叫叫壓開吹！'], mnemonic: '🧠 CPR步驟：叫（確認意識）→叫（求救119）→壓（胸部按壓）→開（呼吸道）→吹（人工呼吸）', mistake: ['🚨 陷阱：AED貼上去後不必先移除再CPR！'] },
        { keywords: ['熱中暑', '熱衰竭'], quick: ['💡 核心口訣：中暑紅熱頭抬高，衰竭白冷腳抬高！'], mnemonic: '🧠 熱中暑：發紅、>40℃、頭墊高\n熱衰竭：蒼白、<40℃、腳抬高', mistake: ['🚨 陷阱：兩者處理方式完全相反！'] },
        { keywords: ['骨折'], quick: ['💡 核心口訣：先止血，再固定！'], mnemonic: '🧠 骨折急救：止血→包紮→固定→搬運', mistake: ['🚨 陷阱：很多人以為先固定再止血！'] },
        { keywords: ['燒傷', '燙傷'], quick: ['💡 核心口訣：沖脫泡蓋送！'], mnemonic: '🧠 燒燙傷急救：沖（冷水）→脫（衣物）→泡（冷水）→蓋（覆蓋）→送（送醫）', mistake: ['🚨 陷阱：化學灼傷不宜再浸泡！'] },
        { keywords: ['著火', '身體著火'], quick: ['💡 核心口訣：停躺滾！'], mnemonic: '🧠 著火自救：停（停止）→躺（躺下）→滾（滾動滅火）', mistake: ['🚨 陷阱：不可以奔跑！'] },
        { keywords: ['鈉', '金屬鈉', 'Na'], quick: ['💡 核心口訣：鈉0.97，石油保平安！'], mnemonic: '🧠 鈉密度0.97（比水小）→與水劇烈反應→保存在石油中', mistake: ['🚨 陷阱：鈉是保存在「石油」中，不是「水」中！'] },
        { keywords: ['一氧化碳', '二氧化碳'], quick: ['💡 核心口訣：單純窒息看CO₂，化學窒息看CO！'], mnemonic: '🧠 單純性窒息：CO₂、N₂、CH₄\n化學性窒息：CO、H₂S', mistake: ['🚨 陷阱：一氧化碳「不是」單純性窒息物質！'] },
        { keywords: ['局限空間', '缺氧', '氣體偵測'], quick: ['💡 核心口訣：測→認→通→架→測！'], mnemonic: '🧠 局限空間作業：置備氣體偵測器→危害確認→通風換氣→救援三腳架→作業中隨時測定', mistake: ['🚨 陷阱：通風換氣必須在確認危害「之後」才做！'] },
        { keywords: ['GHS', '危害圖式'], quick: ['💡 核心口訣：GHS九大圖式要全部記住！'], mnemonic: '🧠 GHS 9大圖式：爆炸、加壓氣體、易燃、健康危害、腐蝕、警告、氧化、急毒性、水環境', mistake: ['🚨 陷阱：警告（！）是干擾選項，但確實是GHS圖式之一！'] },
        { keywords: ['MPOWER', '控菸'], quick: ['💡 核心口訣：MPOWER＝監護助警禁稅！'], mnemonic: '🧠 M=監測、P=保護、O=提供戒菸協助、W=警示、E=禁止廣告、R=提高菸稅', mistake: ['🚨 陷阱：M是Monitor不是Manage！'] },
        { keywords: ['冰山理論'], quick: ['💡 核心口訣：冰山露出1/9，藏了8/9！'], mnemonic: '🧠 冰山理論：露出1/9，海面下8/9', mistake: ['🚨 陷阱：冰山理論是1:9，不是1:10！'] },
        { keywords: ['乳酪理論'], quick: ['💡 核心口訣：洞洞剛好排成線！'], mnemonic: '🧠 乳酪理論：多重防護漏洞同時穿過', mistake: ['🚨 陷阱：乳酪理論不是單一失誤！'] },
        { keywords: ['破窗理論'], quick: ['💡 核心口訣：黑點不修變全黑！'], mnemonic: '🧠 破窗理論：小問題不處理會擴大惡化', mistake: ['🚨 陷阱：與小花理論是相反概念！'] },
        { keywords: ['木桶理論'], quick: ['💡 核心口訣：最短木板決定水量！'], mnemonic: '🧠 木桶理論：團隊表現取決於最弱的一環', mistake: ['🚨 陷阱：木桶看「最短」的那塊！'] },
        { keywords: ['5M1E'], quick: ['💡 核心口訣：人機料法環測！'], mnemonic: '🧠 5M1E：人員、設備、材料、方法、環境、測量', mistake: ['🚨 陷阱：缺了「測量」就不完整！'] },
        { keywords: ['合梯'], quick: ['💡 核心口訣：合梯75度最安全！'], mnemonic: '🧠 合梯角度＝75度。太陡會倒，太平會滑。', mistake: ['🚨 陷阱：移動梯寬度30公分，合梯角度75度，不要搞混！'] },
        { keywords: ['移動梯'], quick: ['💡 核心口訣：移動梯寬度30公分！'], mnemonic: '🧠 移動梯寬度至少30公分。', mistake: ['🚨 陷阱：移動梯是30公分，合梯是75度！'] },
        { keywords: ['FR', 'SR', 'FSI'], quick: ['💡 核心口訣：FR看人次，SR看日數，FSI開根號！'], mnemonic: '🧠 FR=(人次×10⁶)/工時；SR=(日數×10⁶)/工時；FSI=√(FR×SR/1000)', mistake: ['🚨 陷阱：FR取小數點第2位，SR取整數！'] },
        { keywords: ['WBGT', '綜合溫度熱指數'], quick: ['💡 核心口訣：室內濕黑，室外濕黑乾！'], mnemonic: '🧠 室內：0.7濕球+0.3黑球\n戶外：0.7濕球+0.2黑球+0.1乾球', mistake: ['🚨 陷阱：戶外有日曬三項都要算！'] },
        { keywords: ['有機溶劑', '換氣量'], quick: ['💡 核心口訣：第一0.3、第二0.04、第三0.01！'], mnemonic: '🧠 第一種×0.3、第二種×0.04、第三種×0.01', mistake: ['🚨 陷阱：係數不要搞混！'] },
        { keywords: ['研磨輪', '周速度'], quick: ['💡 核心口訣：V=πDN，公釐換公尺！'], mnemonic: '🧠 V=π×D(公尺)×N(rpm)，直徑要換成公尺', mistake: ['🚨 陷阱：直徑單位要換算成「公尺」！'] }
    ];

    // ============================================================
    // 4. 邏輯標籤規則（6 種）
    // ============================================================

    var LOGIC_RULES = [
        { keywords: ['18歲', '年齡', '人數', '天數', '距離', '高度', '深度', '溫度', '濃度', '時數', '公斤', '公尺', '公分', '小時', '百分比', 'ppm'], label: '法規數字', reason: '測驗考生對法規中關鍵數字之記憶。' },
        { keywords: ['法規', '規定', '條文', '罰則', '處罰', '定義', '分類'], label: '法規記憶', reason: '測驗考生對法規條文內容之記憶。' },
        { keywords: ['立法精神', '目的', '意旨', '原則', '立法意旨'], label: '法規理解', reason: '測驗考生對法規立法精神與原則之理解。' },
        { keywords: ['危害', '風險', '物質', '化學品', 'GHS', '圖式', '辨識', '分類'], label: '危害辨識', reason: '測驗考生對危害類型與分類之辨識能力。' },
        { keywords: ['計算', '公式', 'BMI', 'WBGT', '換氣量', 'FR', 'SR', 'FSI', 'TWA', 'STEL'], label: '計算應用', reason: '測驗考生對計算公式之掌握與應用能力。' },
        { keywords: ['程序', '流程', '步驟', '順序', '作業步驟', '方法', '作業程序'], label: '流程操作', reason: '測驗考生對作業流程或順序之掌握。' }
    ];

    // ============================================================
    // 5. 題型規格模板（8 種）
    // ============================================================

    var TYPE_SPEC = {
        'single': {
            layout: '題幹區（中央） → 選項區（下方）',
            structure: ['題幹區', '選項區'],
            optionUI: '○ (A)(B)(C)(D) 圓形單選鈕',
            action: '點選',
            draggable: false,
            scoring: '單題計分',
            hasNumberPad: false,
            hasCalculator: false,
            steps: ['閱讀題幹區的題目', '閱讀 (A)(B)(C)(D) 四個選項', '以滑鼠左鍵點選認為正確的選項']
        },
        'multiple': {
            layout: '題幹區（中央） → 選項區（下方）',
            structure: ['題幹區', '選項區'],
            optionUI: '☑ (A)(B)(C)(D) 方形勾選框（全對才給分）',
            action: '勾選',
            draggable: false,
            scoring: '全對才給分',
            hasNumberPad: false,
            hasCalculator: false,
            steps: ['閱讀題幹區的題目', '閱讀所有選項', '逐一點選所有認為正確的選項']
        },
        'truefalse': {
            layout: '題幹區（中央） → 選項區（下方）',
            structure: ['題幹區', '選項區'],
            optionUI: '○ 是 ○ 否',
            action: '點選',
            draggable: false,
            scoring: '單題計分',
            hasNumberPad: false,
            hasCalculator: false,
            steps: ['閱讀題幹區的敘述', '判斷敘述是否正確', '點選「是」或「否」']
        },
        'fill': {
            layout: '題幹區（上方，內嵌空白欄位） → 作答區（數字鍵盤）',
            structure: ['題幹區', '作答區'],
            optionUI: '(A) ______ (3.3%)',
            action: '數字鍵盤輸入',
            draggable: false,
            scoring: '各欄位獨立計分',
            hasNumberPad: true,
            hasCalculator: false,
            steps: ['閱讀題幹區的題目', '點選空白欄位', '使用數字鍵盤輸入答案']
        },
        'calc': {
            layout: '題幹區 → 計算機區 → 答案欄位',
            structure: ['題幹區', '計算機區', '答案欄位'],
            optionUI: '______ (10%) + 計算機按鈕',
            action: '計算 + 輸入',
            draggable: false,
            scoring: '輸入正確答案即給分',
            hasNumberPad: true,
            hasCalculator: true,
            steps: ['閱讀題幹區的題目', '使用計算機運算', '輸入最終答案']
        },
        'match': {
            layout: '上層：題幹區 → 中層：作答區 → 下層：選項區（卡片）',
            structure: ['題幹區', '作答區', '選項區'],
            optionUI: '卡片形式（含干擾選項）',
            action: '拖曳',
            draggable: true,
            scoring: '各配對獨立計分',
            hasNumberPad: false,
            hasCalculator: false,
            hasMiddleZone: true,
            hasAnswerZone: true,
            distractors: '2~4 個干擾選項',
            steps: ['閱讀上層題幹區的題目', '瀏覽下層選項區的卡片', '拖曳至中層作答區']
        },
        'sequencing': {
            layout: '上層：題幹區 → 中層：作答區 → 下層：選項區（卡片）',
            structure: ['題幹區', '作答區', '選項區'],
            optionUI: '卡片形式（含干擾選項）',
            action: '拖曳',
            draggable: true,
            scoring: '全對才給分',
            hasNumberPad: false,
            hasCalculator: false,
            hasMiddleZone: true,
            hasAnswerZone: true,
            distractors: '1~2 個干擾選項',
            steps: ['閱讀上層題幹區的題目', '瀏覽下層選項區的卡片', '拖曳至中層作答區排列']
        },
        'link': {
            layout: '左欄：題幹項目 → 右欄：答案項目',
            structure: ['左欄（題幹）', '右欄（答案）'],
            optionUI: '點選連線',
            action: '點選左欄 → 點選右欄配對',
            draggable: false,
            scoring: '所有連線完全正確才給分',
            hasNumberPad: false,
            hasCalculator: false,
            steps: ['閱讀左欄與右欄的所有項目', '點選左欄項目', '點選右欄對應答案']
        }
    };

    // ============================================================
    // 6. 答案格式化（8 種題型）
    // ============================================================

    function formatAnswer(question) {
        if (!question) return '無答案';
        
        var type = question.type || 'single';
        var answer = question.answer;
        var options = question.options || [];
        var labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        var leftItems = question.leftItems || [];

        try {
            switch (type) {
                case 'single':
                    if (typeof answer === 'number' && options[answer] !== undefined) {
                        return labels[answer] + '. ' + options[answer];
                    }
                    return String(answer);

                case 'multiple':
                    if (Array.isArray(answer)) {
                        var result = [];
                        answer.forEach(function(idx) {
                            var i = parseInt(idx);
                            if (!isNaN(i) && options[i] !== undefined) {
                                result.push(labels[i] + '. ' + options[i]);
                            }
                        });
                        return result.join('、');
                    }
                    return String(answer);

                case 'truefalse':
                    var isTrue = answer === 0 || answer === true || answer === '是' || answer === '0';
                    return isTrue ? '是（正確）' : '否（錯誤）';

                case 'fill':
                    if (Array.isArray(answer)) {
                        var fillLabels = ['(A)', '(B)', '(C)', '(D)', '(E)', '(F)', '(G)', '(H)'];
                        var result = [];
                        answer.forEach(function(item, idx) {
                            result.push((fillLabels[idx] || '第' + (idx + 1) + '格') + ' → ' + item);
                        });
                        return result.join('，');
                    }
                    return String(answer);

                case 'calc':
                    if (Array.isArray(answer)) {
                        return answer.join('、');
                    }
                    return String(answer);

                case 'match':
                    if (Array.isArray(answer) && leftItems && leftItems.length > 0) {
                        var pairs = [];
                        for (var i = 0; i < Math.min(leftItems.length, answer.length); i++) {
                            pairs.push(leftItems[i] + ' → ' + answer[i]);
                        }
                        return pairs.join('，');
                    }
                    return String(answer);

                case 'sequencing':
                    if (Array.isArray(answer)) {
                        return answer.join(' → ');
                    }
                    return String(answer);

                case 'link':
                    if (Array.isArray(answer)) {
                        return answer.join('、');
                    }
                    return String(answer);

                default:
                    return String(answer);
            }
        } catch (e) {
            console.warn('⚠️ 答案格式化失敗:', e);
            return String(answer);
        }
    }

    // ============================================================
    // 7. 生成解析摘要
    // ============================================================

    function generateExplanation(question) {
        if (!question) return null;
        if (question.explanation && Object.keys(question.explanation).length > 0) {
            return question.explanation;
        }

        var text = question.text || '';
        var type = question.type || 'single';
        var result = { summary: '', detail: '', lawRef: null };

        var matchedRule = null;
        for (var i = 0; i < EXPLANATION_RULES.length; i++) {
            var rule = EXPLANATION_RULES[i];
            var matchCount = 0;
            for (var j = 0; j < rule.keywords.length; j++) {
                if (text.indexOf(rule.keywords[j]) !== -1) {
                    matchCount++;
                }
            }
            if (matchCount > 0 && matchCount > (matchedRule ? matchedRule.keywords.length : 0)) {
                matchedRule = rule;
            }
        }

        if (matchedRule) {
            result.summary = matchedRule.summary;
            result.detail = matchedRule.detail;
            result.lawRef = matchedRule.lawRef;
        }

        if (question.law && question.law.pcode) {
            var lawData = queryLaw(question.law.pcode);
            if (lawData) {
                result.lawRef = {
                    name: lawData.name || lawData.display_name,
                    pcode: question.law.pcode,
                    article: question.law.article ? question.law.article.條 : ''
                };
                if (!result.summary) {
                    result.summary = '依據「' + lawData.name + '」規定。';
                }
            }
        }

        if (!result.summary) {
            var typeSummary = {
                'single': '本題為單選題，請從四個選項中選出最正確的答案。',
                'multiple': '本題為複選題，請選出所有正確的選項。',
                'truefalse': '本題為是非題，請判斷敘述是否正確。',
                'fill': '本題為填空題，請填入正確的關鍵數字或詞語。',
                'calc': '本題為計算題，請依據公式計算出正確答案。',
                'match': '本題為配合題，請將左欄與右欄正確配對。',
                'sequencing': '本題為排序題，請排出正確的順序。',
                'link': '本題為連連看，請將左欄與右欄正確配對。'
            };
            result.summary = typeSummary[type] || '請依據相關法規與專業知識作答。';
            result.detail = result.summary;
        }

        return result;
    }

    // ============================================================
    // 8. 生成答題秘訣
    // ============================================================

    function generateTips(question) {
        if (!question) return null;
        if (question.tips && Object.keys(question.tips).length > 0) {
            return question.tips;
        }

        var text = question.text || '';
        var type = question.type || 'single';
        var result = { quick: [], mnemonic: '', commonMistake: [] };

        var matchedRule = null;
        for (var i = 0; i < TIP_RULES.length; i++) {
            var rule = TIP_RULES[i];
            var matchCount = 0;
            for (var j = 0; j < rule.keywords.length; j++) {
                if (text.indexOf(rule.keywords[j]) !== -1) {
                    matchCount++;
                }
            }
            if (matchCount > 0 && matchCount > (matchedRule ? matchedRule.keywords.length : 0)) {
                matchedRule = rule;
            }
        }

        if (matchedRule) {
            result.quick = matchedRule.quick;
            result.mnemonic = matchedRule.mnemonic;
            result.commonMistake = matchedRule.mistake;
        }

        if (result.quick.length === 0) {
            var typeTip = {
                'single': { quick: ['💡 單選題技巧：先刪除明顯錯誤之選項，再從剩餘選項中選出最正確者。'], mnemonic: '🧠 單選題要學會分辨「正確」與「最正確」之差異。', mistake: ['🚨 陷阱：其他選項可能是常見之錯誤觀念。'] },
                'multiple': { quick: ['💡 複選題技巧：使用排除法，先刪除確定錯誤之選項。'], mnemonic: '🧠 複選題須全部選對才給分。', mistake: ['🚨 陷阱：部分正確不等於全部正確。'] },
                'truefalse': { quick: ['💡 是非題技巧：題幹中只要有一處不符合法規，即為「否」。'], mnemonic: '🧠 是非題考驗對法規之精確理解。', mistake: ['🚨 陷阱：似是而非之敘述最容易誤導。'] },
                'fill': { quick: ['💡 填空題技巧：填入最精確之關鍵數字或詞語。'], mnemonic: '🧠 填空題通常考驗法條中之關鍵數字。', mistake: ['🚨 陷阱：填錯一個字即不得分。'] },
                'calc': { quick: ['💡 計算題技巧：先寫公式，再代入數值，最後確認單位。'], mnemonic: '🧠 公式寫對就拿到一半分數。', mistake: ['🚨 陷阱：單位換算錯誤是最常見之失分原因。'] },
                'match': { quick: ['💡 配合題技巧：先確認左欄順序，再逐一找出對應之右欄答案。'], mnemonic: '🧠 配合題須建立「左欄→右欄」之正確對應關係。', mistake: ['🚨 陷阱：干擾選項常與正確答案相似。'] },
                'sequencing': { quick: ['💡 排序題技巧：先找出第一步與最後一步，再排列中間順序。'], mnemonic: '🧠 排序題考驗對流程或順序之掌握。', mistake: ['🚨 陷阱：順序錯誤即全錯。'] },
                'link': { quick: ['💡 連連看技巧：先確認左欄順序，再逐一配對。'], mnemonic: '🧠 連連看考驗對配對關係之掌握。', mistake: ['🚨 陷阱：配對錯誤即不得分。'] }
            };
            var tip = typeTip[type] || { quick: ['💡 請仔細閱讀題幹後作答。'], mnemonic: '🧠 理解題目背後之邏輯。', mistake: ['🚨 注意：細節決定成敗。'] };
            result.quick = tip.quick;
            result.mnemonic = tip.mnemonic;
            result.commonMistake = tip.mistake;
        }

        return result;
    }

    // ============================================================
    // 9. 生成邏輯標籤
    // ============================================================

    function generateLogic(question) {
        if (!question) return null;
        if (question.logic && question.logic.length > 0) {
            return question.logic;
        }

        var text = question.text || '';
        var type = question.type || 'single';
        var result = [];

        var matchedRule = null;
        for (var i = 0; i < LOGIC_RULES.length; i++) {
            var rule = LOGIC_RULES[i];
            var matchCount = 0;
            for (var j = 0; j < rule.keywords.length; j++) {
                if (text.indexOf(rule.keywords[j]) !== -1) {
                    matchCount++;
                }
            }
            if (matchCount > 0 && matchCount > (matchedRule ? matchedRule.keywords.length : 0)) {
                matchedRule = rule;
            }
        }

        if (matchedRule) {
            result.push({ label: matchedRule.label, reason: matchedRule.reason });
        } else {
            var typeLogic = {
                'single': { label: '法規記憶', reason: '測驗考生對相關法規之記憶與理解。' },
                'multiple': { label: '法規記憶', reason: '測驗考生對相關法規之記憶與辨識能力。' },
                'truefalse': { label: '法規理解', reason: '測驗考生對法規規定之精確理解。' },
                'fill': { label: '法規數字', reason: '測驗考生對法規中關鍵數字之記憶。' },
                'calc': { label: '計算應用', reason: '測驗考生對公式之應用與計算能力。' },
                'match': { label: '危害辨識', reason: '測驗考生對危害類型之辨識與配對能力。' },
                'sequencing': { label: '流程操作', reason: '測驗考生對作業流程或順序之掌握。' },
                'link': { label: '危害辨識', reason: '測驗考生對配對關係之辨識能力。' }
            };
            var logic = typeLogic[type] || { label: '法規記憶', reason: '測驗考生對相關知識之記憶能力。' };
            result.push(logic);
        }

        return result;
    }

    // ============================================================
    // 10. 生成法規內容 HTML
    // ============================================================

    function generateLawContent(question) {
        if (!question) return '';
        
        var law = question.law || {};
        var lawName = law.name || '';
        var article = '';
        var pcode = law.pcode || '';
        
        if (law.article) {
            article = law.article.full || law.article.條 || '';
        }
        
        if (lawName || article || pcode) {
            var html = '<div class="law-content" style="padding:8px 14px;background:#e3f2fd;border-radius:6px;border-left:4px solid #0d47a1;margin-bottom:6px;">';
            html += '<strong>⚖️ 法源依據</strong><br>';
            if (lawName) html += '<span style="font-weight:500;">' + lawName + '</span>';
            if (article) html += ' <span style="color:#0d47a1;font-weight:500;">' + article + '</span>';
            if (pcode && !lawName) html += '<span style="color:#666;font-size:13px;"> (pcode: ' + pcode + ')</span>';
            html += '</div>';
            return html;
        }
        return '';
    }

    // ============================================================
    // 11. 獲取題型規格
    // ============================================================

    function getTypeSpec(type) {
        return TYPE_SPEC[type] || TYPE_SPEC.single;
    }

    // ============================================================
    // 12. 生成完整解析
    // ============================================================

    function generateFullExplanation(question) {
        if (!question) return null;

        return {
            law: queryLaw(question.law ? question.law.pcode : null),
            explanation: generateExplanation(question),
            tips: generateTips(question),
            logic: generateLogic(question),
            spec: getTypeSpec(question.type || 'single'),
            formattedAnswer: formatAnswer(question)
        };
    }

    // ============================================================
    // 13. 匯出到全域
    // ============================================================

    var ExplanationEngine = {
        loadLawDatabase: loadLawDatabase,
        queryLaw: queryLaw,
        generateExplanation: generateExplanation,
        generateTips: generateTips,
        generateLogic: generateLogic,
        getTypeSpec: getTypeSpec,
        generateLawContent: generateLawContent,
        generateFullExplanation: generateFullExplanation,
        formatAnswer: formatAnswer,
        EXPLANATION_RULES: EXPLANATION_RULES,
        TIP_RULES: TIP_RULES,
        LOGIC_RULES: LOGIC_RULES,
        TYPE_SPEC: TYPE_SPEC,
        lawCache: lawCache,
        isLawLoaded: isLawLoaded,
        init: function() {
            var self = this;
            return this.loadLawDatabase().then(function() {
                var cacheSize = Object.keys(lawCache).length;
                console.log('✅ 智慧化解析引擎初始化完成');
                console.log('   📚 法規資料庫索引：' + cacheSize + ' 筆');
                console.log('   📋 解析規則：' + EXPLANATION_RULES.length + ' 組');
                console.log('   💡 答題秘訣：' + TIP_RULES.length + ' 組');
                console.log('   🏷️ 邏輯標籤：' + LOGIC_RULES.length + ' 種');
                console.log('   📐 題型規格：' + Object.keys(TYPE_SPEC).length + ' 種');
                return self;
            });
        }
    };

    if (typeof window !== 'undefined') {
        window.ExplanationEngine = ExplanationEngine;
        window.loadLawDatabase = loadLawDatabase;
        window.queryLaw = queryLaw;
        window.generateExplanation = generateExplanation;
        window.generateTips = generateTips;
        window.generateLogic = generateLogic;
        window.getTypeSpec = getTypeSpec;
        window.generateLawContent = generateLawContent;
        window.generateFullExplanation = generateFullExplanation;
        window.formatAnswer = formatAnswer;

        if (document.readyState === 'complete') {
            ExplanationEngine.init();
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                ExplanationEngine.init();
            });
        }
    }

    console.log('✅ 14_解析_主引擎 v10.2.0（完整強化版 - API 模式）已載入');
    console.log('   📚 支援 25 部法規（從 API 載入）');
    console.log('   🧠 支援 ' + EXPLANATION_RULES.length + ' 組解析規則');
    console.log('   💡 支援 ' + TIP_RULES.length + ' 組答題口訣');
    console.log('   🏷️ 支援 ' + LOGIC_RULES.length + ' 種邏輯標籤');
    console.log('   📐 支援 ' + Object.keys(TYPE_SPEC).length + ' 種題型規格');

})();