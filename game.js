let assetsLoader = {
    "player": "assets/player1.png",
    "platform": "assets/platform.png",
    "nail": "assets/nail2.png",
    "background": "assets/background6.jpg"
    
};
let soundsLoader = {
    "background": "audio/background.mp3"
};
const title = "SPIKE FLIGHT";
const description = "Stack as much as you can";
const instructions = "Use left and right arrow key";

class NailWallEscapeGame extends Phaser.Scene {
    constructor() {
        super('NailWallEscapeGame');
        this.player = null;
        this.platforms = null;
        this.cursors = null;
        this.nailWall = null;
        this.score = 0;
        this.scoreText = null;
        this.backgroundSpeed = 1;
        this.lastPlatformY = 0;
        this.playerOnPlatform = null;
        this.gameIsOver =false;
    }

    preload() {
        for(const key in soundsLoader){
            this.load.audio(key,[soundsLoader[key]]);
        }
        for (const key in assetsLoader) {
            this.load.image(key, assetsLoader[key]);
        }
    }

    create() {
        
        // Create scrolling background
        this.background = this.add.tileSprite(400, 300, 800, 600, 'background');

        // Create nail wall at the top
        this.nailWall = this.physics.add.staticGroup();
        for (let i = 0; i < 20; i++) {
            this.nailWall.create(i * 40, 20, 'nail').setScale(0.5);
        }

        // Create platforms group
        this.platforms = this.physics.add.group();

        // Create player
        this.player = this.physics.add.sprite(400, 300, 'player');
        this.player.setCollideWorldBounds(false);

        // Set up collision
        this.physics.add.collider(this.player, this.nailWall, this.gameOver, null, this);

        // Set up controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Add score text
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#fff' });

        // Initial platform
        this.createPlatform(400, 500);

        // Regular platform creation with increased frequency
        this.time.addEvent({
            delay: 1000,
            callback: this.createPlatformSequence,
            callbackScope: this,
            loop: true
        });

        // Timer for updating score
        this.time.addEvent({
            delay: 1000,
            callback: this.updateScore,
            callbackScope: this,
            loop: true
        });
        // Sound
        for (const key in soundsLoader) {
            this.sound.add(key, {loop: false, volume: 0.5});
        }
        // Play background music
        this.sound.play('background');
    }
    
    

    update() {
        // Scroll background
        this.background.tilePositionY -= this.backgroundSpeed;

        // Handle player movement
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-170);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(170);
        } else {
            this.player.setVelocityX(0);
        }

        // Jump
        if (this.cursors.up.isDown && this.playerOnPlatform) {
            this.player.setVelocityY(-330);
            this.playerOnPlatform = null;
        }

        // Apply gravity if not on platform
        if (!this.playerOnPlatform) {
            this.player.setVelocityY(this.player.body.velocity.y + 3);
        } else {
            // Move with the platform
            this.player.y = this.playerOnPlatform.y - this.playerOnPlatform.displayHeight / 2 - this.player.displayHeight / 2;
            this.player.setVelocityY(this.playerOnPlatform.body.velocity.y);
        }

        // Move platforms up and check for player collision
        this.platforms.children.entries.forEach(platform => {
            platform.y -= this.backgroundSpeed;
            platform.body.setVelocityY(-this.backgroundSpeed * 60);

            if (platform.y < -100) {
                platform.destroy();
            }

            // Check if player is on this platform
            if (this.player.y <= platform.y - platform.displayHeight / 2 &&
                this.player.y >= platform.y - platform.displayHeight / 2 - this.player.displayHeight &&
                this.player.x >= platform.x - platform.displayWidth / 2 &&
                this.player.x <= platform.x + platform.displayWidth / 2) {
                this.playerOnPlatform = platform;
            }
        });

        // Reset playerOnPlatform if player is not on any platform
        if (this.playerOnPlatform &&
            (this.player.x < this.playerOnPlatform.x - this.playerOnPlatform.displayWidth / 2 ||
             this.player.x > this.playerOnPlatform.x + this.playerOnPlatform.displayWidth / 2)) {
            this.playerOnPlatform = null;
        }

        // Check if player has fallen off the screen
        if (this.player.y > 670) {
            this.gameOver();
        }
        this.nailWall.getChildren().forEach(nail => {
            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, nail.x, nail.y);
            if (distance < 0) { // Adjust this value to change the killing distance
                this.gameOver();
            }
        });
    }

    createPlatform(x, y) {
        const platform = this.physics.add.sprite(x, y, 'platform');
        platform.setScale(3, 0.3);
        platform.setImmovable(true);
        platform.body.allowGravity = false;
        this.platforms.add(platform);
        return platform;
    }

    createPlatformSequence() {
        const minGap = 80;
        const maxGap = 120;
        const minX = 100;
        const maxX = 700;

        const platformCount = Phaser.Math.Between(3, 4);

        for (let i = 0; i < platformCount; i++) {
            const gap = Phaser.Math.Between(minGap, maxGap);
            this.lastPlatformY += gap;

            const x = Phaser.Math.Between(minX, maxX);

            this.createPlatform(x, 650 + this.lastPlatformY);
        }
    }

    updateScore() {
        if(!this.gameIsOver){
            this.score +=1;
            this.scoreText.setText(`Score: ${this.score}`);
        }
        this.score += 1;
        this.scoreText.setText(`Score: ${this.score}`);
    }

    gameOver() {
        if (this.gameIsOver) return; // Prevent multiple calls
    
        this.gameIsOver = true;
        this.physics.pause();
        this.player.setTint(0xff0000);
        
        // Stop the sound
        this.sound.stopAll();
        
        // Display game over message
        this.add.text(400, 300, 'Game Over', { fontSize: '64px', fill: '#ff0000' }).setOrigin(0.5);
        
        // Display final score
        this.add.text(400, 350, `Final Score: ${this.score}`, { fontSize: '32px', fill: '#ffffff' }).setOrigin(0.5);
        
        // Remove all timers and events
        this.time.removeAllEvents();
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 690,
    backgroundColor: '#4488aa',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: NailWallEscapeGame
};

const game = new Phaser.Game(config);
