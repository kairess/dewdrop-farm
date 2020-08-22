const $ = require('./jquery');
const Rules = require('./rules');
const Farm = require('./farm');

const Renderer = {};

const renderTime = (farm) => {
  const day = Rules.day(farm);
  const season = Rules.season(farm);

  return `Day ${day} of <span class="capitalize">${season}</span>`;
};

const renderCash = (cash) => {
  let html = '';
  html += '<div class="cash">';
  html += `<span class="value">${cash}</span>`;
  html += '<span class="tile cash"></span>';
  html += '</div>';
  return html;
};

const renderCrop = (crop, type) => {
  const name = type === 'store' ? `${crop.type} ${crop.seed}` : crop.type;

  let html = '';
  html += '<div class="row crop">';
  html += `<span class="tile ${crop.type} stage6"></span>`;
  html += `<span class="capitalize name">${name}</span>`;
  html += '</div>';
  return html;
};

const renderStoreRow = (crop, amount, type) => {
  const cash = type === 'store' ? crop.prices.seed : crop.prices.crop;

  let html = '';
  html += `<div class="row slot item" data-crop="${crop.type}">`;
  html += renderCrop(crop, type);
  html += renderCash(cash, amount);
  html += '</div>';
  return html;
};

const getFarmPlotClasses = (farm, row, col) =>
  farm.land[row][col].map((land) => land.crop ? '' : land.type).join(' ').trim();

const renderFarmPlotClasses = (farm, row, col) => {
  const klasses = getFarmPlotClasses(farm, row, col);

  const upTilled = Farm.tilled(farm, {row: row - 1, col}) ? 1 : 0
  const downTilled = Farm.tilled(farm, {row: row + 1, col}) ? 1 : 0;
  const leftTilled = Farm.tilled(farm, {row, col: col - 1}) ? 1 : 0;
  const rightTilled = Farm.tilled(farm, {row, col: col + 1}) ? 1 : 0;

  const stage = `stage${upTilled}${rightTilled}${downTilled}${leftTilled}`;

  return `${klasses} ${stage}`;
};

const renderFarmCropClasses = (farm, row, col) =>
  farm.land[row][col].map((land) => {
    const result = land.crop ? ['tile', land.crop] : [];

    if (land.stage) {
      result.push(`stage${land.stage}`);
    }

    return result.join(' ');
  }).join(' ').trim();

const renderFarm = (farm) => {
  let html = '';

  for (let row = 0; row < farm.rows; row += 1) {
    html += '<div class="row">';

    for (let col = 0; col < farm.cols; col += 1) {
      const plotClasses = renderFarmPlotClasses(farm, row, col);
      const cropClasses = renderFarmCropClasses(farm, row, col);

      html += `<div class="tile plot ${plotClasses}" data-crop="p${row}${col}">`;
      if (cropClasses) {
        html += `<div class="${cropClasses}"></div>`;
      }
      html += '</div>';
    }

    html += '</div>';
  }

  return html;
};

const renderStore = (farm) => {
  let html = '';

  Rules.store(farm).forEach((crop) => {
    html += renderStoreRow(crop, 1, 'store');
  });

  return html;
};

const renderMarket = (farm) => {
  let html = '';

  Rules.market(farm).forEach((crop) => {
    const amount = farm.market[crop.type] || 0;

    html += renderStoreRow(crop, amount, 'market');
  });

  return html;
};

const renderTool = (tool) => {
  $(`#${tool}`).addClass('active');

  if (tool === 'buy') {
    $('#farm').addClass('hidden');
    $('#store').removeClass('hidden');
    $('#market').addClass('hidden');
    return;
  }

  if (tool === 'sell') {
    $('#farm').addClass('hidden');
    $('#store').addClass('hidden');
    $('#market').removeClass('hidden');
    return;
  }

  $('#farm').removeClass('hidden');
  $('#store').addClass('hidden');
  $('#market').addClass('hidden');
};

const renderInventory = (farm) => {
  farm.inventory.forEach((seed, index) => {
    const html = seed ? `${seed.type} ${seed.amount}` : '';

    renderIfChanged(`#slot${index}`, html);
  });
};

const renderIfChanged = (selector, newHtml) => {
  const element = $(selector);
  const oldHtml = element.html();

  if (newHtml !== oldHtml) {
    console.log({newHtml, oldHtml});
    element.html(newHtml);
  }
};

Renderer.clear = () => {
  $('#hoe').removeClass('active');
  $('#water').removeClass('active');
  $('#slot0').removeClass('active');
  $('#slot1').removeClass('active');
  $('#slot2').removeClass('active');
  $('#slot3').removeClass('active');
  $('#buy').removeClass('active');
  $('#sell').removeClass('active');
};

Renderer.render = (farm, tool) => {
  Renderer.clear();
  renderTool(tool);
  renderInventory(farm);
  renderIfChanged('#time', renderTime(farm));
  renderIfChanged('#cash', renderCash(farm.cash));
  renderIfChanged('#farm', renderFarm(farm, tool));
  renderIfChanged('#store', renderStore(farm));
  renderIfChanged('#market', renderMarket(farm));
};

Renderer.invalidate = (farm, tool) => {
  requestAnimationFrame(() => Renderer.render(farm, tool));
};

module.exports = Renderer;
