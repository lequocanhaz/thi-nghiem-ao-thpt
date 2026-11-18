import {CONSTANTS} from './thermal-physics.js?v=89';

const CW = CONSTANTS.waterSpecificHeatJPerKgK;
const energyLabels = {
  originalWaterJ: ['Nước ban đầu', 'Original water'],
  calorimeterJ: ['Nhiệt lượng kế', 'Calorimeter'],
  fusionJ: ['Nóng chảy đá', 'Melting the ice'],
  meltwaterJ: ['Làm ấm nước đá tan', 'Warming the meltwater'],
  solidJ: ['Mẫu vật rắn', 'Solid sample']
};
const fieldLabels = {
  mw: ['Khối lượng nước ban đầu (kg)', 'Initial water mass (kg)'],
  mi: ['Khối lượng đá đã thêm (kg)', 'Added ice mass (kg)'],
  ms: ['Khối lượng vật rắn (kg)', 'Solid mass (kg)'],
  ccal: ['Nhiệt dung bình (J/K)', 'Calorimeter heat capacity (J/K)'],
  tw: ['Nhiệt độ nước ban đầu (°C)', 'Initial water temperature (°C)'],
  ts: ['Nhiệt độ vật rắn ban đầu (°C)', 'Initial solid temperature (°C)'],
  tf: ['Nhiệt độ cân bằng (°C)', 'Equilibrium temperature (°C)']
};
const iceFields = ['mw', 'mi', 'ccal', 'tw', 'tf'];
const solidFields = ['mw', 'ms', 'ccal', 'tw', 'ts', 'tf'];
const english = locale => /^en(?:-|$)/i.test(locale ?? '');
const languageIndex = locale => english(locale) ? 1 : 0;
const fieldIds = activity => activity === 'ice' ? iceFields : solidFields;

const calculationMessages = {
  'missing-readings': ['Điền đủ số đo.', 'Enter all readings.'],
  'invalid-readings': ['Kiểm tra khối lượng dương, nhiệt dung bình không âm và nhiệt độ hợp lệ.', 'Check that masses are positive, calorimeter heat capacity is nonnegative and temperatures are valid.'],
  'temperature-domain': ['Công thức giả thiết nước ở thể lỏng từ 0 đến 100 °C. Nhiệt độ vật rắn phải từ −273,15 °C trở lên.', 'The formula assumes liquid water from 0 to 100 °C. The solid temperature must be at least −273.15 °C.'],
  'all-ice-melted': ['Áp dụng phép tính khi toàn bộ đá đã tan. Kiểm tra mẫu và xác nhận trước khi tính.', 'Use this calculation when all the ice has melted. Check the sample and confirm before calculating.'],
  'ice-temperature-order': ['Nhiệt độ cân bằng phải lớn hơn 0 °C và thấp hơn nhiệt độ nước ban đầu.', 'The equilibrium temperature must be above 0 °C and below the initial water temperature.'],
  'solid-temperature-order': ['Nhiệt độ cân bằng phải nằm giữa hai nhiệt độ ban đầu.', 'The equilibrium temperature must lie between the two initial temperatures.'],
  'inconsistent-heat': ['Nhiệt lượng nước và bình tỏa ra chưa đủ cho kết quả nóng chảy dương. Kiểm tra số đo, đơn vị và điều kiện thí nghiệm.', 'Heat released by the water and vessel gives no positive heat of fusion. Check the readings, units and experimental conditions.'],
  'numeric-domain': ['Kết quả vượt miền tính toán. Kiểm tra số đo và đơn vị.', 'Result outside the numerical domain. Check your readings and units.'],
  'saved-result-inconsistent': ['Kết quả đã lưu chưa thể đối chiếu với số đo. Kiểm tra các giá trị rồi tính lại.', 'The saved result could not be matched to its readings. Check the values and calculate again.']
};

export function thermalCalculationMessage(code, locale) {
  const message = Object.hasOwn(calculationMessages, code) ? calculationMessages[code] : calculationMessages['numeric-domain'];
  return message[languageIndex(locale)];
}

function reject(code) {
  const error = new RangeError(code);
  error.code = code;
  throw error;
}

