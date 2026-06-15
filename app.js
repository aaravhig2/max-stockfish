/* global Chess, Chessboard */
(() => {
  'use strict';

  const ENGINE_DEPTH = 18;
  const boardElement = document.getElementById('board');
  const statusElement = document.getElementById('engineStatus');
  const turnElement = document.getElementById('turnIndicator');
  const moveLogElement = document.getElementById('moveLog');
  const newGameButton = document.getElementById('newGameButton');
  const copyFenButton = document.getElementById('copyFenButton');

  let game = new Chess();
  let board;
  let engine;
  let engineReady = false;
  let engineThinking = false;

  function setStatus(message, state = 'ready') {
    statusElement.textContent = message;
    statusElement.className = `status ${state}`;
  }

  function updateTurnIndicator() {
    if (game.game_over()) {
      if (game.in_checkmate()) turnElement.textContent = game.turn() === 'w' ? 'Black won' : 'White won';
      else if (game.in_draw()) turnElement.textContent = 'Draw';
      else turnElement.textContent = 'Game over';
      return;
    }
    turnElement.textContent = game.turn() === 'w' ? 'White' : 'Black';
  }

  function renderMoveLog() {
    const history = game.history();
    moveLogElement.innerHTML = '';
    for (let index = 0; index < history.length; index += 2) {
      const li = document.createElement('li');
      li.textContent = history[index + 1] ? `${history[index]}  ${history[index + 1]}` : history[index];
      moveLogElement.appendChild(li);
    }
    moveLogElement.scrollTop = moveLogElement.scrollHeight;
  }

  function refreshUi() {
    board.position(game.fen(), false);
    updateTurnIndicator();
    renderMoveLog();
  }

  function uciMoveHistory() {
    return game.history({ verbose: true }).map((move) => `${move.from}${move.to}${move.promotion || ''}`).join(' ');
  }

  function sendEngineCommand(command) {
    if (engine) engine.postMessage(command);
  }

  function requestEngineMove() {
    if (!engineReady || engineThinking || game.game_over()) return;
    engineThinking = true;
    setStatus('Stockfish is thinking...', 'thinking');
    const moves = uciMoveHistory();
    sendEngineCommand(`position startpos${moves ? ` moves ${moves}` : ''}`);
    sendEngineCommand(`go depth ${ENGINE_DEPTH}`);
  }

  function applyEngineMove(bestMove) {
    if (!bestMove || bestMove === '(none)' || game.game_over()) return;
    const move = game.move({
      from: bestMove.slice(0, 2),
      to: bestMove.slice(2, 4),
      promotion: bestMove.slice(4, 5) || 'q'
    });
    if (move) refreshUi();
  }

  function handleEngineMessage(event) {
    const line = String(event.data || '').trim();
    if (!line) return;

    if (line === 'uciok') {
      sendEngineCommand('isready');
      return;
    }
    if (line === 'readyok') {
      engineReady = true;
      setStatus('Your turn', 'ready');
      return;
    }
    if (line.startsWith('bestmove')) {
      engineThinking = false;
      const bestMove = line.split(/\s+/)[1];
      applyEngineMove(bestMove);
      setStatus(game.game_over() ? describeGameOver() : 'Your turn', game.game_over() ? 'error' : 'ready');
    }
  }

  function describeGameOver() {
    if (game.in_checkmate()) return `Checkmate — ${game.turn() === 'w' ? 'Black' : 'White'} wins`;
    if (game.in_stalemate()) return 'Draw by stalemate';
    if (game.in_threefold_repetition()) return 'Draw by threefold repetition';
    if (game.insufficient_material()) return 'Draw by insufficient material';
    if (game.in_draw()) return 'Draw';
    return 'Game over';
  }

  function onDragStart(_source, piece) {
    if (game.game_over() || engineThinking || !engineReady) return false;
    if (game.turn() !== 'w') return false;
    return piece.startsWith('w');
  }

  function onDrop(source, target) {
    const move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';
    refreshUi();
    if (game.game_over()) {
      setStatus(describeGameOver(), 'error');
    } else {
      window.setTimeout(requestEngineMove, 250);
    }
    return undefined;
  }

  function onSnapEnd() {
    board.position(game.fen());
  }

  function initializeBoard() {
    board = Chessboard(boardElement, {
      draggable: true,
      position: 'start',
      // Using local piece images from img/chesspeices/wikipedia directory
      // For local development, ensure you run a local server (see README-setup.md)
      pieceTheme: 'img/chesspeices/wikipedia/{piece}.png',
      onDragStart,
      onDrop,
      onSnapEnd
    });
    window.addEventListener('resize', () => board.resize());
  }

  function initializeEngine() {
    try {
      engine = new Worker('https://cdn.jsdelivr.net/npm/stockfish@18/dist/stockfish-18.js');
      engine.onmessage = handleEngineMessage;
      engine.onerror = () => {
        engineReady = false;
        setStatus('Could not load Stockfish 18 from CDN', 'error');
      };
      sendEngineCommand('uci');
    } catch (error) {
      setStatus('Web Workers are unavailable in this browser context', 'error');
    }
  }

  function newGame() {
    game = new Chess();
    engineThinking = false;
    sendEngineCommand('stop');
    sendEngineCommand('ucinewgame');
    sendEngineCommand('isready');
    refreshUi();
    setStatus(engineReady ? 'Your turn' : 'Loading Stockfish...', engineReady ? 'ready' : 'thinking');
  }

  async function copyFen() {
    try {
      await navigator.clipboard.writeText(game.fen());
      setStatus('FEN copied to clipboard', 'ready');
      window.setTimeout(() => setStatus(engineThinking ? 'Stockfish is thinking...' : 'Your turn', engineThinking ? 'thinking' : 'ready'), 1400);
    } catch (_error) {
      setStatus(game.fen(), 'ready');
    }
  }

  newGameButton.addEventListener('click', newGame);
  copyFenButton.addEventListener('click', copyFen);

  initializeBoard();
  initializeEngine();
  refreshUi();
})();
