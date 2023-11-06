// Canvas
const { body } = document;
const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");
const width = Math.min(window.innerWidth, 9 * window.innerHeight / 12);
const height = 12 / 9 * width;
const screenWidth = window.innerWidth;
const canvasPosition = screenWidth / 2 - width / 2;
const isMobile = window.matchMedia('(max-width: 600px)');
const gameOverEl = document.createElement('div');

// Message
const msgDiv = document.createElement("div");
const message = document.createElement('h1');
let t;

// Paddle
const paddleWidth = width / 10;
const paddleHeight = paddleWidth / 5;
const paddleDiff = paddleWidth / 2;
let paddleBottomX = width / 2 - paddleDiff;
let paddleTopX = paddleBottomX;
let playerMoved = false;
let paddleContact = false;

// Ball
let ballX = width / 2;
let ballY = height / 2;
const ballRadius = paddleHeight / 2;

// Speed
let speedY = 0;
let speedX = 0;
const defaultSpeed = 0.3 * paddleHeight;
let computerSpeed = defaultSpeed;
const maxBallSpeed = paddleHeight / 2;

// Score
let playerScore = 0;
let computerScore = 0;
const winningScore = 7;
let isGameOver = false;
let paused;

// Render Everything on Canvas
function updateDOM() {
  // Canvas Background
  context.fillStyle = 'black';
  context.fillRect(0, 0, width, height);

  // Paddle Color
  context.fillStyle = 'white';

  // Player Paddle (Bottom)
  context.fillRect(paddleBottomX, height - 2*paddleHeight, paddleWidth, paddleHeight);

  // Computer Paddle (Top)
  context.fillRect(paddleTopX, paddleHeight, paddleWidth, paddleHeight);

  // Dashed Center Line
  context.beginPath();
  context.setLineDash([4]);
  context.moveTo(0, height / 2);
  context.lineTo(width, height / 2);
  context.strokeStyle = 'grey';
  context.stroke();

  // Ball
  context.beginPath();
  context.arc(ballX, ballY, ballRadius, 2 * Math.PI, false);
  context.fillStyle = 'white';
  context.fill();

  // Score
  context.font = '32px Courier New';
  context.fillText(playerScore, 20, canvas.height / 2 + 50);
  context.fillText(computerScore, 20, canvas.height / 2 - 30);
}

// Create Canvas Element
function createCanvas() {
  let active = false;
  let startX;

  canvas.width = width;
  canvas.height = height;

  body.appendChild(canvas);

  window.addEventListener("mousedown", (e) => {
    active = true;
    startX = e.clientX - paddleBottomX;
  });

  window.addEventListener("mousemove", (e) => {
    if(active) {
      paddleBottomX = e.clientX - startX;
      if (paddleBottomX < 0) {
        paddleBottomX = 0;
        startX = e.clientX - paddleBottomX;
      }
      if (paddleBottomX > width - paddleWidth) {
        paddleBottomX = width - paddleWidth;
        startX = e.clientX - paddleBottomX;
      }
    }
  })

  window.addEventListener("mouseup", (e) => {
    active = false;
  })

  window.addEventListener("touchstart", (e) => {
    startX = e.targetTouches[0].clientX*1.5 - paddleBottomX;
  })

  window.addEventListener("touchmove", (e) => {
    const currX = e.targetTouches[0].clientX*1.5;
    paddleBottomX = currX - startX;
      if (paddleBottomX < 0) {
        paddleBottomX = 0;
        startX = currX - paddleBottomX;
      }
      if (paddleBottomX > width - paddleWidth) {
        paddleBottomX = width - paddleWidth;
        startX = currX - paddleBottomX;
      }
  })

  window.addEventListener("keydown", (e) => {
    if(e.key === " ") {
      paused = !paused;
    }
  })
}

// Reset Ball to Center
function ballReset() {
  ballX = width / 2;
  ballY = height / 2;
  speedX = (Math.random()- 0.5)*-paddleHeight/4;
  speedY = defaultSpeed;
}

// Adjust Ball Movement and computer paddle
function moveBall() {
  // ball
  ballY -= speedY;
  ballX += speedX;

  // computer paddle
  const newPaddleTopX = ballX - paddleDiff;
  if(newPaddleTopX > paddleTopX + computerSpeed) {
    paddleTopX += computerSpeed;
  } else if(newPaddleTopX < paddleTopX - computerSpeed) {
    paddleTopX -= computerSpeed;
  } else {
    paddleTopX = newPaddleTopX;
  }
}

// Determine What Ball Bounces Off, Score Points, Reset Ball
function checkBallHit() {
  // Bounce off Left Wall
  if (ballX < 0 && speedX < 0) {
    speedX = -speedX;
  }
  // Bounce off Right Wall
  if (ballX > width && speedX > 0) {
    speedX = -speedX;
  }
  // Bounce off player paddle (bottom)
  if (ballY > height - paddleDiff) {
    if (ballX > paddleBottomX - ballRadius && ballX < paddleBottomX + paddleWidth + ballRadius && ballY < height - paddleDiff + paddleHeight) {
      // Add Speed on Hit
      if(speedY < -maxBallSpeed) {
        speedY = maxBallSpeed;
      } else speedY = -speedY * 1.05;

      const trajectoryX = ballX - paddleBottomX - paddleDiff;
      speedX += trajectoryX * 0.3;

    } else if (ballY > height) {
      // Reset Ball, add to Computer Score
      computerScore++;
      gameOver();
      ballReset();
    }
  }
  // Bounce off computer paddle (top)
  if (ballY < paddleDiff) {
    if (ballX > paddleTopX - ballRadius && ballX < paddleTopX + paddleWidth + ballRadius && ballY > paddleDiff - paddleHeight) {
      // Add Speed on Hit
      if(speedY > maxBallSpeed) {
        speedY = -maxBallSpeed;
      } else speedY = -speedY * 1.05;

      const trajectoryX = ballX - paddleTopX - paddleDiff;
      speedX += trajectoryX * 0.3;
    } else if (ballY < 0) {
      // Reset Ball, add to Player Score
      computerSpeed = computerSpeed * 1.5;
      playerScore++;
      gameOver();
      ballReset();
    }
  }
}

// Renders results screen
function showResult() {
  // Hide Canvas
  canvas.hidden = true;
  // Container
  gameOverEl.textContent = 'game over';
  gameOverEl.classList.add('game-over-container');
  // Title
  const title = document.createElement('h1');
  title.textContent = (playerScore === winningScore) ? "Victory" : "Defeat";
  // Button
  const playAgainBtn = document.createElement('button');
  playAgainBtn.setAttribute('onclick', 'resetGame()');
  playAgainBtn.textContent = 'Play Again';
  // Append
  gameOverEl.append(title, playAgainBtn);
  body.appendChild(gameOverEl);
}

// Check If One Player Has Winning Score, If They Do, End Game
function gameOver() {
  if (playerScore === winningScore || computerScore === winningScore) {
    isGameOver = true;
    showResult();
  }
}

// Called Every Frame
function animate() {
  if(!paused && !isGameOver){
    updateDOM();
    moveBall();
    checkBallHit();
  }
  (async () => window.requestAnimationFrame(animate))();
}

// Start Game, Reset Everything
function resetGame() {
  if (isGameOver) {
    ballReset();
    body.removeChild(gameOverEl);
    canvas.hidden = false;
  }
  isGameOver = false;
  playerScore = 0;
  computerScore = 0;
  computerSpeed = defaultSpeed;
}

// On Load
createCanvas();
resetGame();
animate();
ballReset();