/** Estimate a property using learner-supplied measurements and the stated heat balance. */
export function calculateThermalProperty(activity, values) {
  if (activity !== 'ice' && activity !== 'solid') reject('invalid-readings');
  if (!values || typeof values !== 'object' || Array.isArray(values)) reject('missing-readings');
  const fields = fieldIds(activity);
  if (fields.some(field => !Object.hasOwn(values, field) || values[field] == null || values[field] === '')) reject('missing-readings');
  const inputs = Object.fromEntries(fields.map(field => [field, values[field]]));
  const sampleMass = activity === 'ice' ? inputs.mi : inputs.ms;
  const {mw, ccal, tf, tw, ts} = inputs;
  if (!Object.values(inputs).every(Number.isFinite) || mw <= 0 || sampleMass <= 0 || ccal < 0) reject('invalid-readings');
  if (tw < 0 || tw > 100 || tf < 0 || tf > 100 || (activity === 'solid' && ts < -273.15)) reject('temperature-domain');

  const waterHeatCapacity = mw * CW;
  const waterDifference = tf - tw;
  const combinedHeatJ = (waterHeatCapacity + ccal) * waterDifference;
  const energy = {
    originalWaterJ: waterHeatCapacity * waterDifference,
    calorimeterJ: ccal * waterDifference
  };

  if (activity === 'ice') {
    if (values.allMelted !== true) reject('all-ice-melted');
    if (!(tf > 0 && tf < tw)) reject('ice-temperature-order');
    energy.meltwaterJ = sampleMass * CW * tf;
    energy.fusionJ = -combinedHeatJ - energy.meltwaterJ;
    if (![combinedHeatJ, ...Object.values(energy)].every(Number.isFinite)) reject('numeric-domain');
    if (!(energy.fusionJ > 0)) reject('inconsistent-heat');
    const latentHeatJPerKg = energy.fusionJ / sampleMass;
    if (!Number.isFinite(latentHeatJPerKg) || latentHeatJPerKg <= 0) reject('numeric-domain');
    return {calculation: {...inputs, allMelted: true, latentHeatJPerKg}, energyTerms: energy};
  }

  if (!(tf > Math.min(tw, ts) && tf < Math.max(tw, ts))) reject('solid-temperature-order');
  const denominator = sampleMass * (ts - tf);
  const specificHeatJPerKgK = combinedHeatJ / denominator;
  energy.solidJ = -combinedHeatJ;
  if (![denominator, specificHeatJPerKgK, ...Object.values(energy)].every(Number.isFinite) || specificHeatJPerKgK <= 0) reject('numeric-domain');
  return {calculation: {...inputs, specificHeatJPerKgK}, energyTerms: energy};
}

export function renderThermalCalculation(activity, locale) {
  const isIce = activity === 'ice';
  const en = english(locale);
  const copy = (vi, englishText) => en ? englishText : vi;
  const title = isIce
    ? copy('Tính nhiệt nóng chảy riêng của đá', 'Estimate the specific latent heat of fusion of ice')
    : copy('Tính nhiệt dung riêng từ số đo của em', 'Calculate specific heat from your readings');
  const instructions = isIce
    ? copy('Dùng số đo của em khi đá tan hết và nhiệt độ đã ổn định trên 0 °C. Giả thiết đá ban đầu ở 0 °C, bình cùng nhiệt độ với nước ban đầu, không có nước tràn hay trao đổi nhiệt với môi trường.', 'Use your readings after all ice has melted and the temperature has stabilized above 0 °C. Assume the ice starts at 0 °C, the vessel starts at the water temperature and there is no spillage or heat exchange with the surroundings.')
    : copy('Nhập số đo của em khi nhiệt độ đã ổn định. Giả thiết bình cùng nhiệt độ với nước ban đầu, không có nước tràn hay trao đổi nhiệt với môi trường.', 'Enter your readings once the temperature has stabilized. Assume the vessel starts at the water temperature and there is no spillage or heat exchange with the surroundings.');
  const formula = isIce
    ? 'L = [(m<sub>w</sub> c<sub>w</sub> + C<sub>cal</sub>)(T<sub>w,0</sub> − T<sub>f</sub>) − m<sub>i</sub> c<sub>w</sub>(T<sub>f</sub> − 0 °C)] / m<sub>i</sub>'
    : 'c<sub>s</sub> = (m<sub>w</sub> c<sub>w</sub> + C<sub>cal</sub>)(T<sub>f</sub> − T<sub>w,0</sub>) / [m<sub>s</sub>(T<sub>s,0</sub> − T<sub>f</sub>)]';
  const fields = fieldIds(activity).map(id => {
    const label = fieldLabels[id][languageIndex(locale)];
    return `<label>${label}<input data-l3-calc="${id}" type="number" step="any" inputmode="decimal" aria-describedby="l3CalcAssumptions"></label>`;
  }).join('');
  return `<details class="l3-calculation">
  <summary>${title}</summary>
  <p id="l3CalcAssumptions">${instructions}</p>
  <p class="l3-calc-formula">${formula} · c<sub>w</sub> = ${CW} J/(kg·K)</p>
  <div class="l3-setup">${fields}</div>
  ${isIce ? `<label class="l3-calc-assumption"><input type="checkbox" data-l3-calc-all-melted> ${copy('Tôi đã quan sát thấy đá tan hết', 'I observed that all the ice had melted')}</label>` : ''}
  <button type="button" data-l3-action="calculate">${copy('Tính từ số đo', 'Calculate from readings')}</button>
  <p id="l3CalculationStatus" role="status" aria-live="polite"></p>
  <output id="l3Calculated" role="status" aria-live="polite"></output>
  <div id="l3EnergyBalance" hidden></div>
</details>`;
}

