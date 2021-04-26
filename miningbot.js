class MiningBot
{
	constructor(x, y)
	{
		this.x = x;
		this.y = y;
		this.path = null;
		this.pathItem = null;
		this.reversing = false;
		this.collecting = true;
		this.inventory = {copper: 0, electronium: 0, firite: 0, radium: 0};
		this.speed = 4;
		this.maxItems = 10;
		this.rotation = 0;
	}

	update(game, delta)
	{
		if (this.path === null)
		{
			if (game.miningFlags.length === 0)
				return;

			let rand = Math.floor(Math.random() * game.miningFlags.length);
			this.path = game.miningFlags[rand].path;
			if (this.path === false)
				this.path = null;
			this.pathItem = 0;
			this.reversing = false;
			this.collecting = true;
		}
		else if (this.collecting && this.path !== null)
		{
			let lastElem = this.path[this.path.length - 1];
			let blockType = game.getBlock(lastElem.x * 30, lastElem.y * 30);
			if (blockType !== 2 && blockType !== 3 && blockType !== 4 && blockType !== 5)
				this.collecting = false;
		}

		if (this.pathItem === this.path.length - 1 && this.collecting)
		{
			if (game.getBlock(this.x, this.y) === 2)
			{
				if (this.inventory.copper >= this.maxItems)
				{
					this.inventory.copper = this.maxItems;
					this.reversing = true;
				}
				else
				{
					this.inventory.copper += 0.032 * delta;
					let blockX = Math.floor(this.x / 30) % 10;
					let blockY = Math.floor(this.y / 30) % 10;
					let section = game.getSector(this.x, this.y);
					let block = section.blockData[blockX][blockY];
					block["count"] -= 0.032 * delta;
					if (block["count"] <= 0)
					{
						section.blocks[blockX][blockY] = 1;
						for (let i = game.miningFlags.length - 1; i > -1; i--)
						{
							if (game.miningFlags[i].x === blockX + section.x * 10 &&
								game.miningFlags[i].y === blockY + section.y * 10)
							{
								game.miningFlags.splice(i, 1);
							}
						}
						this.reversing = true;
					}
					return;
				}
			}
			else if (game.getBlock(this.x, this.y) === 3)
			{
				if (this.inventory.electronium >= this.maxItems)
				{
					this.inventory.electronium = this.maxItems;
					this.reversing = true;
				}
				else
				{
					this.inventory.electronium += 0.016 * delta;
					let blockX = Math.floor(this.x / 30) % 10;
					let blockY = Math.floor(this.y / 30) % 10;
					let section = game.getSector(this.x, this.y);
					let block = section.blockData[blockX][blockY];
					block["count"] -= 0.016 * delta;
					if (block["count"] <= 0)
					{
						section.blocks[blockX][blockY] = 1;
						for (let i = game.miningFlags.length - 1; i > -1; i--)
						{
							if (game.miningFlags[i].x === blockX + section.x * 10 &&
								game.miningFlags[i].y === blockY + section.y * 10)
							{
								game.miningFlags.splice(i, 1);
							}
						}
					}
					this.reversing = true;
					return;
				}
			}
			else if (game.getBlock(this.x, this.y) === 4)
			{
				if (this.inventory.firite >= this.maxItems)
				{
					this.inventory.firite = this.maxItems;
					this.reversing = true;
				}
				else
				{
					this.inventory.firite += 0.008 * delta;
					let blockX = Math.floor(this.x / 30) % 10;
					let blockY = Math.floor(this.y / 30) % 10;
					let section = game.getSector(this.x, this.y);
					let block = section.blockData[blockX][blockY];
					block["count"] -= 0.008 * delta;
					if (block["count"] <= 0)
					{
						section.blocks[blockX][blockY] = 1;
						for (let i = game.miningFlags.length - 1; i > -1; i--)
						{
							if (game.miningFlags[i].x === blockX + section.x * 10 &&
								game.miningFlags[i].y === blockY + section.y * 10)
							{
								game.miningFlags.splice(i, 1);
							}
						}
					}
					this.reversing = true;
					return;
				}
			}
			else if (game.getBlock(this.x, this.y) === 5)
			{
				if (this.inventory.radium >= this.maxItems)
				{
					this.inventory.radium = this.maxItems;
					this.reversing = true;
				}
				else
				{
					this.inventory.radium += 0.008 * delta;
					let blockX = Math.floor(this.x / 30) % 10;
					let blockY = Math.floor(this.y / 30) % 10;
					let section = game.getSector(this.x, this.y);
					let block = section.blockData[blockX][blockY];
					block["count"] -= 0.008 * delta;
					if (block["count"] <= 0)
					{
						section.blocks[blockX][blockY] = 1;
						for (let i = game.miningFlags.length - 1; i > -1; i--)
						{
							if (game.miningFlags[i].x === blockX + section.x * 10 &&
								game.miningFlags[i].y === blockY + section.y * 10)
							{
								game.miningFlags.splice(i, 1);
							}
						}
					}
					this.reversing = true;
					return;
				}
			}
		}
		else if (!this.collecting)
		{
			this.reversing = true;
		}

		if (this.pathItem === 0 && this.reversing)
		{
			game.inventory.copper += Math.round(this.inventory.copper);
			this.inventory.copper = 0;
			game.inventory.electronium += Math.round(this.inventory.electronium);
			this.inventory.electronium = 0;
			game.inventory.firite += Math.round(this.inventory.firite);
			this.inventory.firite = 0;
			game.inventory.radium += Math.round(this.inventory.radium);
			this.inventory.radium = 0;
			this.path = null;
			return;
		}

		let currentTile = this.path[this.pathItem];
		let nextTile = this.reversing ? this.path[this.pathItem - 1] : this.path[this.pathItem + 1];
		if (currentTile.x > nextTile.x)
		{
			this.y = nextTile.y * 30;
			this.x = Math.max(nextTile.x * 30, this.x - this.speed * delta);
			this.rotateTo(Math.PI * 1.5);
		}

		if (currentTile.x < nextTile.x)
		{
			this.y = nextTile.y * 30;
			this.x = Math.min(nextTile.x * 30, this.x + this.speed * delta);
			this.rotateTo(Math.PI * 0.5);
		}

		if (currentTile.y > nextTile.y)
		{
			this.x = nextTile.x * 30;
			this.y = Math.max(nextTile.y * 30, this.y - this.speed * delta);
			this.rotateTo(0);
		}

		if (currentTile.y < nextTile.y)
		{
			this.x = nextTile.x * 30;
			this.y = Math.min(nextTile.y * 30, this.y + this.speed * delta);
			this.rotateTo(Math.PI);
		}

		if (this.x === nextTile.x * 30 && this.y === nextTile.y * 30)
			this.pathItem += this.reversing ? -1 : 1;
	}

	rotateTo(rotation)
	{
		let tempr = this.rotation, r1 = tempr, n1 = 0, n2 = 0;
		let r = ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
		while (Math.abs(r - r1) > Math.PI / 32)
		{
			tempr += Math.PI / 64;
			r1 = ((tempr % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
			n1++;
		}
		tempr = this.rotation, r1 = tempr;
		while (Math.abs(r - r1) > Math.PI / 32)
		{
			tempr -= Math.PI / 64;
			r1 = ((tempr % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
			n2++;
		}
		if (n1 <= n2)
		{
			this.rotation += Math.PI / 32;
		}
		else
		{
			this.rotation -= Math.PI / 32;
		}
	}

	render(game)
	{
		game.ctx.save();
		game.ctx.translate(
			game.renderingPosX(this.x) + 15,
			game.renderingPosY(this.y) + 15
		);
		game.ctx.rotate(this.rotation);
		game.ctx.drawImage(game.assets.miningbot, -20, -20, 40, 40);
		game.ctx.restore();
	}
}
