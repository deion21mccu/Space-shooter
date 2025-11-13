class Asteroid {
  constructor(game) {
    this.game = game;
    this.x = this.game.width;
    this.width = this.game.width >= 450 ? 859 / 8 : 859 / 8 / 2;
    this.height = this.game.width >= 450 ? 928 / 8 : 928 / 8 / 2;
    this.y = Math.random() * (this.game.height - this.height * 2) + this.height;
    this.sizeModifier = Math.random() * 2 + 0.5;
    this.image = document.getElementById("asteroid");
    this.rotationSpeed = Math.random() * 20 - 10;
    this.vx = Math.random() * 10 + 3;
    this.vy = Math.random() * 6 - 3;
    this.markedForDeletion = false;
    this.angle = 0;
  }
  update() {
    if (this.checkCollision()) {
      if (
        this.game.activeUpgrades.some((upgrade) => upgrade instanceof Shield)
      ) {
        this.vx *= -1;
        this.x -= this.vx;
        this.y += this.vy;
      } else {
        this.vx *= 1;
        this.game.asteroids.splice(this.game.asteroids.indexOf(this), 1);
        this.game.player.kill();
        this.game.explosions.push(
          new Explosion(
            this.game,
            this.x + this.width / 2,
            this.y + this.height / 2
          )
        );
      }
      return;
    }
    this.x -= this.vx;
    this.y += this.vy;
    this.angle += this.rotationSpeed;
    if (this.x < 0 - this.width) this.markedForDeletion = true;
  }
  draw(context) {
    context.save();
    context.translate(this.x, this.y);
    context.rotate((Math.PI / 180) * this.angle);
    context.drawImage(
      this.image,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );
    if (this.game.debugMode)
      context.strokeRect(
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
    context.restore();
  }
  checkCollision() {
    const ax = this.x - this.width / 2;
    const ay = this.y - this.height / 2;
    const aw = this.width;
    const ah = this.height;

    const bx = this.game.player.x;
    const by = this.game.player.y;
    const bw = this.game.player.width;
    const bh = this.game.player.height;

    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }
}
class Background {
  constructor(game) {
    this.game = game;
    this.y = 0;
    this.width = this.game.width;
    this.height = this.game.width;

    // 1. Load the new static background image (This is correct)
    this.staticImage = document.getElementById("static_background");

    // 2. This is the original code for the scrolling layers
    this.layers = [
      {
        image: document.getElementById(
          "nebula_" + ["red", "blue", "pink"][Math.floor(Math.random() * 3)]
        ),
        speed: 12,
        x: 0,
      },
      { image: document.getElementById("stars_big_1"), speed: 2, x: 0 },
      { image: document.getElementById("stars_big_2"), speed: 5, x: 0 },
      { image: document.getElementById("stars_small_1"), speed: 8, x: 0 },
      { image: document.getElementById("stars_small_2"), speed: 10, x: 0 },
    ];
  }

  update() {
    // This update logic only applies to the scrolling layers.
    // The static image doesn't need updating.
    this.layers.forEach((layer) => {
      // Update the width for the scrolling layers
      this.width = this.game.width;
      this.height = this.game.width;

      if (layer.x < -this.width) {
        layer.x = 0;
      } else {
        layer.x -= layer.speed;
      }
    });
  }

  draw(context) {
    // 3. Draw the static image first, so it's behind everything.
    
    // ⭐ THE FIX IS HERE ⭐
    // We add 'this.staticImage.complete' to make sure the image
    // has finished downloading before we try to draw it.
    // 'naturalHeight !== 0' is an extra check that it's not a broken file.
    if (
      this.staticImage &&
      this.staticImage.complete &&
      this.staticImage.naturalHeight !== 0
    ) {
      context.drawImage(
        this.staticImage,
        0,
        0,
        this.game.width,
        this.game.height
      );
    }

    // 4. Draw the original scrolling layers on top of it.
    this.layers.forEach((layer) => {
      context.drawImage(layer.image, layer.x, this.y, this.width, this.height);
      context.drawImage(
        layer.image,
        layer.x + this.width,
        this.y,
        this.width,
        this.height
      );
    });
  }
}
const types = [
  {
    image: document.getElementById("UFO"),
    height: 160 / 2,
    width: 160 / 2,
    bullet: document.getElementById("UFO_Bullet"),
    bulletWidth: 286 / 2,
    bulletHeight: 58 / 2,
  },
  {
    image: document.getElementById("Pixel_Alien"),
    height: 640 / 8,
    width: 640 / 8,
    bullet: document.getElementById("Pixel_Alien_Bullet"),
    bulletWidth: 1964 / 20,
    bulletHeight: 783 / 20,
  },
  {
    image: document.getElementById("Ship"),
    height: 840 / 10,
    width: 908 / 10,
    bullet: document.getElementById("Ship_Bullet"),
    bulletWidth: 890 / 15,
    bulletHeight: 500 / 15,
  },
];
class Enemy {
  constructor(game) {
    this.type = null;
    const rand = Math.random();
    if (rand < 0.33) this.type = types[0];
    // UFO
    else if (rand < 0.66) this.type = types[1];
    // Pixel Alien
    else if (rand < 1) this.type = types[2]; // Ship
    this.game = game;
    this.width = this.game.width >= 450 ? this.type.width : this.type.width / 2;
    this.height =
      this.game.width >= 450 ? this.type.height : this.type.height / 2;
    this.x = this.game.width;
    this.y = Math.random() * (this.game.height - this.height);
    this.markedForDeletion = false;
    this.image = this.type.image;
    this.bulletTimer = 0;
    this.bulletInterval = Math.random() * 500 + 250;
  }
  update() {
    this.x -= 2; // <--- DIFFICULTY: Changed from 3 to 2
    if (this.x < 0 - this.width) {
      this.markedForDeletion = true;
    }
    if (this.bulletTimer > this.bulletInterval) {
      if (!this.game.player.isDead && this.game.enemyShotMode)
        this.game.bullets.push(
          new EnemyBullet(
            this.game,
            this.game.width >= 450
              ? this.x - this.width
              : this.x - this.width / 2,
            this.y + this.height / 2,
            this.type
          )
        );
      this.bulletTimer = 0;
    } else {
      this.bulletTimer += 5;
    }
  }
  draw(context) {
    context.strokeStyle = "white";
    context.drawImage(this.image, this.x, this.y, this.width, this.height);
    if (this.game.debugMode)
      context.strokeRect(this.x, this.y, this.width, this.height);
  }
}
class EnemyBullet {
  constructor(game, x, y, type) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.width =
      this.game.width >= 450 ? type.bulletWidth : type.bulletWidth / 2;
    this.height =
      this.game.width >= 450 ? type.bulletHeight : type.bulletHeight / 2;
    this.image = type.bullet;
    this.speed = 5;
    this.markedForDeletion = false;
  }
  update() {
    if (this.checkCollision()) {
      if (
        !this.game.activeUpgrades.some((upgrade) => upgrade instanceof Shield)
      ) {
        // if no shield
        this.game.player.lives--;
      } else {
        this.speed *= -1;
        this.x -= -50;
        return;
      }
      if (this.game.player.lives <= 0) {
        this.game.player.kill();
      }
      this.markedForDeletion = true;
    }
    this.x -= this.speed;
    if (this.x < 0 - this.width) {
      this.markedForDeletion = true;
    }
  }
  draw(context) {
    context.drawImage(this.image, this.x, this.y, this.width, this.height);
  }
  checkCollision() {
    return (
      this.game.player.x < this.x + this.width &&
      this.game.player.x + this.game.player.width > this.x &&
      this.game.player.y < this.y + this.height &&
      this.game.player.y + this.game.player.height > this.y
    );
  }
}
class Explosion {
  constructor(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.spriteWidth = 512;
    this.spriteHeight = 512;
    this.width = this.spriteWidth / 1.5;
    this.height = this.spriteHeight / 1.5;
    this.image = document.getElementById("explosion");
    this.frameX = 0;
    this.frameY = 0;
    this.maxFrameX = 7;
    this.maxFrameY = 7;
  }
  update() {
    this.x -= this.game.speed;
    if (this.frameX > this.maxFrameX) {
      this.frameX = 0;
      if (this.frameY <= this.maxFrameY) this.frameY++;
      else this.remove();
    } else {
      this.frameX++;
    }
  }
  draw(context) {
    context.drawImage(
      this.image,
      this.frameX * this.spriteWidth,
      this.frameY * this.spriteHeight,
      this.spriteWidth,
      this.spriteHeight,
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    );
  }
  remove() {
    this.game.explosions.splice(this.game.explosions.indexOf(this), 1);
  }
}