function formatNumber(value, locale) {
  const smallOrLarge = value !== 0 && (Math.abs(value) < 0.01 || Math.abs(value) >= 1e12);
  const language = english(locale) ? 'en-US' : 'vi-VN';
  const format = smallOrLarge ? {notation: 'scientific', maximumSignificantDigits: 5} : {maximumFractionDigits: 2};
  return value.toLocaleString(language, format);
}

/** Rebuild only the output, using a validated completed calculation from the current trial. */
export function showThermalCalculation(root, activity, locale, savedCalculation) {
  const output = root.querySelector('#l3Calculated');
  const status = root.querySelector('#l3CalculationStatus');
  const breakdown = root.querySelector('#l3EnergyBalance');
  if (!output || !status || !breakdown) return false;
  if (!savedCalculation) {
    output.textContent = '';
    status.textContent = '';
    breakdown.replaceChildren();
    breakdown.hidden = true;
    return false;
  }
  const en = english(locale);
  const property = activity === 'ice' ? 'latentHeatJPerKg' : 'specificHeatJPerKgK';
  const unit = activity === 'ice' ? 'J/kg' : 'J/(kg·K)';
  let expected;
  try {
    expected = calculateThermalProperty(activity, savedCalculation);
    const storedValue = savedCalculation[property];
    const expectedValue = expected.calculation[property];
    const roundingTolerance = Math.abs(expectedValue) * Number.EPSILON * 8;
    if (!Number.isFinite(storedValue) || storedValue <= 0 || Math.abs(expectedValue - storedValue) > roundingTolerance) reject('saved-result-inconsistent');
  } catch {
    output.textContent = '';
    breakdown.replaceChildren();
    breakdown.hidden = true;
    status.textContent = thermalCalculationMessage('saved-result-inconsistent', locale);
    return false;
  }

  status.textContent = '';
  output.textContent = `${formatNumber(savedCalculation[property], locale)} ${unit}`;
  const inputSummary = fieldIds(activity).map(id => {
    const label = fieldLabels[id][languageIndex(locale)];
    return `<div><dt>${label}</dt><dd>${formatNumber(savedCalculation[id], locale)}</dd></div>`;
  }).join('');
  const energy = Object.entries(energyLabels).flatMap(([id, labels]) => {
    if (!Object.hasOwn(expected.energyTerms, id)) return [];
    return `<div><dt>${labels[languageIndex(locale)]}</dt><dd>${formatNumber(expected.energyTerms[id], locale)} J</dd></div>`;
  }).join('');
  breakdown.innerHTML = `<p>${en ? 'Heat balance from these readings' : 'Cân bằng nhiệt từ bộ số đo này'}</p>
    <p>${en ? 'Positive energy means heat absorbed. Negative energy means heat released. These terms come from the same balance equation as the estimate.' : 'Giá trị dương là nhiệt lượng thu vào. Giá trị âm là nhiệt lượng tỏa ra. Các phần nhiệt lượng được suy ra từ cùng phương trình với kết quả ước lượng.'}</p>
    <dl class="l3-calc-terms">${energy}</dl>
    <details class="l3-calc-inputs"><summary>${en ? 'Readings used' : 'Số đo đã dùng'}</summary><dl class="l3-calc-terms">${inputSummary}</dl></details>`;
  breakdown.hidden = false;
  return true;
}
