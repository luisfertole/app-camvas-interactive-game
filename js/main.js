document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const gameContainer = document.getElementById('game-container');
    const player = document.getElementById('player');
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const startButton = document.getElementById('start-button');
    const pauseButton = document.getElementById('pause-button');
    const restartButton = document.getElementById('restart-button');
    const muteButton = document.getElementById('mute-button');
    const backgroundMusic = document.getElementById('background-music');

    // Game Constants
    const playerSpeed = 5;
    const playerSize = 60;
    const projectileSpeed = 7;
    const projectileSize = 10;
    const projectileFrequency = 500;
    const maxLevel = 10;

    // Level Settings - Compactado en una función
    function getLevelSettings(level) {
        const baseFreq = 1500 - (level - 1) * 100;
        const minSpeed = 2 + (level - 1) * 0.5;
        const maxSpeed = 6 + (level - 1) * 0.5;
        const maxObstacles = 3 + (level - 1);
        return { obstacleFreq: baseFreq, minSpeed, maxSpeed, maxObstacles };
    }

    // Game State Variables
    let gameRunning = false, gamePaused = false, score = 0, currentLevel = 1, isMuted = false;
    let obstacles = [], projectiles = [];
    let obstacleInterval, gameInterval, projectileInterval;
    let playerPosition = { x: 50, y: gameContainer.offsetHeight / 2 };
    let keys = { w: false, a: false, s: false, d: false };

    // Dynamic variables
    let obstacleFrequency, obstacleMinSpeed, obstacleMaxSpeed, maxObstaclesOnScreen;

    // Audio setup
    backgroundMusic.volume = 0.5;

    // Game Initialization
    function init() {
        // Reset player position
        playerPosition = { x: 50, y: gameContainer.offsetHeight / 2 };
        updatePlayerPosition();

        // Reset game state
        score = 0;
        scoreElement.textContent = score;
        currentLevel = 1;
        updateLevelSettings();
        
        // Update UI
        if (levelElement) levelElement.textContent = currentLevel;

        // Clear obstacles and projectiles
        obstacles = [];
        projectiles = [];
        clearAllElements('.obstacle');
        clearAllElements('.projectile');
    }

    // Helper function to clear elements
    function clearAllElements(selector) {
        document.querySelectorAll(selector).forEach(el => el.remove());
    }

    // Update player DOM position
    function updatePlayerPosition() {
        player.style.left = `${playerPosition.x}px`;
        player.style.top = `${playerPosition.y - (playerSize / 2)}px`;
    }

    // Update level-dependent settings
    function updateLevelSettings() {
        const settings = getLevelSettings(currentLevel);
        obstacleFrequency = settings.obstacleFreq;
        obstacleMinSpeed = settings.minSpeed;
        obstacleMaxSpeed = settings.maxSpeed;
        maxObstaclesOnScreen = settings.maxObstacles;
    }

    // Game Control Functions
    function startGame() {
        if (!gameRunning) {
            init();
            gameRunning = true;
            gamePaused = false;
            if (!isMuted) backgroundMusic.play().catch(e => console.log("Error playing audio:", e));
            startIntervals();
        } else if (gamePaused) {
            gamePaused = false;
            if (!isMuted) backgroundMusic.play().catch(e => console.log("Error playing audio:", e));
            startIntervals();
        }
    }

    function startIntervals() {
        obstacleInterval = setInterval(createObstacle, obstacleFrequency);
        gameInterval = setInterval(updateGame, 20);
        projectileInterval = setInterval(createProjectile, projectileFrequency);
    }

    function pauseGame() {
        if (gameRunning && !gamePaused) {
            gamePaused = true;
            clearInterval(obstacleInterval);
            clearInterval(gameInterval);
            clearInterval(projectileInterval);
            backgroundMusic.pause();
        }
    }

    function restartGame() {
        gameRunning = false;
        pauseGame();
        init();
        removeGameOverMessage();
        startGame();
    }

    // Level System
    function updateLevel() {
        if (currentLevel < maxLevel && score >= 10 * currentLevel) {
            currentLevel++;
            updateLevelSettings();
            clearInterval(obstacleInterval);
            obstacleInterval = setInterval(createObstacle, obstacleFrequency);
            if (levelElement) levelElement.textContent = currentLevel;
            showMessage('level-up', `<h3>¡Nivel ${currentLevel}!</h3>`, 2000);
        }
    }

    // Create game elements
    function createObstacle() {
        if (!gameRunning || gamePaused || obstacles.length >= maxObstaclesOnScreen) return;
    
        const obstacleSize = Math.floor(Math.random() * 30) + 20;
        const obstacleY = Math.floor(Math.random() * (gameContainer.offsetHeight - obstacleSize));
        const obstacleSpeed = Math.random() * (obstacleMaxSpeed - obstacleMinSpeed) + obstacleMinSpeed;
    
        const obstacle = document.createElement('div');
        obstacle.className = 'obstacle';
        obstacle.style.width = `${obstacleSize}px`;
        obstacle.style.height = `${obstacleSize}px`;
        obstacle.style.top = `${obstacleY}px`;
        obstacle.style.left = `${gameContainer.offsetWidth}px`;
        
        // Agregar la imagen de fondo
        obstacle.style.backgroundImage = "url('./imagen/bar.png')";
        obstacle.style.backgroundSize = "cover";
        obstacle.style.backgroundPosition = "center";
        
        gameContainer.appendChild(obstacle);
    
        obstacles.push({
            element: obstacle,
            x: gameContainer.offsetWidth,
            y: obstacleY,
            size: obstacleSize,
            speed: obstacleSpeed,
            verticalDirection: Math.random() > 0.5 ? 1 : -1,
            verticalSpeed: Math.random() * 2 * (currentLevel / 5)
        });
    }

    function createProjectile() {
        if (!gameRunning || gamePaused) return;

        const projectile = document.createElement('div');
        projectile.className = 'projectile';
        projectile.style.width = `${projectileSize}px`;
        projectile.style.height = `${projectileSize}px`;
        projectile.style.top = `${playerPosition.y - (projectileSize / 2)}px`;
        projectile.style.left = `${playerPosition.x + playerSize}px`;
        gameContainer.appendChild(projectile);

        projectiles.push({
            element: projectile,
            x: playerPosition.x + playerSize,
            y: playerPosition.y - (projectileSize / 2),
            speed: projectileSpeed
        });
    }

    // Game Logic
    function updateGame() {
        if (!gameRunning || gamePaused) return;

        // Move player based on key presses
        movePlayer();
        
        // Update obstacles
        updateObstacles();
        
        // Update projectiles
        updateProjectiles();
    }

    function movePlayer() {
        if (keys.w && playerPosition.y > playerSize / 2) playerPosition.y -= playerSpeed;
        if (keys.s && playerPosition.y < gameContainer.offsetHeight - playerSize / 2) playerPosition.y += playerSpeed;
        if (keys.a && playerPosition.x > 0) playerPosition.x -= playerSpeed;
        if (keys.d && playerPosition.x < gameContainer.offsetWidth - playerSize) playerPosition.x += playerSpeed;
        updatePlayerPosition();
    }

    function updateObstacles() {
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obstacle = obstacles[i];
            
            // Move obstacle
            obstacle.x -= obstacle.speed;
            obstacle.y += obstacle.verticalSpeed * obstacle.verticalDirection;
            
            // Bounce off edges
            if (obstacle.y <= 0 || obstacle.y >= gameContainer.offsetHeight - obstacle.size) {
                obstacle.verticalDirection *= -1;
            }
            
            // Update DOM position
            obstacle.element.style.left = `${obstacle.x}px`;
            obstacle.element.style.top = `${obstacle.y}px`;
            
            // Remove if off-screen
            if (obstacle.x + obstacle.size < 0) {
                obstacle.element.remove();
                obstacles.splice(i, 1);
                continue;
            }
            
            // Check collision with player
            if (checkCollision(playerPosition.x, playerPosition.y - (playerSize / 2), obstacle.x, obstacle.y, obstacle.size)) {
                player.classList.add('collision');
                pauseGame();
                showGameOver();
                setTimeout(() => player.classList.remove('collision'), 500);
            }
        }
    }

    function updateProjectiles() {
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const projectile = projectiles[i];
            
            // Move projectile
            projectile.x += projectile.speed;
            projectile.element.style.left = `${projectile.x}px`;
            
            // Remove if off-screen
            if (projectile.x > gameContainer.offsetWidth) {
                projectile.element.remove();
                projectiles.splice(i, 1);
                continue;
            }
            
            // Check collision with obstacles
            for (let j = obstacles.length - 1; j >= 0; j--) {
                const obstacle = obstacles[j];
                if (checkCollision(projectile.x, projectile.y, obstacle.x, obstacle.y, obstacle.size)) {
                    // Remove both elements
                    projectile.element.remove();
                    projectiles.splice(i, 1);
                    obstacle.element.remove();
                    obstacles.splice(j, 1);
                    
                    // Update score
                    score++;
                    scoreElement.textContent = score;
                    updateLevel();
                    break;
                }
            }
        }
    }

    function checkCollision(x1, y1, x2, y2, size) {
        return (
            x1 < x2 + size &&
            x1 + projectileSize > x2 &&
            y1 < y2 + size &&
            y1 + projectileSize > y2
        );
    }

    // UI Management
    function showGameOver() {
        showMessage('game-over', `
            <h2>¡Game Over!</h2>
            <p>Tu puntuación: ${score}</p>
            <p>Nivel alcanzado: ${currentLevel}</p>
            <p>Presiona "Reiniciar" para jugar de nuevo</p>
        `);
    }

    function showMessage(className, html, autoRemove = 0) {
        const messageDiv = document.createElement('div');
        messageDiv.className = className;
        messageDiv.id = className;
        messageDiv.innerHTML = html;
        gameContainer.appendChild(messageDiv);
        
        if (autoRemove > 0) {
            setTimeout(() => messageDiv.remove(), autoRemove);
        }
    }

    function removeGameOverMessage() {
        const gameOverDiv = document.getElementById('game-over');
        if (gameOverDiv) gameOverDiv.remove();
    }

    function toggleMute() {
        isMuted = !isMuted;
        backgroundMusic.muted = isMuted;
        muteButton.textContent = isMuted ? 'Activar Música' : 'Silenciar Música';
    }

    // Event Listeners
    document.addEventListener('keydown', function(e) {
        const key = e.key.toLowerCase();
        if (key === 'w' || e.key === 'ArrowUp') { keys.w = true; e.preventDefault(); }
        if (key === 'a' || e.key === 'ArrowLeft') { keys.a = true; e.preventDefault(); }
        if (key === 's' || e.key === 'ArrowDown') { keys.s = true; e.preventDefault(); }
        if (key === 'd' || e.key === 'ArrowRight') { keys.d = true; e.preventDefault(); }
    });

    document.addEventListener('keyup', function(e) {
        const key = e.key.toLowerCase();
        if (key === 'w' || e.key === 'ArrowUp') keys.w = false;
        if (key === 'a' || e.key === 'ArrowLeft') keys.a = false;
        if (key === 's' || e.key === 'ArrowDown') keys.s = false;
        if (key === 'd' || e.key === 'ArrowRight') keys.d = false;
    });

    // Button event handlers
    startButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', pauseGame);
    restartButton.addEventListener('click', restartGame);
    muteButton.addEventListener('click', toggleMute);

    // Initialize game
    init();
});