class InputHandler {
  constructor(game, canvas) {
    this.game = game;
    this.mouseX = 50;
    this.mouseY = this.game.height / 2 - this.game.player.height / 2;
    this.keys = [];
    window.addEventListener("mousemove", (e) => {
      const boundingRect = canvas.getBoundingClientRect();
      this.mouseY = e.clientY - boundingRect.top;
      this.mouseX = e.clientX - boundingRect.left;
    });
    window.addEventListener("touchstart", (e) => {
      e.preventDefault();
      if (document.body.requestFullscreen) document.body.requestFullscreen();
      if (!this.keys.includes(" ")) this.keys.push(" ");
      for (const touch of e.touches) {
        const boundingRect = canvas.getBoundingClientRect();
        this.mouseY = touch.clientY - boundingRect.top - 100;
        this.mouseX = touch.clientX - boundingRect.left;
      }
    });
    window.addEventListener("touchend", (e) => {
      e.preventDefault();
      this.keys.splice(this.keys.indexOf(" "), 1);
      this.game.player.bulletTimer = this.game.player.bulletInterval + 1;
    });
    window.addEventListener("touchmove", (e) => {
      e.preventDefault();
      for (const touch of e.touches) {
        const boundingRect = canvas.getBoundingClientRect();
        this.mouseY = touch.clientY - boundingRect.top - 100;
        this.mouseX = touch.clientX - boundingRect.left;
      }
    });
    window.addEventListener("keydown", (e) => {
      // --- CONTROLS: Added 'w', 'a', 's', 'd' ---
      if (
        (e.key === " " ||
          e.key === "w" ||
          e.key === "a" ||
          e.key === "s" ||
          e.key === "d") &&
        this.keys.indexOf(e.key) === -1
      ) {
        this.keys.push(e.key);
      } else if (e.key === "g") { // <--- CONTROLS: Changed from 'd'
        this.game.debugMode = !this.game.debugMode;
        this.game.messages.push(
          new FloatingMessage(
            this.game,
            "TOGGLED   DEBUG   MODE",
            this.game.width / 2,
            this.game.height / 2
          )
        );
      } else if (e.key === "j") { // <--- CONTROLS: Changed from 'a'
        this.game.asteroidMode = !this.game.asteroidMode;
        this.game.messages.push(
          new FloatingMessage(
            this.game,
            "CHEAT:   ASTEROIDS   TOGGLED",
            this.game.width / 2,
            this.game.height / 2
          )
        );
      } else if (e.key === "e") {
        this.game.enemyShotMode = !this.game.enemyShotMode;
        this.game.messages.push(
          new FloatingMessage(
            this.game,
            "CHEAT:   ENEMY   SHOOTING   TOGGLED",
            this.game.width / 2,
            this.game.height / 2
          )
        );
      } else if (e.key === "k") { // <--- CONTROLS: Changed from 's'
        const shield = new Shield(this.game).getPower();
        this.game.messages.push(
          new FloatingMessage(
            this.game,
            "CHEAT:   SHIELD   ACTIVATED",
            this.game.width / 2,
            this.game.height / 2
          )
        );
      } else if (e.key === "b") {
        const biggun = new BigGun(this.game).getPower();
        this.game.messages.push(
          new FloatingMessage(
            this.game,
            "CHEAT:   FULL   AUTO   ACTIVATED",
            this.game.width / 2,
            this.game.height / 2
          )
        );
      } else if (e.key === "h") {
        this.game.player.lives = 15;
        this.game.messages.push(
          new FloatingMessage(
            this.game,
            "CHEAT:   HEALTH   RESTORED",
            this.game.width / 2,
            this.game.height / 2
          )
        );
      } else if (e.key === "p") { // <--- CONTROLS: Changed from 'k'
        this.game.messages.push(
          new FloatingMessage(
            this.game,
            "SELF DESTRUCT",
            this.game.width / 2,
            this.game.height / 2
          )
        );
        this.game.player.kill();
      }
    });
    window.addEventListener("keyup", (e) => {
      // --- CONTROLS: Added 'w', 'a', 's', 'd' ---
      if (
        e.key === " " ||
        e.key === "w" ||
        e.key === "a" ||
        e.key === "s" ||
        e.key === "d"
      ) {
        this.keys.splice(this.keys.indexOf(e.key), 1);
        if (e.key === " ")
          this.game.player.bulletTimer = this.game.player.bulletInterval + 1;
      }
    });
  }
}
class Player {
  constructor(game) {
    this.game = game;
    this.width = this.game.width >= 450 ? 64 : 48;
    this.height = this.game.width >= 450 ? 64 : 48;
    this.x = 70;
    this.y = this.game.height / 2 - this.height / 2;
    this.image = document.getElementById("player");
    this.vy = 0;
    this.vx = 0;
    this.bulletInterval = 200;
    this.bulletTimer = 0;
    this.lives = 25; // <--- DIFFICULTY: Increased from 15
    this.isDead = false;
  }
  update(mouseX, mouseY, keys) {
    // --- CONTROLS: Replaced mouse logic with WASD logic ---
    const moveSpeed = 8; // Adjust this value to change ship speed
    this.vx = 0; // Reset horizontal speed
    this.vy = 0; // Reset vertical speed

    if (keys.includes("w")) this.vy = -moveSpeed;
    if (keys.includes("s")) this.vy = moveSpeed;
    if (keys.includes("a")) this.vx = -moveSpeed;
    if (keys.includes("d")) this.vx = moveSpeed;

    // Apply movement
    this.y += this.vy;
    this.x += this.vx;
    // --- END OF WASD LOGIC ---

    // boundaries
    if (this.x < 0) this.x = 0;
    if (this.x > this.game.width - this.width)
      this.x = this.game.width - this.width;
    if (this.y < 0 - 25) this.y = 0 - 25;
    if (this.y > this.game.height - this.height + 15)
      this.y = this.game.height - this.height + 15;
      
    // shooting
    if (keys.includes(" ")) {
      if (this.bulletTimer > this.bulletInterval) {
        let bullet;
        if (
          this.game.activeUpgrades.some((upgrade) => upgrade instanceof BigGun)
        ) {
          bullet = new PlayerBullet(
            this.game,
            this.x + this.width - 30,
            this.y
          );
        } else {
          bullet = new PlayerBullet(
            this.game,
            this.x + this.width - 30,
            this.y + 33
          );
        }
        if (!this.isDead) this.game.bullets.push(bullet);
        this.bulletTimer = 0;
      } else {
        this.bulletTimer += 16;
      }
    }
    // upgrades
    this.game.upgrades.forEach((upgrade) => {
      if (
        upgrade.x < this.x + this.width &&
        upgrade.x + upgrade.width > this.x &&
        upgrade.y < this.y + this.height &&
        upgrade.y + upgrade.height > this.y
      ) {
        upgrade.markedForDeletion = true;
        if (
          !this.game.activeUpgrades.some(
            (activeUpgrade) =>
              activeUpgrade.constructor.name === upgrade.constructor.name
          )
        ) {
          // if the same upgrade is not active
          if (!this.isDead) {
            upgrade.getPower();
            this.game.messages.push(
              new FloatingMessage(
                this.game,
                upgrade.message,
                this.game.width / 2,
                this.game.height / 2
              )
            );
          }
        } else {
          upgrade.markedForDeletion = true;
        }
      }
    });
  }
  draw(context) {
    context.drawImage(this.image, this.x, this.y, this.width, this.height);
    const trail = new PlayerBullet(this.game);
    trail.width = this.game.width >= 450 ? 347 / 4 : 347 / 4 / 2;
    trail.height = this.game.width >= 450 ? 255 / 4 : 255 / 4 / 2;
    context.drawImage(
      trail.image,
      this.x - trail.width + 10,
      this.y + 5,
      trail.width,
      trail.height
    );
  }
  kill() {
    this.lives = 0;
    this.isDead = true;
    this.game.explosions.push(
      new Explosion(
        this.game,
        this.x + this.width / 2,
        this.y + this.height / 2
      )
    );
  }
}
class PlayerBullet {
  static baseWidth = 347 / 4;
  static baseHeight = 255 / 4;
  constructor(game, x, y) {
    this.x = x;
    this.y = y;
    this.width = PlayerBullet.baseWidth;
    this.height = PlayerBullet.baseHeight;
    this.game = game;
    this.speed = 20;
    this.markedForDeletion = false;
    this.image = document.getElementById("bullet");
  }
  update() {
    this.checkCollision();
    this.x += this.speed;
    if (this.x > this.game.width) {
      this.markedForDeletion = true;
    }
  }
  draw(context) {
    context.drawImage(
      this.image,
      this.x,
      this.y,
      this.width / 2,
      this.height / 2
    );
  }
  checkCollision() {
    // collision box is off, see Enemy.draw()
    this.game.enemies.forEach((enemy) => {
      if (
        enemy.x < this.x + this.width &&
        enemy.x + enemy.width > this.x &&
        enemy.y < this.y + this.height &&
        enemy.y + enemy.height > this.y
      ) {
        enemy.markedForDeletion = true;
        this.game.explosions.push(
          new Explosion(
            this.game,
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2
          )
        );
        this.markedForDeletion = true;
        this.game.score++;
      }
    });
  }
}
class UI {
  constructor(game) {
    this.game = game;
  }
  draw(context) {
    context.fillStyle = "red";
    context.font = "20px Orbitron";
    context.fillText(`Lifeforms Eliminated: ${this.game.score}`, 20, 20);
    context.fillText("Hull Integrity:", 20, 60);
    let xOffset = 20;
    if (this.game.player.lives > 0) {
      for (let i = 0; i < this.game.player.lives; i++) {
        context.drawImage(this.game.player.image, xOffset, 80);
        xOffset += 40;
      }
    } else {
      context.fillText("ERROR", xOffset, 90);
    }
  }
  drawGameOverMessages(context) {
    document.getElementById("restart").style.display = "block";
    context.save();
    context.textAlign = "center";
    const rightSize = this.game.width >= 1130;
    context.font = rightSize ? "50px Orbitron" : "30px Orbitron";
    context.fillStyle = "red";
    context.wrapText(
      "You Were Killed By the Alien Forces.",
      this.game.width / 2,
      this.game.height / 2 - 30,
      this.game.width,
      rightSize ? 50 : 30
    );
    context.font = rightSize ? "30px Orbitron" : "15px Orbitron";
    context.fillText(
      "Aliens Eliminated: " + this.game.score,
      this.game.width / 2,
      this.game.height / 2 + 30
    );
    context.restore();
  }
}
class FloatingMessage {
  constructor(game, value, x, y) {
    this.game = game;
    this.value = value;
    this.x = x;
    this.y = y;
    this.markedForDeletion = false;
    this.alpha = 1;
  }
  update() {
    this.alpha -= 0.01;
    if (this.alpha <= 0) this.markedForDeletion = true;
  }
  draw(context) {
    context.save();
    context.globalAlpha = this.alpha;
    context.font = "40px Orbitron";
    context.fillStyle = "red";
    context.textAlign = "center";
    context.fillText(this.value, this.x, this.y);
    context.restore();
  }
}
class HealthBox {
  constructor(game) {
    this.game = game;
    this.x = this.game.width;
    this.y = Math.random() * this.game.height;
    this.width = 566 / 4;
    this.height = 440 / 4;
    this.image = document.getElementById("healthbox");
    this.message = "+3 HEALTH";
    this.markedForDeletion = false;
  }
  update() {
    this.x -= this.game.speed;
  }
  draw(context) {
    context.drawImage(this.image, this.x, this.y, this.width, this.height);
  }
  getPower() {
    this.game.player.lives += 10;
    this.markedForDeletion = true;
  }
}
class Shield {
  constructor(game) {
    this.game = game;
    this.x = this.game.width;
    this.y = Math.random() * this.game.height;
    this.width = 556 / 4;
    this.height = 556 / 4;
    this.image = document.getElementById("shield");
    this.message = "SHIELD ACTIVE";
    this.activeX =
      this.game.player.x + this.game.player.width / 2 - this.width / 2;
    this.activeY =
      this.game.player.y + this.game.player.height / 2 - this.height / 2;
    this.active = false;
    this.markedForDeletion = false;
    this.activeMarkedForDeletion = false;
    this.timer = 0;
    this.interval = 15000; // 15 seconds of shield
  }
  update() {
    if (this.active) {
      // Update shield position to follow the player
      this.activeX =
        this.game.player.x + this.game.player.width / 2 - this.width / 2;
      this.activeY =
        this.game.player.y + this.game.player.height / 2 - this.height / 2;
      if (this.timer > this.interval) {
        this.activeMarkedForDeletion = true;
        this.active = false;
      } else {
        this.timer += 16; // delta time
      }
    } else {
      this.x -= this.game.speed;
    }
  }
  draw(context, x = this.x, y = this.y) {
    context.drawImage(this.image, x, y, this.width, this.height);
  }
  getPower() {
    this.markedForDeletion = true;
    this.game.activeUpgrades.push(this);
    this.active = true;
  }
}
class BigGun {
  constructor(game) {
    this.game = game;
    this.x = this.game.width;
    this.y = Math.random() * this.game.height;
    this.width = 348 / 4;
    this.height = 296 / 4;
    this.image = document.getElementById("big_gun");
    this.timer = 0;
    this.interval = 10000;
    this.active = false;
    this.markedForDeletion = false;
    this.activeMarkedForDeletion = false;
    this.message = "FULL AUTO POWER MODE";
  }
  update() {
    if (this.active) {
      this.markedForDeletion = true;
      if (this.timer > this.interval) {
        this.activeMarkedForDeletion = true;
        PlayerBullet.baseWidth = 400 / 4;
        PlayerBullet.baseHeight = 400 / 4;
        this.game.player.bulletInterval = 200;
        this.active = false;
      } else {
        this.timer += 16;
      }
    } else {
      this.x -= this.game.speed;
    }
  }
  draw(context) {
    if (this.active) return;
    context.drawImage(this.image, this.x, this.y, this.width, this.height);
  }
  getPower() {
    this.markedForDeletion = true;
    this.game.activeUpgrades.push(this);
    this.active = true;
    PlayerBullet.baseWidth = (347 / 4) * 3;
    PlayerBullet.baseHeight = (255 / 4) * 3;
    this.game.player.bulletInterval = 17;
  }
}
class Game {
  constructor(width, height, canvas) {
    this.width = width;
    this.height = height;
    this.player = new Player(this);
    this.inputHandler = new InputHandler(this, canvas);
    this.background = new Background(this);
    this.UI = new UI(this);
    this.enemies = [];
    this.bullets = [];
    this.asteroids = [];
    this.explosions = [];
    this.enemyTimer = 0;
    this.enemyInterval = 2000; // <--- DIFFICULTY: Increased from 1000
    this.asteroidTimer = 0;
    this.asteroidInterval = 3000; // <--- DIFFICULTY: Increased from 1000
    this.gameOver = false;
    this.speed = 3;
    this.score = 0;
    this.upgrades = [];
    this.upgradeTypes = [Shield, HealthBox, BigGun];
    this.upgradeTimer = 0;
    this.upgradeInterval = 10000; // 10000
    this.asteroidMode = false; // <--- DIFFICULTY: Changed from true
    this.enemyShotMode = false; // <--- DIFFICULTY: Changed from true
    this.messages = [];
    this.activeUpgrades = [];
  }
  update(deltaTime) {
    this.background.update();
    this.player.update(
      this.inputHandler.mouseX,
      this.inputHandler.mouseY,
      this.inputHandler.keys
    );
    if (this.enemyTimer > this.enemyInterval) {
      if (!this.player.isDead) this.addEnemy();
      this.enemyTimer = 0;
    } else this.enemyTimer += 16; // deltaTime ~ 16
    if (this.asteroidTimer > this.asteroidInterval) {
      if (!this.player.isDead && this.asteroidMode)
        this.asteroids.push(new Asteroid(this));
      this.asteroidTimer = 0;
    } else this.asteroidTimer += 16;
    if (this.upgradeTimer > this.upgradeInterval) {
      const RandomUpgrade = this.upgradeTypes[
        Math.floor(Math.random() * this.upgradeTypes.length)
      ];
      if (!this.player.isDead) this.upgrades.push(new RandomUpgrade(this));
      this.upgradeTimer = 0;
    } else {
      this.upgradeTimer += 16;
    }
    this.enemies.forEach((enemy) => {
      enemy.update();
      if (enemy.markedForDeletion)
        this.enemies.splice(this.enemies.indexOf(enemy), 1);
    });
    this.bullets.forEach((bullet) => {
      bullet.update();
      if (bullet.markedForDeletion)
        this.bullets.splice(this.bullets.indexOf(bullet), 1);
    });
    this.asteroids.forEach((asteroid) => {
      asteroid.update();
      if (asteroid.markedForDeletion)
        this.asteroids.splice(this.asteroids.indexOf(asteroid), 1);
    });
    this.explosions.forEach((explosion) => {
      explosion.update();
    });
    this.upgrades.forEach((upgrade) => {
      upgrade.update();
      if (upgrade.markedForDeletion)
        this.upgrades.splice(this.upgrades.indexOf(upgrade), 1);
    });
    this.activeUpgrades.forEach((upgrade) => {
      upgrade.update();
      if (upgrade.activeMarkedForDeletion)
        this.activeUpgrades.splice(this.activeUpgrades.indexOf(upgrade), 1);
    });
    this.messages.forEach((message) => {
      message.update();
      if (message.markedForDeletion)
        this.messages.splice(this.messages.indexOf(message), 1);
    });
  }
  draw(context) {
    this.background.draw(context);
    this.enemies.forEach((enemy) => {
      enemy.draw(context);
    });
    if (!this.player.isDead) this.player.draw(context);
    else {
      this.messages = [];
      this.activeUpgrades = [];
      this.bullets = [];
      if (this.explosions.length === 0 && this.bullets.length === 0) {
        this.gameOver = true;
        this.UI.drawGameOverMessages(context);
      }
    }
    this.bullets.forEach((bullet) => {
      bullet.draw(context);
    });
    this.asteroids.forEach((asteroid) => {
      asteroid.draw(context);
    });
    this.explosions.forEach((explosion) => {
      explosion.draw(context);
    });
    this.upgrades.forEach((upgrade) => {
      upgrade.draw(context);
    });
    this.messages.forEach((message) => {
      message.draw(context);
    });
    this.activeUpgrades.forEach((upgrade) => {
      upgrade.draw(context, upgrade.activeX, upgrade.activeY);
    });
    this.UI.draw(context);
  }
  addEnemy() {
    this.enemies.push(new Enemy(this));
  }
}
let game, canvas, ctx;
window.addEventListener("load", () => {
  canvas = document.getElementById("canvas1");
  canvas.addEventListener("click", () => {
    if (document.body.requestFullscreen) document.body.requestFullscreen();
    else document.body.webkitEnterFullscreen();
    screen.orientation.lock("landscape").then(() => {
      console.log("Screen orientation locked to landscape.");
      if (this.game.width < 450) {
        canvas.width = window.innerHeight - 50;
        canvas.height = window.innerWidth - 50;
        game.width = canvas.width;
        game.height = canvas.height;
      }
    });
  });
  ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth - 50;
  canvas.height = window.innerHeight - 50;

  game = new Game(canvas.width, canvas.height, canvas);

  animate();
});
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.width = window.innerWidth - 50;
  canvas.height = window.innerHeight - 50;
  game.width = canvas.width;
  game.height = canvas.height;
  game.update();
  game.draw(ctx);
  if (!game.gameOver) requestAnimationFrame(animate);
}
function restart() {
  document.getElementById("restart").style.display = "none";
  canvas.width = window.innerWidth - 50;
  canvas.height = window.innerHeight - 50;
  game = new Game(canvas.width, canvas.height, canvas);
  animate();
}
CanvasRenderingContext2D.prototype.wrapText = function (
  text,
  x,
  y,
  maxWidth,
  lineHeight
) {
  let lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    let words = lines[i].split(" ");
    let line = "";

    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + " ";
      let metrics = this.measureText(testLine);
      let testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        this.fillText(line, x, y);
        line = words[n] + " ";
        y += lineHeight;
      } else {
        line = testLine;
      }
    }

    this.fillText(line, x, y);
    y += lineHeight;
  }
};
