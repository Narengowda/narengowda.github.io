const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreValue = document.getElementById('scoreValue');
const bestValue = document.getElementById('bestValue');
const speedValue = document.getElementById('speedValue');
const startOverlay = document.getElementById('startOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const finalScoreText = document.getElementById('finalScoreText');

const road = {
  x: canvas.width / 2,
  width: 320,
  laneCount: 3,
  scrollSpeed: 260,
  lineOffset: 0,
};

const player = {
  x: canvas.width / 2,
  y: canvas.height - 120,
  width: 54,
  height: 88,
  speed: 260,
  maxSpeed: 520,
  minSpeed: 180,
  turnSpeed: 420,
};

const keys = { left: false, right: false, up: false, down: false };
let obstacles = [];
let score = 0;
let best = Number(localStorage.getItem('neon-race-best') || 0);
let running = false;
let lastFrame = 0;
let lastSpawn = 0;

bestValue.textContent = best;

function resetGame() {
  obstacles = [];
  score = 0;
  player.x = canvas.width / 2;
  player.speed = player.minSpeed;
  road.scrollSpeed = player.speed;
  road.lineOffset = 0;
  scoreValue.textContent = '0';
  speedValue.textContent = '0';
  lastSpawn = 0;
}

function startGame() {
  resetGame();
  running = true;
  startOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
}

function endGame() {
  running = false;
  best = Math.max(best, Math.floor(score));
  localStorage.setItem('neon-race-best', String(best));
  bestValue.textContent = String(best);
  finalScoreText.textContent = `Score: ${Math.floor(score)}`;
  gameOverOverlay.classList.remove('hidden');
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function laneCenter(index) {
  const offset = road.width / road.laneCount;
  return road.x - road.width / 2 + offset * (index + 0.5);
}

function spawnObstacle() {
  const lane = Math.floor(Math.random() * road.laneCount);
  const colors = ['#ff8a80', '#ffd166', '#90dbf4', '#b9fbc0', '#c77dff'];
  obstacles.push({
    x: laneCenter(lane),
    y: -100,
    width: 52,
    height: 90,
    color: colors[Math.floor(Math.random() * colors.length)],
  });
}

function update(delta) {
  if (!running) return;

  const steer = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  player.x += steer * player.turnSpeed * delta;
  player.x = clamp(player.x, canvas.width / 2 - road.width / 2 + 26, canvas.width / 2 + road.width / 2 - 26);

  const targetSpeed = clamp(
    player.minSpeed + (keys.up ? 1 : 0) * 230 - (keys.down ? 1 : 0) * 170,
    player.minSpeed,
    player.maxSpeed
  );

  player.speed += (targetSpeed - player.speed) * 3 * delta;
  road.scrollSpeed = player.speed;
  road.lineOffset += road.scrollSpeed * delta;
  score += player.speed * 0.02 * delta;

  scoreValue.textContent = Math.floor(score);
  speedValue.textContent = Math.floor(player.speed);

  const now = performance.now();
  if (now - lastSpawn > 700) {
    spawnObstacle();
    lastSpawn = now;
  }

  for (const car of obstacles) {
    car.y += (road.scrollSpeed + 80) * delta;
  }

  obstacles = obstacles.filter((car) => car.y < canvas.height + 140);

  for (const car of obstacles) {
    const hit =
      player.x - player.width / 2 < car.x + car.width / 2 &&
      player.x + player.width / 2 > car.x - car.width / 2 &&
      player.y - player.height / 2 < car.y + car.height / 2 &&
      player.y + player.height / 2 > car.y - car.height / 2;

    if (hit) {
      endGame();
      return;
    }
  }
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#11283d');
  sky.addColorStop(1, '#081923');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 12; i++) {
    const x = (i * 80 + (road.lineOffset * 0.5) % 80);
    const y = (i * 60 + (road.lineOffset * 0.8)) % (canvas.height + 80) - 80;
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x, y, 4, 28);
  }

  const roadLeft = canvas.width / 2 - road.width / 2;
  const roadRight = canvas.width / 2 + road.width / 2;
  ctx.fillStyle = '#1b2a38';
  ctx.fillRect(roadLeft, 0, road.width, canvas.height);

  ctx.fillStyle = '#2b3949';
  ctx.fillRect(roadLeft + 18, 0, 6, canvas.height);
  ctx.fillRect(roadRight - 24, 0, 6, canvas.height);

  const stripeY = (road.lineOffset % 60) - 60;
  for (let y = stripeY; y < canvas.height + 120; y += 60) {
    ctx.fillStyle = '#edf7ff';
    ctx.fillRect(canvas.width / 2 - 6, y, 12, 28);
    ctx.fillRect(canvas.width / 2 - road.width / 2 + 82, y, 12, 28);
    ctx.fillRect(canvas.width / 2 + road.width / 2 - 94, y, 12, 28);
  }
}

function drawCar(car, isPlayer = false) {
  const { x, y, width, height, color } = car;
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = isPlayer ? '#4dd6ff' : color;
  ctx.fillRect(-width / 2, -height / 2, width, height);

  ctx.fillStyle = isPlayer ? '#b4f5ff' : '#f4f7ff';
  ctx.fillRect(-width / 2 + 8, -height / 2 + 10, width - 16, 16);
  ctx.fillRect(-width / 2 + 8, height / 2 - 26, width - 16, 16);

  ctx.fillStyle = '#111b24';
  ctx.fillRect(-width / 2 + 4, -height / 2 + 8, 10, 18);
  ctx.fillRect(width / 2 - 14, -height / 2 + 8, 10, 18);
  ctx.fillRect(-width / 2 + 4, height / 2 - 26, 10, 18);
  ctx.fillRect(width / 2 - 14, height / 2 - 26, 10, 18);

  ctx.restore();
}

function draw() {
  drawBackground();
  drawCar(player, true);
  for (const car of obstacles) {
    drawCar(car, false);
  }
}

function gameLoop(timestamp) {
  const delta = Math.min((timestamp - lastFrame) / 1000 || 0.016, 0.032);
  lastFrame = timestamp;
  update(delta);
  draw();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') keys.left = true;
  if (event.key === 'ArrowRight') keys.right = true;
  if (event.key === 'ArrowUp') keys.up = true;
  if (event.key === 'ArrowDown') keys.down = true;

  if ((event.key === ' ' || event.key === 'Enter') && !running) {
    startGame();
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowLeft') keys.left = false;
  if (event.key === 'ArrowRight') keys.right = false;
  if (event.key === 'ArrowUp') keys.up = false;
  if (event.key === 'ArrowDown') keys.down = false;
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

resetGame();
requestAnimationFrame(gameLoop);
