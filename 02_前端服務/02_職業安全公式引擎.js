/**
 * ============================================
 * 乙級職安衛模擬測驗系統 - 公式引擎 10.4.0
 * 擴充版：支援 14 大項計算公式
 * 更新日期：2026-06-21
 * ============================================
 */

class FormulaEngine {
    constructor() {
        this.version = "10.4.0";
        this.supportedTypes = ["calc"];
        
        this.formulas = {
            "混合氣體爆炸下限": function(params) {
                const { values, lels } = params;
                if (!values || !lels || values.length !== lels.length) {
                    throw new Error("請提供體積百分比陣列(values)和LEL陣列(lels)");
                }
                let sum = 0;
                for (let i = 0; i < values.length; i++) {
                    sum += values[i] / lels[i];
                }
                return 100 / sum;
            },
            "火災爆炸危險度": function(params) {
                const { uel, lel } = params;
                if (uel === undefined || lel === undefined) {
                    throw new Error("請提供 UEL 和 LEL");
                }
                if (lel === 0) { throw new Error("LEL 不可為0"); }
                return (uel - lel) / lel;
            },
            "限制氧氣濃度": function(params) {
                const { lel, oxygenMoles } = params;
                if (lel === undefined || oxygenMoles === undefined) {
                    throw new Error("請提供 LEL 和理論氧莫耳數");
                }
                return lel * oxygenMoles;
            },
            "防爆最小通風量": function(params) {
                const { W, K, M, LEL } = params;
                if ([W, K, M, LEL].some(v => v === undefined)) {
                    throw new Error("請提供 W, K, M, LEL");
                }
                if (M === 0 || LEL === 0) { throw new Error("M 和 LEL 不可為0"); }
                return (24.45 * 1000 * W * K) / (60 * M * LEL);
            },
            "水蒸氣膨脹倍數": function(params) {
                const { temperature, pressure } = params;
                if (temperature === undefined || pressure === undefined) {
                    throw new Error("請提供溫度(℃)和壓力(atm)");
                }
                const T_abs = 273.15 + temperature;
                return (0.082 * T_abs / pressure) * 1000 / 18;
            },
            "風量計算": function(params) {
                const { area, velocity } = params;
                if (area === undefined || velocity === undefined) {
                    throw new Error("請提供面積(area)和風速(velocity)");
                }
                return area * velocity;
            },
            "風速計算": function(params) {
                const { flow, area } = params;
                if (flow === undefined || area === undefined) {
                    throw new Error("請提供風量(flow)和面積(area)");
                }
                if (area === 0) { throw new Error("面積不可為0"); }
                return flow / area;
            },
            "壓力損失": function(params) {
                const { xi, rho, velocity } = params;
                if ([xi, rho, velocity].some(v => v === undefined)) {
                    throw new Error("請提供 xi, rho, velocity");
                }
                return xi * (rho * velocity * velocity / 2);
            },
            "防護係數": function(params) {
                const { C_out, C_in } = params;
                if (C_out === undefined || C_in === undefined) {
                    throw new Error("請提供環境濃度(C_out)和面體內濃度(C_in)");
                }
                if (C_in === 0) { throw new Error("面體內濃度不可為0"); }
                return C_out / C_in;
            },
            "所需防護係數": function(params) {
                const { C_out, PEL } = params;
                if (C_out === undefined || PEL === undefined) {
                    throw new Error("請提供環境濃度(C_out)和容許濃度(PEL)");
                }
                if (PEL === 0) { throw new Error("PEL 不可為0"); }
                return C_out / PEL;
            },
            "洩漏率": function(params) {
                const { C_in, C_out } = params;
                if (C_in === undefined || C_out === undefined) {
                    throw new Error("請提供面體內濃度(C_in)和環境濃度(C_out)");
                }
                if (C_out === 0) { throw new Error("環境濃度不可為0"); }
                return (C_in / C_out) * 100;
            },
            "TWA": function(params) {
                const { concentrations, times } = params;
                if (!concentrations || !times || !Array.isArray(concentrations) || !Array.isArray(times)) {
                    throw new Error("請提供濃度陣列(concentrations)和時間陣列(times)");
                }
                if (concentrations.length !== times.length) {
                    throw new Error("濃度陣列和時間陣列長度不一致");
                }
                let sum = 0;
                for (let i = 0; i < concentrations.length; i++) {
                    sum += concentrations[i] * times[i];
                }
                const totalTime = times.reduce((a, b) => a + b, 0);
                if (totalTime === 0) { throw new Error("總時間不可為0"); }
                return sum / totalTime;
            },
            "濃度單位換算": function(params) {
                const { ppm, molecularWeight, molarVolume } = params;
                if (ppm === undefined || molecularWeight === undefined) {
                    throw new Error("請提供 ppm 和分子量");
                }
                const mv = molarVolume || 24.45;
                return (ppm * molecularWeight) / mv;
            },
            "混合暴露評估": function(params) {
                const { concentrations, PELs } = params;
                if (!concentrations || !PELs || !Array.isArray(concentrations) || !Array.isArray(PELs)) {
                    throw new Error("請提供濃度陣列(concentrations)和PEL陣列(PELs)");
                }
                if (concentrations.length !== PELs.length) {
                    throw new Error("濃度陣列和PEL陣列長度不一致");
                }
                let sum = 0;
                for (let i = 0; i < concentrations.length; i++) {
                    if (PELs[i] === 0) { throw new Error("PEL 不可為0"); }
                    sum += concentrations[i] / PELs[i];
                }
                return sum;
            }
        };
    }

    calculate(formulaKey, params) {
        try {
            if (!this.formulas[formulaKey]) {
                throw new Error(`未知公式: ${formulaKey}`);
            }
            const result = this.formulas[formulaKey](params);
            return this.round(result, 2);
        } catch (error) {
            console.error(`公式計算錯誤 [${formulaKey}]:`, error.message);
            return null;
        }
    }

    validateAnswer(userAnswer, correctAnswer, tolerance = 0.01) {
        if (userAnswer === null || userAnswer === undefined) return false;
        const numUser = parseFloat(userAnswer);
        const numCorrect = parseFloat(correctAnswer);
        if (isNaN(numUser) || isNaN(numCorrect)) return false;
        return Math.abs(numUser - numCorrect) <= tolerance;
    }

    round(value, decimals = 2) {
        return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
    }

    getFormulaList() {
        return Object.keys(this.formulas);
    }
}

const formulaEngine = new FormulaEngine();
if (typeof window !== 'undefined') {
    window.formulaEngine = formulaEngine;
}
console.log('✅ 公式引擎 10.4.0 已載入 (' + formulaEngine.getFormulaList().length + ' 種公式)');

