window.addEventListener('load', function () {
    // canvas setup
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 1000;
    canvas.height = 500;
    const fullScreenButton = document.getElementById('fullScreenButton');

    class InputHandler {
        constructor(game) {
            this.game = game;
            this.shootEffect = new Audio();
            this.shootEffect.src = './audio/laser1.wav';
            this.shootEffect.volume = 0.4;
            this.touchX = '';
            this.touchY = '';
            this.touchTreshold = 30;
            window.addEventListener('keydown', e => {
                if ((e.key === 'ArrowUp' || e.key === 'w') && this.game.keys.indexOf('ArrowUp') === -1) {
                    this.game.keys.push('ArrowUp');
                }
                if ((e.key === 'ArrowDown' || e.key === 's') && this.game.keys.indexOf('ArrowDown') === -1) {
                    this.game.keys.push('ArrowDown');
                }
                if (e.key === ' ' && !this.game.gameOver) {
                    this.game.isUserInteracted = true;
                    this.game.player.shootTop();
                    this.shootEffect.play();
                }
                if (e.key === 'd') {
                    this.game.debug = !this.game.debug;
                }
            });
            window.addEventListener('keyup', e => {
                if ((e.key === 'ArrowUp' || e.key === 'w') && this.game.keys.indexOf('ArrowUp') > -1) {
                    this.game.keys.splice(this.game.keys.indexOf('ArrowUp'), 1);
                }
                if ((e.key === 'ArrowDown' || e.key === 's') && this.game.keys.indexOf('ArrowDown') > -1) {
                    this.game.keys.splice(this.game.keys.indexOf('ArrowDown'), 1);
                }
            });

            window.addEventListener('touchstart', e => {
                [...e.changedTouches].forEach(touch => {
                    if (touch.pageX < this.game.width * 0.35 && !this.game.gameOver) {
                        this.game.player.shootTop();
                        this.shootEffect.play();
                    };
                    if (touch.pageX > this.game.width * 0.5) {
                        this.touchX = touch.pageX;
                        this.touchY = touch.pageY;
                    };
                });
    
            });
            window.addEventListener('touchmove', e => {
                let swipeDistanceX = 0;
                let swipeDistanceY = 0;
                [...e.changedTouches].forEach(touch => {
                    if (touch.pageX > this.game.width * 0.5) {
                        swipeDistanceX = touch.pageX - this.touchX;
                        swipeDistanceY = touch.pageY - this.touchY;
                    };
                });
                if (swipeDistanceY < -this.touchTreshold && this.game.keys.indexOf('ArrowUp') === -1) this.game.keys.push('ArrowUp');
                if (swipeDistanceY > this.touchTreshold && this.game.keys.indexOf('ArrowDown') === -1) this.game.keys.push('ArrowDown');
            });
            window.addEventListener('touchend', e => {
                if (this.game.keys.indexOf('ArrowUp') !== -1) this.game.keys.splice(this.game.keys.indexOf('ArrowUp'), 1);
                if (this.game.keys.indexOf('ArrowDown') !== -1) this.game.keys.splice(this.game.keys.indexOf('ArrowDown'), 1);
            });
        }
    }

    class Projectile {
        constructor(game, x, y) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.width = 10;
            this.height = 3;
            this.speed = 3;
            this.markedForDeletion = false;
            this.image = projectile;
        }
        update() {
            this.x += this.speed;
            if (this.x > this.game.width * 0.8) this.markedForDeletion = true;
        }
        draw(context) {
            context.drawImage(this.image, this.x, this.y);
        }
    }

    class Particle {
        constructor(game, x, y) {
            this.game = game;
            this.x = x;
            this.y = y;
            this.image = gears;
            this.frameX = Math.floor(Math.random() * 3);
            this.frameY = Math.floor(Math.random() * 3);
            this.spriteSize = 50;
            this.sizeModifier = (Math.random() * 0.5 + 0.5).toFixed(1);
            this.size = this.spriteSize * this.sizeModifier;
            this.speedX = Math.random() * 6 - 3;
            this.speedY = Math.random() * -15;
            this.gravity = 0.5;
            this.markedForDeletion = false;
            this.angle = 0;
            this.va = Math.random() * 0.2 - 0.1;
            this.bounced = 0;
            this.bottomBounceBoundary = Math.random() * 80 + 60;
        }
        update() {
            this.angle += this.va;
            this.speedY += this.gravity;
            this.x -= this.speedX + this.game.speed;
            this.y += this.speedY;
            if (this.y > this.game.height + this.size || this.x < 0 - this.size) this.markedForDeletion = true;
            if (this.y > this.game.height - this.bottomBounceBoundary && this.bounced < 2) {
                this.bounced++;
                this.speedY *= -0.5;
            }
        }
        draw(context) {
            context.save();
            context.translate(this.x, this.y);
            context.rotate(this.angle);
            context.drawImage(this.image, this.frameX * this.spriteSize, this.frameY * this.spriteSize, this.spriteSize, this.spriteSize, this.size * -0.5, this.size * -0.5, this.size, this.size);
            context.restore();
        }
    }

    class Player {
        constructor(game) {
            this.game = game;
            this.width = 120;
            this.height = 190;
            this.x = 20;
            this.y = 100;
            this.frameX = 0;
            this.frameY = 0;
            this.maxFrame = 37;
            this.speedY = 0;
            this.maxSpeed = 3;
            this.projectiles = [];
            this.image = player;
            this.powerUp = false;
            this.powerUpTimer = 0;
            this.powerUpLimit = 10000;
            this.powerUpSound = new Audio();
            this.powerUpSound.src = './audio/powerupGet.wav';
            this.powerUpLostSound = new Audio();
            this.powerUpLostSound.src = './audio/powerupLost.wav';
        }
        restart() {
            this.y = 100;
            this.powerUp = false;
        }
        update(deltaTime) {
            if (this.game.keys.includes('ArrowUp')) this.speedY = -this.maxSpeed;
            else if (this.game.keys.includes('ArrowDown')) this.speedY = this.maxSpeed;
            else this.speedY = 0;
            this.y += this.speedY;
            // vertical boundaries
            if (this.y > this.game.height - this.height * 0.5) this.y = this.game.height - this.height * 0.5;
            else if (this.y < -this.height * 0.5) this.y = -this.height * 0.5;
            // handle projectiles
            this.projectiles.forEach(projectile => {
                projectile.update();
            });
            this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);
            // sprite animation
            if (this.frameX < this.maxFrame) {
                this.frameX++;
            } else {
                this.frameX = 0;
            }
            // power up
            if (this.powerUp) {
                if (this.powerUpTimer > this.powerUpLimit) {
                    this.powerUpTimer = 0;
                    this.powerUp = false;
                    this.frameY = 0;
                    this.powerUpLostSound.play();
                    setTimeout(() => {
                       this.powerUpLostSound.pause();
                       this.powerUpLostSound.currentTime = 0; 
                    }, 1500);
                } else {
                    this.powerUpTimer += deltaTime;
                    this.frameY = 1;
                    this.game.ammo += 0.1;
                }
            }
        }
        draw(context) {
            if (this.game.debug) context.strokeRect(this.x, this.y, this.width, this.height);
            this.projectiles.forEach(projectile => {
                projectile.draw(context);
            });
            context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width, this.height, this.x, this.y, this.width, this.height)
        }
        shootTop() {
            if (this.game.ammo > 0) {
                this.projectiles.push(new Projectile(this.game, this.x + 80, this.y + 30));
                this.game.ammo--;
            };
            if (this.powerUp) this.shootBottom();
        }
        shootBottom() {
            if (this.game.ammo > 0) {
                this.projectiles.push(new Projectile(this.game, this.x + 80, this.y + 175));
            };
        }
        enterPowerUp() {
            this.powerUpTimer = 0;
            this.powerUp = true;
            if (this.game.ammo < this.game.maxAmmo) this.game.ammo = this.game.maxAmmo;
            this.powerUpSound.play();
        }
    }

    class Enemy {
        constructor(game) {
            this.game = game;
            this.x = this.game.width;
            this.speedX = Math.random() * -1.5 - 0.5; // random number between -0.5 and -2
            this.markedForDeletion = false;
            this.frameX = 0;
            this.frameY = 0;
            this.maxFrame = 37;
        }
        update() {
            this.x += this.speedX - this.game.speed;
            if (this.x + this.width < 0) this.markedForDeletion = true;
            // sprite animation
            if (this.frameX < this.maxFrame) {
                this.frameX++;
            } else this.frameX = 0;
        }
        draw(context) {
            if (this.game.debug) context.strokeRect(this.x, this.y, this.width, this.height);
            context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width, this.height, this.x, this.y, this.width, this.height);
            if (this.game.debug) {
                context.font = '20px Helvetica';
                context.fillText(this.lives, this.x, this.y);
            };
        }
    }

    class Angler1 extends Enemy {
        constructor(game) {
            super(game);
            this.width = 228;
            this.height = 169;
            this.y = Math.random() * (this.game.height * 0.95 - this.height);
            this.image = angler1;
            this.frameY = Math.floor(Math.random() * 3);
            this.lives = 5;
            this.score = this.lives;
        }
    }

    class Angler2 extends Enemy {
        constructor(game) {
            super(game);
            this.width = 213;
            this.height = 165;
            this.y = Math.random() * (this.game.height * 0.95 - this.height);
            this.image = angler2;
            this.frameY = Math.floor(Math.random() * 2);
            this.lives = 6;
            this.score = this.lives;
        }
    }

    class LuckyFish extends Enemy {
        constructor(game) {
            super(game);
            this.width = 99;
            this.height = 95;
            this.y = Math.random() * (this.game.height * 0.95 - this.height);
            this.image = lucky;
            this.frameY = Math.floor(Math.random() * 2);
            this.lives = 5;
            this.score = 15;
            this.type = 'lucky';
        }
    }

    class HiveWhale extends Enemy {
        constructor(game) {
            super(game);
            this.width = 400;
            this.height = 227;
            this.y = Math.random() * (this.game.height * 0.95 - this.height);
            this.image = hivewhale;
            this.frameY = 0;
            this.lives = 20;
            this.score = 15;
            this.type = 'hive';
            this.speedX = Math.random() * -1.2 - 0.2;
        }
    }

    class Drone extends Enemy {
        constructor(game, x, y) {
            super(game);
            this.width = 115;
            this.height = 95;
            this.x = x;
            this.y = y;
            this.image = drone;
            this.frameY = Math.floor(Math.random() * 2);
            this.lives = 3;
            this.score = this.lives;
            this.type = 'drone';
            this.speedX = Math.random() * -4.2 - 0.5;
        }
    }

    class Layer {
        constructor(game, image, speedModifier) {
            this.game = game;
            this.image = image;
            this.speedModifier = speedModifier;
            this.width = 1768;
            this.height = 500;
            this.x = 0;
            this.y = 0;
        }
        restart() {
            this.x = 0;
        }
        update() {
            if (this.x <= -this.width) this.x = 0;
            this.x -= this.game.speed * this.speedModifier;
        }
        draw(context) {
            context.drawImage(this.image, this.x, this.y);
            context.drawImage(this.image, this.x + this.width, this.y);
        }
    }

    class Background {
        constructor(game) {
            this.game = game;
            this.image1 = layer1;
            this.image2 = layer2;
            this.image3 = layer3;
            this.image4 = layer4;
            this.layer1 = new Layer(this.game, this.image1, 0.2);
            this.layer2 = new Layer(this.game, this.image2, 0.4);
            this.layer3 = new Layer(this.game, this.image3, 1);
            this.layer4 = new Layer(this.game, this.image4, 1.5);
            this.layers = [this.layer1, this.layer2, this.layer3];
        }
        restart() {
            this.layers.forEach(layer => {
                layer.restart();
            });
            this.layer4.restart();
        }
        update() {
            this.layers.forEach(layer => layer.update());
        }
        draw(context) {
            this.layers.forEach(layer => layer.draw(context));
        }
    }

    class Explosion {
        constructor(game, x, y) {
            this.game = game;
            this.frameX = 0;
            this.spriteWidth = 200;
            this.spriteHeight = 200;
            this.width = this.spriteWidth;
            this.height = this.spriteHeight;
            this.x = x - this.width * 0.5;
            this.y = y - this.height * 0.5;
            this.fps = 25;
            this.timer = 0;
            this.interval = 1000 / this.fps;
            this.markedForDeletion = false;
            this.maxFrame = 8;
        }
        update(deltaTime) {
            this.x -= this.game.speed;
            if (this.timer > this.interval) {
                this.frameX++;
                this.timer = 0;
            } else {
                this.timer += deltaTime;
            }
            if (this.frameX > this.maxFrame) this.markedForDeletion = true;
        }
        draw(context) {
            context.drawImage(this.image, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
        }
    }

    class SmokeExplosion extends Explosion {
        constructor(game, x, y) {
            super(game, x, y);
            this.image = smokeExplosion;
        }
    }

    class FireExplosion extends Explosion {
        constructor(game, x, y) {
            super(game, x, y);
            this.image = fireExplosion;
        }
    }

    class UI {
        constructor(game) {
            this.game = game;
            this.fontSize = 25;
            this.fontFamily = 'Bangers';
            this.color = 'white';
            this.winningMusic = new Audio();
            this.winningMusic.src = './audio/gameOverWin.wav';
            this.losingMusic = new Audio();
            this.losingMusic.src = './audio/gameOverFail.mp3';
        }
        draw(context) {
            context.save();
            context.fillStyle = this.color;
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
            context.shadowColor = 'black';
            context.font = this.fontSize + 'px ' + this.fontFamily;
            // score
            context.fillText('Score: ' + this.game.score, 20, 40);
            // timer
            const formattedTime = (this.game.gameTime * 0.001).toFixed(1);
            context.fillText('Timer: ' + formattedTime, 20, 100);
            // game over messages
            if (this.game.gameOver) {
                context.textAlign = 'center';
                let message1;
                let message2;
                if (this.game.score > this.game.winningScore) {
                    message1 = 'Most Wondrous!';
                    message2 = 'Well done explorer!';
                    this.winningMusic.currentTime = 0.5;
                    this.winningMusic.play();
                    setTimeout(() => {
                        this.winningMusic.pause();
                    }, 5000);
                    this.winningMusic.currentTime = 0.5;
                } else {
                    message1 = 'Blazes!';
                    message2 = 'Get my repair kit and try again!';
                    this.losingMusic.play();
                    setTimeout(() => {
                       this.losingMusic.pause(); 
                    }, 5000);
                    this.losingMusic.currentTime = 0;
                }
                context.font = '70px ' + this.fontFamily;
                context.fillText(message1, this.game.width * 0.5, this.game.height * 0.5 - 20);
                context.font = '25px ' + this.fontFamily;
                context.fillText(message2, this.game.width * 0.5, this.game.height * 0.5 + 20);
                context.font = '20px ' + this.fontFamily;
                context.fillText('Hit Enter or touch the screen to restart!', this.game.width * 0.5, this.game.height * 0.5 + 40);
            } else if (!this.gameOver && !this.game.isUserInteracted) {
                context.font = '45px ' + this.fontFamily;
                context.fillText('PC controls:', this.game.width * 0.3, this.game.height * 0.3 - 20);
                context.font = '25px ' + this.fontFamily;
                context.fillText('Press arrows or W/S to move up or down,', this.game.width * 0.3, this.game.height * 0.3 + 20);
                context.fillText('Press space to shoot', this.game.width * 0.3, this.game.height * 0.3 + 45);
                context.font = '45px ' + this.fontFamily;
                context.fillText('Mobile controls:', this.game.width * 0.3, this.game.height * 0.5);
                context.font = '25px ' + this.fontFamily;
                context.fillText('Swip up or down on the right half of the screen to move,', this.game.width * 0.3, this.game.height * 0.5 + 40);
                context.fillText('Press the left third of the screen to shoot', this.game.width * 0.3, this.game.height * 0.5 + 65);
            }
            // ammo
            if (this.game.player.powerUp) context.fillStyle = '#ffffbd';
            for (let i = 0; i < this.game.ammo; i++) {
                context.fillRect(20 + 5 * i, 50, 3, 20);
            }
            context.restore();
        }
    }

    class Game {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.background = new Background(this);
            this.player = new Player(this);
            this.input = new InputHandler(this);
            this.ui = new UI(this);
            this.keys = [];
            this.enemies = [];
            this.particles = [];
            this.explosions = [];
            this.enemyTimer = 0;
            this.enemyInterval = 2000;
            this.ammo = 20;
            this.maxAmmo = 50;
            this.ammoTimer = 0;
            this.ammoInterval = 350;
            this.gameOver = false;
            this.score = 0;
            this.winningScore = 45;
            this.gameTime = 0;
            this.timeLimit = 30000;
            this.speed = 1;
            this.bgMusic = new Audio();
            this.bgMusic.src = './audio/bgmusic.mp3';
            this.shotDownDeath = new Audio();
            this.shotDownDeath.src = './audio/shotDownDeath.wav';
            this.hiveShotDownDeath = new Audio();
            this.hiveShotDownDeath.src = './audio/hiveShotDownDeath.flac';
            this.collision = new Audio();
            this.collision.src = './audio/collision.wav';
            this.debug = false;
            this.isUserInteracted = false;
        }
        restart() {
            this.keys = [];
            this.enemies = [];
            this.particles = [];
            this.explosions = [];
            this.enemyTimer = 0;
            this.ammo = 20;
            this.ammoTimer = 0;
            this.score = 0;
            this.debug = false;
            this.isUserInteracted = false;
            this.gameTime = 0;
        }
        update(deltaTime) {
            if (!this.gameOver) this.gameTime += deltaTime;
            if (this.gameTime > this.timeLimit) this.gameOver = true;
            this.background.update();
            this.background.layer4.update();
            this.player.update(deltaTime);
            if (this.ammoTimer > this.ammoInterval) {
                if (this.ammo < this.maxAmmo) this.ammo++;
                this.ammoTimer = 0;
            } else {
                this.ammoTimer += deltaTime;
            }
            this.particles.forEach(particle => particle.update());
            this.particles = this.particles.filter(particle => !particle.markedForDeletion);
            this.explosions.forEach(explosion => explosion.update(deltaTime));
            this.explosions = this.explosions.filter(explosion => !explosion.markedForDeletion);
            this.enemies.forEach(enemy => {
                enemy.update();
                // player collide with enemy
                if (this.checkCollisions(this.player, enemy)) {
                    enemy.markedForDeletion = true;
                    this.addExplosion(enemy);
                    for (let i = 0; i < enemy.score; i++) {
                        this.particles.push(new Particle(this, enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5));
                    };
                    if (enemy.type !== 'lucky') this.collision.play();
                    if (enemy.type === 'lucky') {
                        this.player.enterPowerUp();
                    } else if (!this.gameOver) {
                        if (enemy.type === 'hive') this.score -= 15;
                        else this.score--;
                    }
                };
                // projectile hits enemy
                this.player.projectiles.forEach(projectile => {
                    if (this.checkCollisions(projectile, enemy)) {
                        enemy.lives--;
                        projectile.markedForDeletion = true;
                        this.particles.push(new Particle(this, enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5));
                        if (enemy.lives <= 0) {
                            for (let i = 0; i < enemy.score; i++) {
                                this.particles.push(new Particle(this, enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5));
                            }
                            enemy.markedForDeletion = true;
                            this.addExplosion(enemy);
                            if (enemy.type !== 'hive') {
                                this.shotDownDeath.volume = 0.35;
                                this.shotDownDeath.play();
                                setTimeout(() => {
                                   this.shotDownDeath.pause();
                                   this.shotDownDeath.currentTime = 0;
                                }, 650);
                            };
                            if (enemy.type === 'hive') {
                                for (let i = 0; i < 5; i++) {
                                    this.enemies.push(new Drone(this, enemy.x + Math.random() * enemy.width, enemy.y + Math.random() * enemy.height * 0.5));
                                };
                                this.hiveShotDownDeath.play();
                            };
                            if (!this.gameOver) this.score += enemy.score;
                        }
                    }
                })
            });
            this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
            if (this.enemyTimer > this.enemyInterval && !this.gameOver) {
                this.addEnemy();
                this.enemyTimer = 0;
            } else {
                this.enemyTimer += deltaTime;
            }
        }
        draw(context) {
            this.background.draw(context);
            this.ui.draw(context);
            this.player.draw(context);
            this.particles.forEach(particle => particle.draw(context));
            this.enemies.forEach(enemy => {
                enemy.draw(context);
            });
            this.explosions.forEach(explosion => {
                explosion.draw(context);
            });
            this.background.layer4.draw(context);
        }
        addEnemy() {
            const randomize = Math.random();
            if (randomize < 0.3) this.enemies.push(new Angler1(this));
            else if (randomize < 0.6) this.enemies.push(new Angler2(this));
            else if (randomize < 0.7) this.enemies.push(new HiveWhale(this));
            else this.enemies.push(new LuckyFish(this));
        }
        addExplosion(enemy) {
            const randomize = Math.random();
            if (randomize < 0.5) this.explosions.push(new SmokeExplosion(this, enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5));
            else this.explosions.push(new FireExplosion(this, enemy.x + enemy.width * 0.5, enemy.y + enemy.height * 0.5));
        }
        checkCollisions(rect1, rect2) {
            return (
                rect1.x < rect2.x + rect2.width &&
                rect1.x + rect1.width > rect2.x &&
                rect1.y < rect2.y + rect2.height &&
                rect1.height + rect1.y > rect2.y
            )
        }
    }

    function restartGame() {
        game.gameOver = false;
        game.restart();
        game.background.restart();
        game.player.restart();
        game.ui.winningMusic.pause();
        game.ui.winningMusic.currentTime = 0.5;
        game.ui.losingMusic.pause();
        game.ui.losingMusic.currentTime = 0;
        animate(0);
    };

    function toggleFullScreen() {
        if (!document.fullscreenElement) {
            canvas.requestFullscreen().catch(err => {
                alert(`Error, can't enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    fullScreenButton.addEventListener('click', toggleFullScreen);

    window.addEventListener('keydown', e => {
        if (game.gameOver && e.key === 'Enter') restartGame();
    });

    window.addEventListener('touchstart', e => {
        if (e.changedTouches && game.gameOver) {
            restartGame();
        }
    });

    const game = new Game(canvas.width, canvas.height);
    let lastTime = 0;

    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // start the game upon user interaction
        if (game.isUserInteracted) game.update(deltaTime);
        game.draw(ctx);
        if (!game.gameOver) {
            if (game.keys.length > 0) {
                game.isUserInteracted = true;
                game.bgMusic.play();
            };
            requestAnimationFrame(animate);
        };
        // upon game over erase every enemy and projectile
        if (game.gameOver) {
            game.keys = [];
            game.enemies = [];
            game.particles = [];
            game.explosions = [];
            game.player.projectiles = [];
            game.bgMusic.pause();
            game.bgMusic.currentTime = 0;
        };
    }
    animate(0);

});