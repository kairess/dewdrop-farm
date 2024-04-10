const $ = require('./jquery');
const Farm = require('./farm');
const Renderer = require('./renderer');
const Rules = require('./rules');
const Engine = require('./engine');

const Game = {};

let farm;
let tool;
let slot;
let screen;
let saved;

const offFarm = (_, event) => {
  let element = event.target;

  while (element && !element.dataset.crop) {
    element = element.parentElement;
  }

  if (element && element.dataset.crop) {
    const [row, col] = element.dataset.crop.split('');

    const action = {
      tool,
      row,
      col,
      slot,
    };

    farm = Rules.dispatch(farm, action);
    Renderer.invalidate(farm, tool, screen);
  }
};

const offStore = (_, event) => {
  let element = event.target;

  while (element && !element.dataset.crop) {
    element = element.parentElement;
  }

  if (element && element.dataset.crop) {
    const action = {
      tool: 'buy',
      row: 0,
      col: 0,
      crop: element.dataset.crop,
      seed: element.dataset.seed === 'true',
    }

    farm = Rules.dispatch(farm, action);
    Renderer.invalidate(farm, tool, screen);
  }
};

const offMarket = (_, event) => {
  let element = event.target;

  while (element && !element.dataset.crop) {
    element = element.parentElement;
  }

  if (element && element.dataset.crop) {
    const action = {
      tool: 'sell',
      row: 0,
      col: 0,
      crop: element.dataset.crop,
      seed: element.dataset.seed === 'true',
    }

    farm = Rules.dispatch(farm, action);
    Renderer.invalidate(farm, tool, screen);
  }
};

const onTool = (aTool) => () => {
  tool = aTool;
  slot = ['slot0', 'slot1', 'slot2', 'slot3'].findIndex((type) => type === tool);

  if (slot < 0) {
    slot = undefined;
  }

  Renderer.invalidate(farm, tool, screen);
};

const onScreen = (aScreen) => () => {
  screen = aScreen;

  Renderer.invalidate(farm, tool, screen);
};

const onActivePlot = (dir) => () => {
  if (dir === 'up') {
    if (farm.activePlot.row <= 0) return;
    farm.activePlot.row--;
  } else if (dir === 'down') {
    if (farm.activePlot.row >= farm.rows - 1) return;
    farm.activePlot.row++;
  } else if (dir === 'left') {
    if (farm.activePlot.col <= 0) return;
    farm.activePlot.col--;
  } else if (dir === 'right') {
    if (farm.activePlot.col >= farm.cols - 1) return;
    farm.activePlot.col++;
  }
}

const onUpdate = (dt) => {
  const action = {
    tool: 'update',
    row: 0,
    col: 0,
    dt,
  };

  farm = Rules.dispatch(farm, action);
  Game.save();
  Renderer.invalidate(farm, tool, screen);
};

const onKeyDown = ({isComposing, keyCode}) => {
  if (!isComposing && keyCode !== 229) {
    const toolKeys = {
      49: 'hoe',
      50: 'water',
      51: 'slot0',
      52: 'slot1',
      53: 'slot2',
      54: 'slot3',
    };

    const screenKeys = {
      70: 'tend',
      66: 'buy',
      // 83: 'sell', // TODO: duplicated key
      73: 'geek',
    };

    const moveKeys = {
      87: 'up',
      83: 'down',
      65: 'left',
      68: 'right',
    }

    if (toolKeys[keyCode]) {
      onTool(toolKeys[keyCode])();
    }

    if (screenKeys[keyCode]) {
      onScreen(screenKeys[keyCode])();
    }

    if (moveKeys[keyCode]) {
      onActivePlot(moveKeys[keyCode])();
    }

    if (keyCode === 32) {
      const row = farm.activePlot.row;
      const col = farm.activePlot.col;

      const action = {
        tool,
        row,
        col,
        slot,
      };

      farm = Rules.dispatch(farm, action);
      Renderer.invalidate(farm, tool, screen);
    }
  }
};

Game.reset = () => {
  farm = Farm.create();
  tool = 'hoe';
  slot = undefined;
  screen = 'tend';
  saved = 0;
};

Game.save = () => {
  const day = Farm.day(farm);

  if (saved !== day) {
    if (!farm.monetization) {
      farm.monetization = document.monetization && document.monetization.state === 'started';
    }

    let success = false;
    [farm, success] = Farm.save(farm, window.localStorage);

    if (success) {
      saved = day;
    }
  }
};

Game.load = () => {
  farm = Farm.load(farm, window.localStorage);
};

Game.play = () => {
  document.addEventListener('keydown', onKeyDown);

  $('#hoe').click(onTool('hoe'));
  $('#water').click(onTool('water'));
  $('#slot0').click(onTool('slot0'));
  $('#slot1').click(onTool('slot1'));
  $('#slot2').click(onTool('slot2'));
  $('#slot3').click(onTool('slot3'));
  $('#tend').click(onScreen('tend'));
  $('#buy').click(onScreen('buy'));
  $('#sell').click(onScreen('sell'));
  $('#geek').click(onScreen('geek'));
  $('#store').click(undefined, undefined, offStore);
  $('#market').click(undefined, undefined, offMarket);
  $('#reset').click(undefined, undefined, Game.reset);
  $('#farm').click(offFarm, offFarm);

  Game.reset();
  Game.load();
  Engine.run(onUpdate);

  Renderer.invalidate(farm, tool, screen);
};

module.exports = Game;
