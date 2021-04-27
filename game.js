class Game
{
	constructor(ctx)
	{
		this.ctx = ctx;
		this.keys = {"w": false, "a": false, "s": false, "d": false};
		this.mouseDown = false;
		this.mousePos = {x: 0, y: 0};
		this.paused = false;

		this.miningBots = [];
		this.miningFlags = [];

		this.pathfindingNodes = [];

		this.world = new World();
		this.createWorldWalls();
		this.player = new Player(0, 0);
		this.spawn = null;
		this.findPlayerSpawn();
		this.fixOres();
		this.createPathfindingNodes();
		this.inventory = {copper: 0, electronium: 0, firite: 0, radium: 0};
		this.enemies = new EnemyManager(this);

		this.targetFPS = 60;
		this.lastFrameTime = new Date().getTime();
		this.frameTimes = [];
		this.itemSelected = null;
		this.blackTimeout = 0;
		this.blackCircle = true;
		this.gameOver = false;

		this.placeTimer = 0;

		this.message = "";
		this.messageTime = 0;

		this.assets = {
			wall: this.loadImage("assets/wall.png"),
			miningbot: this.loadImage("assets/miningbot.png"),
			background: this.loadImage("assets/background.png"),
			mining: this.loadImage("assets/mining.png"),
			turret: this.loadImage("assets/turret.png"),
			turret2: this.loadImage("assets/turret2.png"),
			turret3: this.loadImage("assets/turret3.png"),
			enemy1: this.loadImage("assets/enemy1.png"),
			enemy2: this.loadImage("assets/enemy2.png"),
			player: this.loadImage("assets/player.png")
		};
		
		this.assets.wall.onload = function()
		{
			this.wallCanvas = document.createElement("canvas");
			this.wallCanvas.width = "30";
			this.wallCanvas.height = "30";
			this.wallCtx = this.wallCanvas.getContext("2d");
			this.wallCtx.drawImage(this.assets.wall, 0, 0, 30, 30);
			this.update();
		}.bind(this);

		this.audio = {
			shoot1: this.loadAudio("sfx/shoot1.wav"),
			shoot2: this.loadAudio("sfx/shoot2.wav"),
			shoot3: this.loadAudio("sfx/shoot3.wav"),
			respawn: this.loadAudio("sfx/respawn.wav"),
			place: this.loadAudio("sfx/place.wav"),
			music1: this.loadAudio("sfx/music1.mp3"),
			music2: this.loadAudio("sfx/music2.mp3"),
			music3: this.loadAudio("sfx/music3.mp3")
		};

		this.audio.music1.play();
		this.currentMusic = 1;
		this.audio.music1.onended = this.switchMusic.bind(this);
		this.audio.music2.onended = this.switchMusic.bind(this);
		this.audio.music3.onended = this.switchMusic.bind(this);
	}

	switchMusic()
	{
		this.currentMusic++;
		if (this.currentMusic > 3)
			this.currentMusic = 1;

		switch (this.currentMusic)
		{
			case 1:
				this.audio.music1.play();
				break;
			case 2:
				this.audio.music2.play();
				break;
			case 3:
				this.audio.music3.play();
				break;
		}
	}

	gameOverRender()
	{
		this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
		this.ctx.fillStyle = "black";
		this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
		this.ctx.fillStyle = "white";
		this.ctx.font = "75px Courier New";
		this.ctx.textAlign = "center";
		this.ctx.fillText("Game Over", this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
		this.ctx.font = "25px Courier New";
		this.ctx.fillText("Press space to restart", this.ctx.canvas.width / 2, this.ctx.canvas.height / 2 + 100);
	}

	update()
	{
		if (this.gameOver)
		{
			this.gameOverRender();
			window.requestAnimationFrame(this.update.bind(this));
			return;
		}
		let delta = (new Date().getTime() - this.lastFrameTime) / (1000 / this.targetFPS);
		this.lastFrameTime = new Date().getTime();
		this.frameTimes.push(this.lastFrameTime);

		for (let i = this.frameTimes.length - 1; i > -1; i--)
			if (this.frameTimes[i] < this.lastFrameTime - 2000)
				this.frameTimes.splice(i, 1);

		if (this.paused)
		{
			this.render(this.frameTimes.length / 2);
			window.requestAnimationFrame(this.update.bind(this));
			return;
		}

		this.world.blocks[0].health = Math.min(1000, this.world.blocks[0].health + delta / 60);

		this.player.miningTimeout -= delta;
		this.placeTimer -= delta;

		this.player.update(this, delta);
		this.enemies.update(delta);
		this.world.update(this, delta);

		this.messageTime -= delta;
		if (this.messageTime <= 0)
			this.message = "";

		for (let bot of this.miningBots)
		{
			bot.update(this, delta);
		}
		
		this.blackTimeout -= delta;
		if (this.keys["n"] && this.blackTimeout <= 0)
		{
			this.blackCircle = !this.blackCircle;
			this.blackTimeout = 30;
		}

		if (this.mouseDown)
		{
			let adjX = this.mousePos.x - this.ctx.canvas.width / 2;
			let adjY = this.mousePos.y - this.ctx.canvas.height / 2;

			let x = adjX + this.player.x;
			let y = adjY + this.player.y;

			if (x > 0 && x < this.world.sectors.length * 300 && y > 0 && y < this.world.sectors.length * 300)
			{
				let sector = this.getSector(x, y);
				let blockX = Math.floor(x / 30) % 10;
				let blockY = Math.floor(y / 30) % 10;
				if (this.itemSelected === 0)
				{
					if (this.inventory.copper >= 2)
					{
						if (sector.blocks[blockX][blockY] === 2 || sector.blocks[blockX][blockY] === 3 || sector.blocks[blockX][blockY] === 4 || sector.blocks[blockX][blockY] === 5)
						{
							let found = false;
							for (let item of this.miningFlags)
								if (item.x === Math.floor(x / 30) && item.y === Math.floor(y / 30))
									found = true;

							if (!found && this.spawn !== null)
							{
								this.inventory.copper -= 2;
								this.miningFlags.push({
									x: Math.floor(x / 30),
									y: Math.floor(y / 30),
									path: this.pathfind(
										Math.floor(x / 30),
										Math.floor(y / 30),
										Math.floor(this.spawn.x / 30),
										Math.floor(this.spawn.y / 30)
									)
								});
							}
						}
					}
					else
					{
						this.message = "You do not have enough resources";
						this.messageTime = 120;
					}
				}
				else if (this.itemSelected === 1 && this.placeTimer <= 0)
				{
					if (this.inventory.copper >= 50 && this.inventory.electronium >= 10)
					{
						let xPos = Math.floor(x / 30) * 30;
						let yPos = Math.floor(y / 30) * 30;
						let canPlace = true;
						for (let block of this.world.blocks)
						{
							let trueX = block.x - Math.floor(block.width / 2) * 30;
							let trueY = block.y - Math.floor(block.height / 2) * 30;

							if (xPos >= trueX && yPos >= trueY &&
								xPos < trueX + block.width * 30 && yPos < trueY + block.height * 30)
							{
								canPlace = false;
							}
						}
						if (canPlace && x > 0 && y > 0 &&
							x < this.world.sectors.length * 300 &&
							y < this.world.sectors.length * 300 && this.getBlock(x, y))
						{
							this.world.placeBlock(xPos, yPos, 1, 1, 1, 100);
							this.audio.place.play();
							this.inventory.copper -= 50;
							this.inventory.electronium -= 10;
							this.placeTimer = 10;
						}
						else
						{
							this.message = "You cannot place that block there";
							this.messageTime = 120;
						}
					}
					else
					{
						this.message = "You do not have enough resources";
						this.messageTime = 120;
					}
				}
				else if (this.itemSelected === 2 && this.placeTimer <= 0)
				{
					if (this.inventory.copper >= 5)
					{
						let xPos = Math.floor(x / 30) * 30;
						let yPos = Math.floor(y / 30) * 30;
						let canPlace = true;
						for (let block of this.world.blocks)
						{
							let trueX = block.x - Math.floor(block.width / 2) * 30;
							let trueY = block.y - Math.floor(block.height / 2) * 30;

							if (xPos >= trueX && yPos >= trueY &&
								xPos < trueX + block.width * 30 && yPos < trueY + block.height * 30)
							{
								canPlace = false;
							}
						}
						if (canPlace && x > 0 && y > 0 &&
							x < this.world.sectors.length * 300 &&
							y < this.world.sectors.length * 300 && this.getBlock(x, y))
						{
							this.world.placeBlock(xPos, yPos, 1, 1, 2, 100);
							this.audio.place.play();
							this.inventory.copper -= 5;
							this.placeTimer = 10;
						}
						else
						{
							this.message = "You cannot place that block there";
							this.messageTime = 120;
						}
					}
					else
					{
						this.message = "You do not have enough resources";
						this.messageTime = 120;
					}
				}
				else if (this.itemSelected === 3 && this.placeTimer <= 0)
				{
					if (this.inventory.firite >= 5)
					{
						let xPos = Math.floor(x / 30) * 30;
						let yPos = Math.floor(y / 30) * 30;
						let canPlace = true;
						for (let block of this.world.blocks)
						{
							let trueX = block.x - Math.floor(block.width / 2) * 30;
							let trueY = block.y - Math.floor(block.height / 2) * 30;

							if (xPos >= trueX && yPos >= trueY &&
								xPos < trueX + block.width * 30 && yPos < trueY + block.height * 30)
							{
								canPlace = false;
							}
						}
						if (canPlace && x > 0 && y > 0 &&
							x < this.world.sectors.length * 300 &&
							y < this.world.sectors.length * 300 && this.getBlock(x, y))
						{
							this.world.placeBlock(xPos, yPos, 1, 1, 3, 300);
							this.audio.place.play();
							this.inventory.firite -= 5;
							this.placeTimer = 10;
						}
						else
						{
							this.message = "You cannot place that block there";
							this.messageTime = 120;
						}
					}
					else
					{
						this.message = "You do not have enough resources";
						this.messageTime = 120;
					}
				}
				else if (this.itemSelected === 4 && this.placeTimer <= 0)
				{
					if (this.inventory.firite >= 15 && this.inventory.electronium >= 15)
					{
						let xPos = Math.floor(x / 30) * 30;
						let yPos = Math.floor(y / 30) * 30;
						let canPlace = true;
						for (let block of this.world.blocks)
						{
							let trueX = block.x - Math.floor(block.width / 2) * 30;
							let trueY = block.y - Math.floor(block.height / 2) * 30;

							if (xPos >= trueX && yPos >= trueY &&
								xPos < trueX + block.width * 30 && yPos < trueY + block.height * 30)
							{
								canPlace = false;
							}
						}
						if (canPlace && x > 0 && y > 0 &&
							x < this.world.sectors.length * 300 &&
							y < this.world.sectors.length * 300 && this.getBlock(x, y))
						{
							this.world.placeBlock(xPos, yPos, 1, 1, 4, 200);
							this.audio.place.play();
							this.inventory.firite -= 15;
							this.inventory.electronium -= 15;
							this.placeTimer = 10;
						}
						else
						{
							this.message = "You cannot place that block there";
							this.messageTime = 120;
						}
					}
					else
					{
						this.message = "You do not have enough resources";
						this.messageTime = 120;
					}
				}
				else if (this.itemSelected === 5 && this.placeTimer <= 0)
				{
					if (this.inventory.radium >= 5)
					{
						let xPos = Math.floor(x / 30) * 30;
						let yPos = Math.floor(y / 30) * 30;
						let canPlace = true;
						for (let block of this.world.blocks)
						{
							let trueX = block.x - Math.floor(block.width / 2) * 30;
							let trueY = block.y - Math.floor(block.height / 2) * 30;

							if (xPos >= trueX && yPos >= trueY &&
								xPos < trueX + block.width * 30 && yPos < trueY + block.height * 30)
							{
								canPlace = false;
							}
						}
						if (canPlace && x > 0 && y > 0 &&
							x < this.world.sectors.length * 300 &&
							y < this.world.sectors.length * 300 && this.getBlock(x, y))
						{
							this.world.placeBlock(xPos, yPos, 1, 1, 5, 800);
							this.audio.place.play();
							this.inventory.radium -= 5;
							this.placeTimer = 10;
						}
						else
						{
							this.message = "You cannot place that block there";
							this.messageTime = 120;
						}
					}
					else
					{
						this.message = "You do not have enough resources";
						this.messageTime = 120;
					}
				}
				else if (this.itemSelected === 6 && this.placeTimer <= 0)
				{
					if (this.inventory.radium >= 15 && this.inventory.firite >= 15)
					{
						let xPos = Math.floor(x / 30) * 30;
						let yPos = Math.floor(y / 30) * 30;
						let canPlace = true;
						for (let block of this.world.blocks)
						{
							let trueX = block.x - Math.floor(block.width / 2) * 30;
							let trueY = block.y - Math.floor(block.height / 2) * 30;

							if (xPos >= trueX && yPos >= trueY &&
								xPos < trueX + block.width * 30 && yPos < trueY + block.height * 30)
							{
								canPlace = false;
							}
						}
						if (canPlace && x > 0 && y > 0 &&
							x < this.world.sectors.length * 300 &&
							y < this.world.sectors.length * 300 && this.getBlock(x, y))
						{
							this.world.placeBlock(xPos, yPos, 1, 1, 6, 200);
							this.audio.place.play();
							this.inventory.radium -= 15;
							this.inventory.firite -= 15;
							this.placeTimer = 10;
						}
						else
						{
							this.message = "You cannot place that block there";
							this.messageTime = 120;
						}
					}
					else
					{
						this.message = "You do not have enough resources";
						this.messageTime = 120;
					}
				}
				else if (this.itemSelected === null && Math.abs(adjX) + Math.abs(adjY) <= 200)
				{
					if (sector.blocks[blockX][blockY] === 2)
					{
						if (this.player.miningTimeout <= 0)
						{
							this.inventory.copper += 1;
							sector.blockData[blockX][blockY]["count"]--;
							if (sector.blockData[blockX][blockY]["count"] <= 0)
							{
								sector.blocks[blockX][blockY] = 1;
								for (let i = this.miningFlags.length - 1; i > -1; i--)
								{
									if (this.miningFlags[i].x === Math.floor(x / 30) && this.miningFlags[i].y === Math.floor(y / 30))
									{
										this.miningFlags.splice(i, 1);
									}
								}
							}
							this.player.miningTimeout = 30;
						}
					}
					else if (sector.blocks[blockX][blockY] === 3)
					{
						if (this.player.miningTimeout <= 0)
						{
							this.inventory.electronium += 1;
							sector.blockData[blockX][blockY]["count"]--;
							if (sector.blockData[blockX][blockY]["count"] <= 0)
							{
								sector.blocks[blockX][blockY] = 1;
								for (let i = this.miningFlags.length - 1; i > -1; i--)
								{
									if (this.miningFlags[i].x === Math.floor(x / 30) && this.miningFlags[i].y === Math.floor(y / 30))
									{
										this.miningFlags.splice(i, 1);
									}
								}
							}
							this.player.miningTimeout = 60;
						}
					}
					else if (sector.blocks[blockX][blockY] === 4)
					{
						if (this.player.miningTimeout <= 0)
						{
							this.inventory.firite += 1;
							sector.blockData[blockX][blockY]["count"]--;
							if (sector.blockData[blockX][blockY]["count"] <= 0)
							{
								sector.blocks[blockX][blockY] = 1;
								for (let i = this.miningFlags.length - 1; i > -1; i--)
								{
									if (this.miningFlags[i].x === Math.floor(x / 30) && this.miningFlags[i].y === Math.floor(y / 30))
									{
										this.miningFlags.splice(i, 1);
									}
								}
							}
							this.player.miningTimeout = 120;
						}
					}
					else if (sector.blocks[blockX][blockY] === 5)
					{
						if (this.player.miningTimeout <= 0)
						{
							this.inventory.radium += 1;
							sector.blockData[blockX][blockY]["count"]--;
							if (sector.blockData[blockX][blockY]["count"] <= 0)
							{
								sector.blocks[blockX][blockY] = 1;
								for (let i = this.miningFlags.length - 1; i > -1; i--)
								{
									if (this.miningFlags[i].x === Math.floor(x / 30) && this.miningFlags[i].y === Math.floor(y / 30))
									{
										this.miningFlags.splice(i, 1);
									}
								}
							}
							this.player.miningTimeout = 120;
						}
					}
					else if (this.itemSelected === null)
					{
						this.player.shoot(Math.atan2(
							this.mousePos.y - this.ctx.canvas.height / 2,
							this.mousePos.x - this.ctx.canvas.width / 2
						));
					}
				}
				else if (this.itemSelected === null)
				{
					this.player.shoot(Math.atan2(
						this.mousePos.y - this.ctx.canvas.height / 2,
						this.mousePos.x - this.ctx.canvas.width / 2
					));
				}
			}
		}
		
		this.movePlayer(delta);
		this.render(this.frameTimes.length / 2);
		window.requestAnimationFrame(this.update.bind(this));
	}

	render(fps)
	{
		this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
		this.ctx.fillStyle = "rgb(30, 30, 30)";
		this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
		this.world.render(this);

		this.enemies.render();

		for (let flag of this.miningFlags)
		{
			this.ctx.strokeStyle = "black";
			this.ctx.lineWidth = 4;
			this.ctx.strokeRect(
				this.renderingPosX(flag.x * 30),
				this.renderingPosY(flag.y * 30),
				30,
				30
			);
		}

		for (let bot of this.miningBots)
		{
			bot.render(this);
		}

		this.player.render(this);
		if (this.blackCircle)
		{
			this.ctx.drawImage(this.assets.background, this.ctx.canvas.width / 2 + -450, this.ctx.canvas.height / 2 + -440);
			//for (let x = -22; x < 23; x++)
			//{
			//	for (let y = -22; y < 23; y++)
			//	{
			//		let d = Math.sqrt(x * x + y * y);
			//		this.ctx.fillStyle = `rgba(0, 0, 0, ${d / 15 - 0.6})`;
			//		this.ctx.fillRect(this.ctx.canvas.width / 2 + x * 20, this.ctx.canvas.height / 2 + y * 20, 20, 20);
			//	}
			//}
			this.ctx.fillStyle = "black";
			this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height / 2 - 420);
			this.ctx.fillRect(0, 0, this.ctx.canvas.width / 2 - 439, this.ctx.canvas.height);
			this.ctx.fillRect(this.ctx.canvas.width / 2 + 450, 0, this.ctx.canvas.width / 2 - 430, this.ctx.canvas.height);
			this.ctx.fillRect(0, this.ctx.canvas.height / 2 + 460, this.ctx.canvas.width, this.ctx.canvas.height / 2 - 440);
		}
		this.renderUI();
	
		this.ctx.fillStyle = "white";
		this.ctx.font = "15px Arial";
		this.ctx.fillText(fps + " fps", 10, 20);
	}

	fixOres()
	{
		let spawnSector = this.getSector(this.spawn.x, this.spawn.y);
		for (let x = 0; x < this.world.sectors.length; x++)
		{
			for (let y = 0; y < this.world.sectors.length; y++)
			{
				let sector = this.getSector(x * 300, y * 300);
				let a = x - spawnSector.x;
				let b = y - spawnSector.y;
				let dist = Math.sqrt(a * a + b * b);

				for (let bx = 0; bx < 10; bx++)
				{
					for (let by = 0; by < 10; by++)
					{
						if (sector.blocks[bx][by] === 3)
						{
							sector.blockData[bx][by]["count"] *= Math.max(0.2, Math.min(1, dist / 10));
						}
						else if (sector.blocks[bx][by] === 4)
						{
							if (dist < 8)
							{
								sector.blocks[bx][by] = 1;
								continue;
							}
							sector.blockData[bx][by]["count"] *= Math.max(0.2, Math.min(1, (dist - 8) / 15));
							sector.blockData[bx][by]["count"] = Math.max(1, sector.blockData[bx][by]["count"]);
						}
						else if (sector.blocks[bx][by] === 5)
						{
							if (dist < 20)
							{
								sector.blocks[bx][by] = 1;
								continue;
							}
							sector.blockData[bx][by]["count"] *= Math.max(0.2, Math.min(1, (dist - 20) / 10));
							sector.blockData[bx][by]["count"] = Math.max(1, sector.blockData[bx][by]["count"]);
						}
					}
				}
			}
		}
	}

	renderUI()
	{
		if (this.itemSelected === 1)
		{
			let x = this.mousePos.x - this.ctx.canvas.width / 2 + this.player.x;
			let y = this.mousePos.y - this.ctx.canvas.height / 2 + this.player.y;

			if (x > 0 && y > 0 && x < this.world.sectors.length * 300 && y < this.world.sectors.length * 300)
			{
				this.ctx.fillStyle = "rgba(60, 60, 60, 0.6)";
				this.ctx.fillRect(
					this.renderingPosX(Math.floor(x / 30) * 30),
					this.renderingPosY(Math.floor(y / 30) * 30),
					30,
					30
				);
			}
		}
		else if (this.itemSelected === 2)
		{
			let x = this.mousePos.x - this.ctx.canvas.width / 2 + this.player.x;
			let y = this.mousePos.y - this.ctx.canvas.height / 2 + this.player.y;

			if (x > 0 && y > 0 && x < this.world.sectors.length * 300 && y < this.world.sectors.length * 300)
			{
				this.ctx.fillStyle = "rgba(255, 128, 0, 0.6)";
				this.ctx.fillRect(
					this.renderingPosX(Math.floor(x / 30) * 30),
					this.renderingPosY(Math.floor(y / 30) * 30),
					30,
					30
				);
			}
		}
		else if (this.itemSelected === 3)
		{
			let x = this.mousePos.x - this.ctx.canvas.width / 2 + this.player.x;
			let y = this.mousePos.y - this.ctx.canvas.height / 2 + this.player.y;

			if (x > 0 && y > 0 && x < this.world.sectors.length * 300 && y < this.world.sectors.length * 300)
			{
				this.ctx.fillStyle = "rgba(200, 30, 0, 0.6)";
				this.ctx.fillRect(
					this.renderingPosX(Math.floor(x / 30) * 30),
					this.renderingPosY(Math.floor(y / 30) * 30),
					30,
					30
				);
			}
		}
		else if (this.itemSelected === 4)
		{
			let x = this.mousePos.x - this.ctx.canvas.width / 2 + this.player.x;
			let y = this.mousePos.y - this.ctx.canvas.height / 2 + this.player.y;

			if (x > 0 && y > 0 && x < this.world.sectors.length * 300 && y < this.world.sectors.length * 300)
			{
				this.ctx.fillStyle = "rgba(100, 30, 0, 0.6)";
				this.ctx.fillRect(
					this.renderingPosX(Math.floor(x / 30) * 30),
					this.renderingPosY(Math.floor(y / 30) * 30),
					30,
					30
				);
			}
		}
		else if (this.itemSelected === 5 || this.itemSelected === 6)
		{
			let x = this.mousePos.x - this.ctx.canvas.width / 2 + this.player.x;
			let y = this.mousePos.y - this.ctx.canvas.height / 2 + this.player.y;

			if (x > 0 && y > 0 && x < this.world.sectors.length * 300 && y < this.world.sectors.length * 300)
			{
				this.ctx.fillStyle = "rgba(9, 159, 9, 0.6)";
				this.ctx.fillRect(
					this.renderingPosX(Math.floor(x / 30) * 30),
					this.renderingPosY(Math.floor(y / 30) * 30),
					30,
					30
				);
			}
		}
		let hoveringMiningBot = false;

		if (this.mousePos.x >= this.ctx.canvas.width - 340 && this.mousePos.x <= this.ctx.canvas.width - 190 &&
			this.mousePos.y >= this.ctx.canvas.height - 55 && this.mousePos.y <= this.ctx.canvas.height - 15)
			hoveringMiningBot = true;

		this.ctx.fillStyle = "rgb(200, 200, 200)";
		this.ctx.fillRect(this.ctx.canvas.width - 350, this.ctx.canvas.height - 250, 345, 245);
		
		this.ctx.fillStyle = "rgb(150, 150, 150)";
		this.ctx.fillRect(this.ctx.canvas.width - 350, this.ctx.canvas.height - 250, 345, 35);

		this.ctx.fillStyle = "black";
		this.ctx.font = "15px Courier New";
		this.ctx.fillText(
			"Items:",
			this.ctx.canvas.width - 340,
			this.ctx.canvas.height - 228
		);

		this.ctx.fillStyle = "rgb(255, 128, 0)";
		this.ctx.fillRect(this.ctx.canvas.width - 280, this.ctx.canvas.height - 240, 15, 15);

		this.ctx.fillStyle = "black";
		this.ctx.fillText(
			this.inventory.copper.toString(),
			this.ctx.canvas.width - 260,
			this.ctx.canvas.height - 228
		);

		this.ctx.fillStyle = "rgb(255, 230, 0)";
		this.ctx.fillRect(this.ctx.canvas.width - 210, this.ctx.canvas.height - 240, 15, 15);

		this.ctx.fillStyle = "black";
		this.ctx.fillText(
			this.inventory.electronium.toString(),
			this.ctx.canvas.width - 190,
			this.ctx.canvas.height - 228
		);

		this.ctx.fillStyle = "rgb(255, 30, 0)";
		this.ctx.fillRect(this.ctx.canvas.width - 140, this.ctx.canvas.height - 240, 15, 15);

		this.ctx.fillStyle = "black";
		this.ctx.fillText(
			this.inventory.firite.toString(),
			this.ctx.canvas.width - 120,
			this.ctx.canvas.height - 228
		);

		this.ctx.fillStyle = "rgb(9, 159, 9)";
		this.ctx.fillRect(this.ctx.canvas.width - 70, this.ctx.canvas.height - 240, 15, 15);

		this.ctx.fillStyle = "black";
		this.ctx.fillText(
			this.inventory.radium.toString(),
			this.ctx.canvas.width - 50,
			this.ctx.canvas.height - 228
		);

		this.ctx.strokeStyle = this.itemSelected === 0 ? "red" : "black";
		this.ctx.lineWidth = 4;
		this.ctx.strokeRect(this.ctx.canvas.width - 340, this.ctx.canvas.height - 205, 40, 40);
		this.ctx.drawImage(this.assets.mining, this.ctx.canvas.width - 335, this.ctx.canvas.height - 200, 30, 30);

		this.ctx.strokeStyle = this.itemSelected === 1 ? "red" : "black";
		this.ctx.strokeRect(this.ctx.canvas.width - 290, this.ctx.canvas.height - 205, 40, 40);
		this.ctx.drawImage(this.assets.turret, this.ctx.canvas.width - 285, this.ctx.canvas.height - 200, 30, 30);

		this.ctx.strokeStyle = this.itemSelected === 2 ? "red" : "black";
		this.ctx.strokeRect(this.ctx.canvas.width - 240, this.ctx.canvas.height - 205, 40, 40);
		this.ctx.fillStyle = "rgb(255, 128, 0)";
		this.ctx.fillRect(this.ctx.canvas.width - 235, this.ctx.canvas.height - 200, 30, 30);

		this.ctx.strokeStyle = this.itemSelected === 3 ? "red" : "black";
		this.ctx.strokeRect(this.ctx.canvas.width - 190, this.ctx.canvas.height - 205, 40, 40);
		this.ctx.fillStyle = "rgb(200, 30, 0)";
		this.ctx.fillRect(this.ctx.canvas.width - 185, this.ctx.canvas.height - 200, 30, 30);

		this.ctx.strokeStyle = this.itemSelected === 4 ? "red" : "black";
		this.ctx.strokeRect(this.ctx.canvas.width - 140, this.ctx.canvas.height - 205, 40, 40);
		this.ctx.drawImage(this.assets.turret2, this.ctx.canvas.width - 135, this.ctx.canvas.height - 200, 30, 30);

		this.ctx.strokeStyle = this.itemSelected === 5 ? "red" : "black";
		this.ctx.strokeRect(this.ctx.canvas.width - 90, this.ctx.canvas.height - 205, 40, 40);
		this.ctx.fillStyle = "rgb(9, 159, 9)";
		this.ctx.fillRect(this.ctx.canvas.width - 85, this.ctx.canvas.height - 200, 30, 30);

		this.ctx.strokeStyle = this.itemSelected === 6 ? "red" : "black";
		this.ctx.lineWidth = 4;
		this.ctx.strokeRect(this.ctx.canvas.width - 340, this.ctx.canvas.height - 155, 40, 40);
		this.ctx.drawImage(this.assets.turret3, this.ctx.canvas.width - 335, this.ctx.canvas.height - 150, 30, 30);

		this.ctx.fillStyle = "rgb(100, 100, 100)";
		this.ctx.fillRect(this.ctx.canvas.width - 340, this.ctx.canvas.height - 55, 150, 40);

		this.ctx.fillStyle = "white";
		this.ctx.textAlign = "center";
		this.ctx.fillText(
			"Buy mining bot",
			this.ctx.canvas.width - 265,
			this.ctx.canvas.height - 32
		);
		this.ctx.fillStyle = "rgb(100, 100, 100)";
		this.ctx.fillRect(this.ctx.canvas.width - 170, this.ctx.canvas.height - 55, 150, 40);

		this.ctx.fillStyle = "white";
		this.ctx.fillText(
			"Respawn at base",
			this.ctx.canvas.width - 95,
			this.ctx.canvas.height - 32
		);
		this.ctx.textAlign = "left";

		if (this.itemSelected !== null && !hoveringMiningBot)
		{
			this.ctx.fillStyle = "rgb(200, 200, 200)";
			this.ctx.fillRect(this.ctx.canvas.width - 350, this.ctx.canvas.height - 340, 345, 85);
			
			this.ctx.fillStyle = "rgb(150, 150, 150)";
			this.ctx.fillRect(this.ctx.canvas.width - 350, this.ctx.canvas.height - 340, 345, 35);
		
			this.ctx.fillStyle = "black";
			if (this.itemSelected === 0)
			{
				this.ctx.fillText(
					"Mining Flag    2",
					this.ctx.canvas.width - 340,
					this.ctx.canvas.height - 320
				);

				this.ctx.fillText(
					"Tells mining bots where to mine from.",
					this.ctx.canvas.width - 340,
					this.ctx.canvas.height - 290
				);

				this.ctx.fillText(
					"Place on any ore.",
					this.ctx.canvas.width - 340,
					this.ctx.canvas.height - 270
				);

				this.ctx.fillStyle = "rgb(255, 128, 0)";
				this.ctx.fillRect(this.ctx.canvas.width - 225, this.ctx.canvas.height - 332, 15, 15);
			}
			else if (this.itemSelected === 1)
			{
				this.ctx.fillText(
					"Turret    50    10",
					this.ctx.canvas.width - 340,
					this.ctx.canvas.height - 320
				);

				this.ctx.fillText(
					"Shoots 1 bullet/s",
					this.ctx.canvas.width - 340,
					this.ctx.canvas.height - 290
				);
				this.ctx.fillStyle = "rgb(255, 128, 0)";
				this.ctx.fillRect(this.ctx.canvas.width - 268, this.ctx.canvas.height - 332, 15, 15);

				this.ctx.fillStyle = "rgb(255, 255, 0)";
				this.ctx.fillRect(this.ctx.canvas.width - 213, this.ctx.canvas.height - 332, 15, 15);
			}
			else if (this.itemSelected === 2)
			{
				this.ctx.fillText(
					"Copper Wall    5",
					this.ctx.canvas.width - 340,
					this.ctx.canvas.height - 320
				);

				this.ctx.fillText(
					"Prevents enemies from passing through",
					this.ctx.canvas.width - 340,
					this.ctx.canvas.height - 290
				);
				this.ctx.fillStyle = "rgb(255, 128, 0)";
				this.ctx.fillRect(this.ctx.canvas.width - 225, this.ctx.canvas.height - 332, 15, 15);
			}
			else if (this.itemSelected === 3)
			{
				this.ctx.fillText(
					"Firite Wall    5",
					this.ctx.canvas.width - 340,
					this.ctx.canvas.height - 320
				);

				this.ctx.fillText(
					"Better version of copper wall",
					this.ctx.canvas.width - 340,
					this.ctx.canvas.height - 290
				);

				this.ctx.fillStyle = "rgb(200, 30, 0)";
				this.ctx.fillRect(this.ctx.canvas.width - 225, this.ctx.canvas.height - 332, 15, 15);
			}
			else if (this.itemSelected === 4)
			{
				this.ctx.fillText(
					"Machine Turret    15    15",
					this.ctx.canvas.width - 340,
					this.ctx.canvas.height - 320
				);

				this.ctx.fillText(
					"Shoots faster than normal turret",
					this.ctx.canvas.width - 340,
					this.ctx.canvas.height - 290
				);
				this.ctx.fillStyle = "rgb(255, 30, 0)";
				this.ctx.fillRect(this.ctx.canvas.width - 198, this.ctx.canvas.height - 332, 15, 15);

				this.ctx.fillStyle = "rgb(255, 255, 0)";
				this.ctx.fillRect(this.ctx.canvas.width - 143, this.ctx.canvas.height - 332, 15, 15);
			}
			else if (this.itemSelected === 5)
			{
				this.ctx.fillText(
					"Radium Wall    5",
					this.ctx.canvas.width - 340,
					this.ctx.canvas.height - 320
				);

				this.ctx.fillText(
					"Upgraded firite wall",
					this.ctx.canvas.width - 340,
					this.ctx.canvas.height - 290
				);
				this.ctx.fillStyle = "rgb(9, 159, 9)";
				this.ctx.fillRect(this.ctx.canvas.width - 225, this.ctx.canvas.height - 332, 15, 15);
			}
			else if (this.itemSelected === 6)
			{
				this.ctx.fillText(
					"Radium Gun     15    15",
					this.ctx.canvas.width - 340,
					this.ctx.canvas.height - 320
				);

				this.ctx.fillText(
					"Shoots even faster",
					this.ctx.canvas.width - 340,
					this.ctx.canvas.height - 290
				);
				this.ctx.fillStyle = "rgb(9, 159, 9)";
				this.ctx.fillRect(this.ctx.canvas.width - 225, this.ctx.canvas.height - 332, 15, 15);

				this.ctx.fillStyle = "rgb(255, 30, 0)";
				this.ctx.fillRect(this.ctx.canvas.width - 173, this.ctx.canvas.height - 332, 15, 15);
			}
		}
		else if (hoveringMiningBot)
		{
			this.ctx.fillStyle = "rgb(200, 200, 200)";
			this.ctx.fillRect(this.ctx.canvas.width - 350, this.ctx.canvas.height - 340, 345, 85);
			
			this.ctx.fillStyle = "rgb(150, 150, 150)";
			this.ctx.fillRect(this.ctx.canvas.width - 350, this.ctx.canvas.height - 340, 345, 35);
		
			this.ctx.fillStyle = "black";
			this.ctx.fillText(
				"Mining Bot (25 copper, 5 electronium)",
				this.ctx.canvas.width - 340,
				this.ctx.canvas.height - 320
			);

			this.ctx.fillText(
				"Creates a bot to mine for you.",
				this.ctx.canvas.width - 340,
				this.ctx.canvas.height - 290
			);

			this.ctx.fillText(
				"Bots travel to a random mining flag.",
				this.ctx.canvas.width - 340,
				this.ctx.canvas.height - 270
			);
		}

		if (this.mousePos.x < canvas.width - 350 || this.mousePos.y < canvas.height - 250)
		{
			let adjX = this.mousePos.x - this.ctx.canvas.width / 2;
			let adjY = this.mousePos.y - this.ctx.canvas.height / 2;

			let x = adjX + this.player.x;
			let y = adjY + this.player.y;

			let block = 0, blockData;

			for (let b of this.world.blocks)
			{
				let trueX = b.x - Math.floor(b.width / 2) * 30;
				let trueY = b.y - Math.floor(b.height / 2) * 30;

				if (x >= trueX && y >= trueY &&
					x < trueX + b.width * 30 && y < trueY + b.height * 30)
				{
					block = -b.type - 1;
					blockData = b;
				}
			}

			if (x > 0 && y > 0 && x < 300 * this.world.sectors.length && y < 300 * this.world.sectors.length)
			{
				if (block >= 0)
				{
					block = this.getBlock(x, y);
					blockData = this.getSector(x, y).blockData[Math.floor(x / 30) % 10][Math.floor(y / 30) % 10];
				}

				let baseY = 0;
				if (block === 0 || block === 2 || block === 3 || block === 4 || block === 5 || block < 0)
				{
					if (this.itemSelected !== null || hoveringMiningBot)
					{
						baseY = -90;
						this.ctx.fillStyle = "rgb(200, 200, 200)";
						this.ctx.fillRect(this.ctx.canvas.width - 350, this.ctx.canvas.height - 430, 345, 85);
						
						this.ctx.fillStyle = "rgb(150, 150, 150)";
						this.ctx.fillRect(this.ctx.canvas.width - 350, this.ctx.canvas.height - 430, 345, 35);
					}
					else
					{
						this.ctx.fillStyle = "rgb(200, 200, 200)";
						this.ctx.fillRect(this.ctx.canvas.width - 350, this.ctx.canvas.height - 340, 345, 85);
						
						this.ctx.fillStyle = "rgb(150, 150, 150)";
						this.ctx.fillRect(this.ctx.canvas.width - 350, this.ctx.canvas.height - 340, 345, 35);
					}
				}
				if (block === 2)
				{
					this.ctx.fillStyle = "rgb(255, 128, 0)";
					this.ctx.fillRect(this.ctx.canvas.width - 340, this.ctx.canvas.height - (330 - baseY), 15, 15);
					this.ctx.fillStyle = "black";
					this.ctx.fillText(
						"Copper Ore (" + Math.round(blockData["count"]) + " remaining)",
						this.ctx.canvas.width - 320,
						this.ctx.canvas.height - (318 - baseY)
					);
					this.ctx.fillText(
						"Yields 2 copper/s when mined",
						this.ctx.canvas.width - 340,
						this.ctx.canvas.height - (318 - baseY) + 35
					);
				}
				else if (block === 3)
				{
					this.ctx.fillStyle = "rgb(255, 230, 0)";
					this.ctx.fillRect(this.ctx.canvas.width - 340, this.ctx.canvas.height - (330 - baseY), 15, 15);
					this.ctx.fillStyle = "black";
					this.ctx.fillText(
						"Electronium Ore (" + Math.round(blockData["count"]) + " remaining)",
						this.ctx.canvas.width - 320,
						this.ctx.canvas.height - (318 - baseY)
					);
					this.ctx.fillText(
						"Yields 1 electronium/s when mined",
						this.ctx.canvas.width - 340,
						this.ctx.canvas.height - (318 - baseY) + 35
					);
				}
				else if (block === 4)
				{
					this.ctx.fillStyle = "rgb(255, 30, 0)";
					this.ctx.fillRect(this.ctx.canvas.width - 340, this.ctx.canvas.height - (330 - baseY), 15, 15);
					this.ctx.fillStyle = "black";
					this.ctx.fillText(
						"Firite Ore (" + Math.round(blockData["count"]) + " remaining)",
						this.ctx.canvas.width - 320,
						this.ctx.canvas.height - (318 - baseY)
					);
					this.ctx.fillText(
						"Yields 0.5 firite/s when mined",
						this.ctx.canvas.width - 340,
						this.ctx.canvas.height - (318 - baseY) + 35
					);
				}
				else if (block === 5)
				{
					this.ctx.fillStyle = "rgb(9, 159, 9)";
					this.ctx.fillRect(this.ctx.canvas.width - 340, this.ctx.canvas.height - (330 - baseY), 15, 15);
					this.ctx.fillStyle = "black";
					this.ctx.fillText(
						"Radium Ore (" + Math.round(blockData["count"]) + " remaining)",
						this.ctx.canvas.width - 320,
						this.ctx.canvas.height - (318 - baseY)
					);
					this.ctx.fillText(
						"Yields 0.5 radium/s when mined",
						this.ctx.canvas.width - 340,
						this.ctx.canvas.height - (318 - baseY) + 35
					);
				}
				else if (block === 0)
				{
					this.ctx.drawImage(this.assets.wall, this.ctx.canvas.width - 340, this.ctx.canvas.height - (330 - baseY), 15, 15);
					this.ctx.fillStyle = "black";
					this.ctx.fillText(
						"Wall",
						this.ctx.canvas.width - 320,
						this.ctx.canvas.height - (318 - baseY)
					);
					this.ctx.fillText(
						"Barrier; cannot be broken",
						this.ctx.canvas.width - 340,
						this.ctx.canvas.height - (318 - baseY) + 35
					);
				}
				else if (block === -1)
				{
					this.ctx.fillStyle = "rgb(60, 60, 60)";
					this.ctx.fillRect(this.ctx.canvas.width - 340, this.ctx.canvas.height - (330 - baseY), 15, 15);
					this.ctx.fillStyle = "black";
					this.ctx.fillText(
						"Base (" + Math.floor(blockData.health) + " health)",
						this.ctx.canvas.width - 320,
						this.ctx.canvas.height - (318 - baseY)
					);
					this.ctx.fillText(
						"The source of your power",
						this.ctx.canvas.width - 340,
						this.ctx.canvas.height - (318 - baseY) + 35
					);
				}
				else if (block === -2)
				{
					this.ctx.fillStyle = "rgb(60, 60, 60)";
					this.ctx.fillRect(this.ctx.canvas.width - 340, this.ctx.canvas.height - (330 - baseY), 15, 15);
					this.ctx.fillStyle = "black";
					this.ctx.fillText(
						"Turret (" + blockData.health + " health)",
						this.ctx.canvas.width - 320,
						this.ctx.canvas.height - (318 - baseY)
					);
					this.ctx.fillText(
						"Shoots 1 bullet/s",
						this.ctx.canvas.width - 340,
						this.ctx.canvas.height - (318 - baseY) + 35
					);
				}
				else if (block === -3)
				{
					this.ctx.fillStyle = "rgb(255, 128, 0)";
					this.ctx.fillRect(this.ctx.canvas.width - 340, this.ctx.canvas.height - (330 - baseY), 15, 15);
					this.ctx.fillStyle = "black";
					this.ctx.fillText(
						"Copper Wall (" + blockData.health + " health)",
						this.ctx.canvas.width - 320,
						this.ctx.canvas.height - (318 - baseY)
					);
					this.ctx.fillText(
						"Basic barrier for enemies",
						this.ctx.canvas.width - 340,
						this.ctx.canvas.height - (318 - baseY) + 35
					);
				}
				else if (block === -4)
				{
					this.ctx.fillStyle = "rgb(200, 30, 0)";
					this.ctx.fillRect(this.ctx.canvas.width - 340, this.ctx.canvas.height - (330 - baseY), 15, 15);
					this.ctx.fillStyle = "black";
					this.ctx.fillText(
						"Firite Wall (" + blockData.health + " health)",
						this.ctx.canvas.width - 320,
						this.ctx.canvas.height - (318 - baseY)
					);
					this.ctx.fillText(
						"Better version of copper wall",
						this.ctx.canvas.width - 340,
						this.ctx.canvas.height - (318 - baseY) + 35
					);
				}
				else if (block === -5)
				{
					this.ctx.fillStyle = "rgb(100, 30, 0)";
					this.ctx.fillRect(this.ctx.canvas.width - 340, this.ctx.canvas.height - (330 - baseY), 15, 15);
					this.ctx.fillStyle = "black";
					this.ctx.fillText(
						"Machine Turret (" + blockData.health + " health)",
						this.ctx.canvas.width - 320,
						this.ctx.canvas.height - (318 - baseY)
					);
					this.ctx.fillText(
						"Shoots faster than normal turret",
						this.ctx.canvas.width - 340,
						this.ctx.canvas.height - (318 - baseY) + 35
					);
				}
				else if (block === -6)
				{
					this.ctx.fillStyle = "rgb(9, 159, 9)";
					this.ctx.fillRect(this.ctx.canvas.width - 340, this.ctx.canvas.height - (330 - baseY), 15, 15);
					this.ctx.fillStyle = "black";
					this.ctx.fillText(
						"Radium Wall (" + blockData.health + " health)",
						this.ctx.canvas.width - 320,
						this.ctx.canvas.height - (318 - baseY)
					);
					this.ctx.fillText(
						"Upgraded firite wall",
						this.ctx.canvas.width - 340,
						this.ctx.canvas.height - (318 - baseY) + 35
					);
				}
				else if (block === -7)
				{
					this.ctx.fillStyle = "rgb(9, 159, 9)";
					this.ctx.fillRect(this.ctx.canvas.width - 340, this.ctx.canvas.height - (330 - baseY), 15, 15);
					this.ctx.fillStyle = "black";
					this.ctx.fillText(
						"Radium Gun (" + blockData.health + " health)",
						this.ctx.canvas.width - 320,
						this.ctx.canvas.height - (318 - baseY)
					);
					this.ctx.fillText(
						"Shoots even faster",
						this.ctx.canvas.width - 340,
						this.ctx.canvas.height - (318 - baseY) + 35
					);
				}
			}
		}
	
		this.ctx.font = "20px Courier New";
		this.ctx.fillStyle = "red";
		this.ctx.textAlign = "center";
		this.ctx.fillText(this.message, this.ctx.canvas.width / 2, this.ctx.canvas.height - 100);

		this.ctx.fillStyle = "white";
		if (this.enemies.level === 0)
		{
			this.ctx.font = "25px Courier New";
			this.ctx.fillText("Enemies spawning in:", this.ctx.canvas.width / 2, 40);
			this.ctx.font = "40px Courier New";
			this.ctx.fillText(this.getEnemyTime(), this.ctx.canvas.width / 2, 90);
		}
		else
		{
			this.ctx.font = "25px Courier New";
			this.ctx.fillText(this.getEnemyTime(), this.ctx.canvas.width / 2, 40);
			this.ctx.font = "40px Courier New";
			this.ctx.fillText("Level " + this.enemies.level, this.ctx.canvas.width / 2, 90);
		}
		this.ctx.fillStyle = "red";
		this.ctx.font = "50px Courier New";
		if (this.paused)
		{
			this.ctx.fillText("Game paused", this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
			this.ctx.font = "30px Courier New";
			this.ctx.fillText("Press space to resume", this.ctx.canvas.width / 2, this.ctx.canvas.height / 2 + 50);
		}
		this.ctx.textAlign = "left";
	}

	getEnemyTime()
	{
		let time = Math.floor(this.enemies.time / 60);
		let minutes = Math.floor(time / 60);
		let seconds = time % 60;
		if (seconds.toString().length === 1)
			seconds = "0" + seconds;
		return `${minutes}:${seconds}`;
	}

	createPathfindingNodes()
	{
		let spawnX = Math.floor(this.spawn.x / 30);
		let spawnY = Math.floor(this.spawn.y / 30);
		for (let i = 0; i < 10; i++)
		{
			let x, y, att = 0, dist;
			do
			{
				x = Math.floor(Math.random() * 10 * this.world.sectors.length);
				y = Math.floor(Math.random() * 10 * this.world.sectors.length);
				dist = this.distFromSpawn(x, y);
			}
			while (++att < 1000 && (!this.canSpawn(x, y) || dist < 100 || dist > 200));
			if (att >= 1000)
				continue;
			let path = this.pathfind(spawnX, spawnY, x, y, 10000);
			if (path === false)
				continue;
			this.pathfindingNodes.push({x: x, y: y, path: path, dist: dist});
		}
		for (let i = 0; i < 10; i++)
		{
			let x, y, att = 0, dist, closest, closestNode;
			do
			{
				closest = Infinity;
				x = Math.floor(Math.random() * 10 * this.world.sectors.length);
				y = Math.floor(Math.random() * 10 * this.world.sectors.length);
				for (let i of this.pathfindingNodes)
				{
					let a = i.x - x, b = i.y - y;
					if (Math.sqrt(a * a + b * b) < closest)
					{
						closest = Math.sqrt(a * a + b * b);
						closestNode = i;
					}
				}
				dist = this.distFromSpawn(x, y);
			}
			while (++att < 1000 && (!this.canSpawn(x, y) || dist < 200 || dist > 300));
			if (att >= 1000)
				continue;
			let path = this.pathfind(x, y, closestNode.x, closestNode.y);
			if (path === false)
				continue;
			this.pathfindingNodes.push({
				x: x,
				y: y,
				path: (path.reverse()).concat(closestNode.path),
				dist: dist
			});
		}
		for (let i = 0; i < 10; i++)
		{
			let x, y, att = 0, dist, closest, closestNode;
			do
			{
				closest = Infinity;
				x = Math.floor(Math.random() * 10 * this.world.sectors.length);
				y = Math.floor(Math.random() * 10 * this.world.sectors.length);
				for (let i of this.pathfindingNodes)
				{
					let a = i.x - x, b = i.y - y;
					if (Math.sqrt(a * a + b * b) < closest)
					{
						closest = Math.sqrt(a * a + b * b);
						closestNode = i;
					}
				}
				dist = this.distFromSpawn(x, y);
			}
			while (++att < 1000 && (!this.canSpawn(x, y) || dist < 300 || dist > 400));
			if (att >= 1000)
				continue;
			let path = this.pathfind(x, y, closestNode.x, closestNode.y);
			if (path === false)
				continue;
			this.pathfindingNodes.push({
				x: x,
				y: y,
				path: (path.reverse()).concat(closestNode.path),
				dist: dist
			});
		}
	}

	distFromSpawn(x, y)
	{
		let spawnX = Math.floor(this.spawn.x / 30);
		let spawnY = Math.floor(this.spawn.y / 30);

		let a = x - spawnX;
		let b = y - spawnY;
		return Math.sqrt(a * a + b * b);
	}

	findPlayerSpawn()
	{
		let x, y;
		do
		{
			x = Math.floor(Math.random() * 10 * this.world.sectors.length);
			y = Math.floor(Math.random() * 10 * this.world.sectors.length);
		}
		while (!this.canSpawn(x, y));
		this.player.x = x * 30;
		this.player.y = y * 30;
		this.spawn = this.world.placeBlock(this.player.x, this.player.y, 5, 5, 0, 1000);
	}

	createMiningBot()
	{
		if (this.spawn === null)
			return;

		let bot = new MiningBot(this.spawn.x, this.spawn.y);
		this.miningBots.push(bot);
	}

	canSpawn(x, y)
	{
		if (x < 5 || x > this.world.sectors.length * 10 - 3 || y < 5 || y > this.world.sectors.length * 10 - 3)
			return false;

		for (let xr = -4; xr < 5; xr++)
		{
			for (let yr = -4; yr < 5; yr++)
			{
				if (!this.getBlock((x + xr) * 30, (y + yr) * 30))
				{
					return false;
				}
			}
		}
		return true;
	}

	createWorldWalls()
	{
		for (let x = 0; x < this.world.sectors.length * 10; x++)
		{
			for (let y = 0; y < this.world.sectors.length * 10; y++)
			{
				if (x === 0 || x === this.world.sectors.length * 10 - 1 || y === 0 || y === this.world.sectors.length * 10 - 1)
				{
					this.world.sectors[Math.floor(x / 10)][Math.floor(y / 10)].blocks[x % 10][y % 10] = 0;
				}
			}
		}
	}

	movePlayer(delta)
	{
		let direction;

		if (this.keys["w"])
			direction = Math.PI * 1.5;

		if (this.keys["a"])
			direction = Math.PI;

		if (this.keys["s"])
			direction = Math.PI / 2;

		if (this.keys["d"])
			direction = 0;

		if (this.keys["w"] && this.keys["d"])
			direction = Math.PI * 1.75;

		if (this.keys["w"] && this.keys["a"])
			direction = Math.PI * 1.25;

		if (this.keys["s"] && this.keys["a"])
			direction = Math.PI * 0.75;

		if (this.keys["s"] && this.keys["d"])
			direction = Math.PI * 0.25;

		if (typeof direction === "undefined")
			return;

		this.player.rotateTo(direction - Math.PI * 1.5);

		let newX = this.player.x + Math.cos(direction) * 5 * delta;
		let newY = this.player.y + Math.sin(direction) * 5 * delta;

		if (this.getBlock(newX - 20, this.player.y - 20) !== 0 &&
			this.getBlock(newX + 20, this.player.y - 20) !== 0 &&
			this.getBlock(newX - 20, this.player.y + 20) !== 0 &&
			this.getBlock(newX + 20, this.player.y + 20) !== 0)
		{
			this.player.x = newX;
		}

		if (this.getBlock(this.player.x - 20, newY - 20) !== 0 &&
			this.getBlock(this.player.x + 20, newY - 20) !== 0 &&
			this.getBlock(this.player.x - 20, newY + 20) !== 0 &&
			this.getBlock(this.player.x + 20, newY + 20) !== 0)
		{
			this.player.y = newY;
		}
	}

	pathfindingPath(current)
	{
		let temp = current;
		let path = [temp];

		while (temp.previous)
		{
			path.push(temp.previous);
			temp = temp.previous;
		}

		return path;
	}

	pathfind(x1, y1, x2, y2, timeout)
	{
		timeout = timeout || Infinity;
		let minFlag;
		if (Math.abs(x1 - x2) + Math.abs(y1 - y2) > 50 && this.miningFlags.length > 0)
		{
			let minLength = Infinity;
			for (let flag of this.miningFlags)
			{
				if (Math.abs(x1 - flag.x) + Math.abs(y1 - flag.y) > Math.abs(x1 - x2) + Math.abs(y1 - y2))
					continue;

				let dist = Math.abs(x1 - flag.x) + Math.abs(y1 - flag.y);
				if (dist < minLength)
				{
					minFlag = flag;
					minLength = dist;
				}
			}
			if (minFlag)
				x2 = minFlag.x, y2 = minFlag.y;
		}
		let current = new PathfindingNode(x1, y1);
		current.g = 0;
		current.f = 0;
		let openSet = [current];
		let closedSet = [];

		while (openSet.length > 0)
		{
			let min = Infinity, minElem;
			for (let elem of openSet)
				if (elem.f < min)
					min = elem.f, minElem = elem;
			current = minElem;

			if (current.x === x2 && current.y === y2)
			{
				if (!minFlag)
					return this.pathfindingPath(current);
				else
					return minFlag.path.concat(this.pathfindingPath(current));
			}

			openSet.splice(openSet.indexOf(current), 1);
			closedSet.push(current);
			let neighbours = this.getNeighbours(current, closedSet, openSet);

			if (closedSet.length >= timeout)
				return false;

			for (let item of neighbours)
			{
				if (closedSet.includes(item))
					continue;

				let tentativeGScore = current.g + 1;
				if (tentativeGScore < item.g)
				{
					item.previous = current;
					item.g = tentativeGScore;
					item.f = item.g + Math.abs(x2 - item.x) + Math.abs(y2 - item.y);
					if (!openSet.includes(item))
					{
						openSet.push(item);
					}
				}
			}
		}

		return false;
	}

	getNeighbours(elem, closedSet, openSet)
	{
		let nList = [];
		if (elem.x * 20 > 0 && this.getBlock(elem.x * 30 - 30, elem.y * 30))
			nList.push(new PathfindingNode(elem.x - 1, elem.y));

		if (elem.x * 20 < this.world.sectors.length * 10 * 30 - 30 && this.getBlock(elem.x * 30 + 30, elem.y * 30))
			nList.push(new PathfindingNode(elem.x + 1, elem.y));

		if (elem.y * 20 > 0 && this.getBlock(elem.x * 30, elem.y * 30 - 30))
			nList.push(new PathfindingNode(elem.x, elem.y - 1));

		if (elem.y * 20 < this.world.sectors.length * 10 * 30 - 30 && this.getBlock(elem.x * 30, elem.y * 30 + 30))
			nList.push(new PathfindingNode(elem.x, elem.y + 1));
		
		outer: for (let item = nList.length - 1; item > -1; item--)
		{
			for (let closed of openSet)
			{
				if (closed.x === nList[item].x && closed.y === nList[item].y)
				{
					nList.splice(item, 1);
					continue outer;
				}
			}
			
			for (let closed of closedSet)
			{
				if (closed.x === nList[item].x && closed.y === nList[item].y)
				{
					nList.splice(item, 1);
					continue outer;
				}
			}
		}

		return nList;
	}

	getBlock(x, y)
	{
		let section = this.getSector(x, y);

		let blockX = Math.floor(x % 300 / 30);
		let blockY = Math.floor(y % 300 / 30);

		return section.blocks[blockX][blockY];
	}

	getSector(x, y)
	{
		return this.world.sectors[Math.floor(x / 300)][Math.floor(y / 300)];
	}

	renderingPosX(x)
	{
		return x + this.ctx.canvas.width / 2 - this.player.x;
	}

	renderingPosY(y)
	{
		return y + this.ctx.canvas.height / 2 - this.player.y;
	}

	keydown(event)
	{
		if (this.gameOver && event.key === " ")
		{
			location.reload();
			return;
		}
		if (event.key === " ")
			this.paused = !this.paused;
		else if (event.key.toLowerCase() === "x")
		{
			let x = Math.floor((this.mousePos.x - this.ctx.canvas.width / 2 + this.player.x) / 30) * 30;
			let y = Math.floor((this.mousePos.y - this.ctx.canvas.height / 2 + this.player.y) / 30) * 30;

			for (let i = this.world.blocks.length - 1; i > -1; i--)
			{
				if (this.world.blocks[i].x === x && this.world.blocks[i].y === y)
				{
					this.world.blocks.splice(i, 1);
				}
			}
		}
		this.keys[event.key.toLowerCase()] = true;
	}

	keyup(event)
	{
		this.keys[event.key.toLowerCase()] = false;
	}

	mousedown(event)
	{
		if (event.clientX >= canvas.width - 350 && event.clientY >= canvas.height - 250)
		{
			if (event.clientX >= this.ctx.canvas.width - 340 && event.clientX <= this.ctx.canvas.width - 190 &&
				event.clientY >= this.ctx.canvas.height - 55 && event.clientY <= this.ctx.canvas.height - 15)
			{
				if (this.inventory.copper >= 25 && this.inventory.electronium >= 5)
				{
					this.inventory.copper -= 25;
					this.inventory.electronium -= 5;
					this.createMiningBot();
					return;
				}
				else
				{
					this.message = "You do not have enough resources";
					this.messageTime = 120;
					return;
				}
			}
			if (event.clientX >= this.ctx.canvas.width - 170 && event.clientX <= this.ctx.canvas.width - 20 &&
				event.clientY >= this.ctx.canvas.height - 55 && event.clientY <= this.ctx.canvas.height - 15)
			{
				this.player.x = this.spawn.x;
				this.player.y = this.spawn.y;
				this.audio.respawn.play();
			}
			if (event.clientX >= this.ctx.canvas.width - 340 &&
				event.clientY >= this.ctx.canvas.height - 205 &&
				event.clientX <= this.ctx.canvas.width - 300 &&
				event.clientY <= this.ctx.canvas.height - 165)
				this.itemSelected = this.itemSelected === 0 ? null : 0;
			
			if (event.clientX >= this.ctx.canvas.width - 290 &&
				event.clientY >= this.ctx.canvas.height - 205 &&
				event.clientX <= this.ctx.canvas.width - 250 &&
				event.clientY <= this.ctx.canvas.height - 165)
				this.itemSelected = this.itemSelected === 1 ? null : 1;

			if (event.clientX >= this.ctx.canvas.width - 240 &&
				event.clientY >= this.ctx.canvas.height - 205 &&
				event.clientX <= this.ctx.canvas.width - 200 &&
				event.clientY <= this.ctx.canvas.height - 165)
				this.itemSelected = this.itemSelected === 2 ? null : 2;

			if (event.clientX >= this.ctx.canvas.width - 190 &&
				event.clientY >= this.ctx.canvas.height - 205 &&
				event.clientX <= this.ctx.canvas.width - 150 &&
				event.clientY <= this.ctx.canvas.height - 165)
				this.itemSelected = this.itemSelected === 3 ? null : 3;

			if (event.clientX >= this.ctx.canvas.width - 140 &&
				event.clientY >= this.ctx.canvas.height - 205 &&
				event.clientX <= this.ctx.canvas.width - 100 &&
				event.clientY <= this.ctx.canvas.height - 165)
				this.itemSelected = this.itemSelected === 4 ? null : 4;

			if (event.clientX >= this.ctx.canvas.width - 90 &&
				event.clientY >= this.ctx.canvas.height - 205 &&
				event.clientX <= this.ctx.canvas.width - 50 &&
				event.clientY <= this.ctx.canvas.height - 165)
				this.itemSelected = this.itemSelected === 5 ? null : 5;

			if (event.clientX >= this.ctx.canvas.width - 340 &&
				event.clientY >= this.ctx.canvas.height - 155 &&
				event.clientX <= this.ctx.canvas.width - 300 &&
				event.clientY <= this.ctx.canvas.height - 115)
				this.itemSelected = this.itemSelected === 6 ? null : 6;

			return;
		}
		this.mouseDown = true;
		this.mousePos = {x: event.clientX, y: event.clientY};
	}

	mouseup(event)
	{
		this.mouseDown = false;
		this.mousePos = {x: event.clientX, y: event.clientY};
	}

	mousemove(event)
	{
		this.mousePos = {x: event.clientX, y: event.clientY};
	}

	loadImage(url)
	{
		let img = new Image();
		img.src = url;
		return img;
	}

	loadAudio(url)
	{
		let audio = new Audio();
		audio.src = url;
		return audio;
	}
}
