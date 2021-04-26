class Enemy
{
	constructor(x, y, path, speed, reloadTime, health)
	{
		this.x = x;
		this.y = y;
		this.path = path;
		this.pathItem = 0;
		this.speed = speed;
		this.bullets = [];
		this.reloadTime = reloadTime;
		this.health = health;
		this.stopped = false;
		this.targetBlock = null;
	}

	update(game, delta)
	{
		if (this.health <= 0)
		{
			return true;
		}
		for (let i = this.bullets.length - 1; i > -1; i--)
		{
			if (this.bullets[i].update(game, delta))
			{
				this.bullets.splice(i, 1);
			}
		}
		this.reloadTime -= delta;
		this.stopped = false;
		if (this.pathItem <= this.path.length - 7)
		{
			let x = this.path[this.pathItem + 2].x;
			let y = this.path[this.pathItem + 2].y;

			for (let block of game.world.blocks)
			{
				if (block.x === x * 30 && block.y === y * 30)
				{
					this.stopped = true;
					this.targetBlock = block;
				}
			}
		}
		if (this.pathItem >= this.path.length - 7)
		{
			
		}
		else if (!this.stopped)
		{
			let currentTile = this.path[this.pathItem];
			let nextTile = this.reversing ? this.path[this.pathItem - 1] : this.path[this.pathItem + 1];
			if (currentTile.x > nextTile.x)
			{
				this.y = nextTile.y * 30;
				this.x = Math.max(nextTile.x * 30, this.x - this.speed * delta);
				this.rotateTo(Math.PI * 0.5);
			}

			if (currentTile.x < nextTile.x)
			{
				this.y = nextTile.y * 30;
				this.x = Math.min(nextTile.x * 30, this.x + this.speed * delta);
				this.rotateTo(Math.PI * 1.5);
			}

			if (currentTile.y > nextTile.y)
			{
				this.x = nextTile.x * 30;
				this.y = Math.max(nextTile.y * 30, this.y - this.speed * delta);
				this.rotateTo(Math.PI);
			}

			if (currentTile.y < nextTile.y)
			{
				this.x = nextTile.x * 30;
				this.y = Math.min(nextTile.y * 30, this.y + this.speed * delta);
				this.rotateTo(0);
			}

			if (this.x === nextTile.x * 30 && this.y === nextTile.y * 30)
				this.pathItem++;
		}
		
		if (this.stopped && this.reloadTime <= 0)
		{
			this.shoot(this.targetBlock.x, this.targetBlock.y);
		}
		let a = this.x - game.spawn.x;
		let b = this.y - game.spawn.y;
		if (Math.sqrt(a * a + b * b) < 15 * 30 && this.reloadTime <= 0)
		{
			this.shoot(game.spawn.x, game.spawn.y);
		}

		let pa = this.x - game.player.x;
		let pb = this.y - game.player.y;
		if (Math.sqrt(pa * pa + pb * pb) < 15 * 30 && this.reloadTime <= 0)
		{
			this.shoot(game.player.x, game.player.y);
		}

		if (this.reloadTime <= 0)
		{
			let closest = 15 * 30, closestBlock;
			for (let block of game.world.blocks)
			{
				let a = this.x - block.x;
				let b = this.y - block.y;
				if (Math.sqrt(a * a + b * b) <= closest)
				{
					closest = Math.sqrt(a * a + b * b);
					closestBlock = block;
				}
			}
			if (closestBlock)
				this.shoot(closestBlock.x, closestBlock.y);
		}
	}

	shoot(x, y)
	{
		let angle = Math.atan2(y - this.y, x - this.x);
		this.bullets.push(new Bullet(this.x + 15, this.y + 15, angle, true));
		this.reloadTime = 60;
	}

	rotateTo(rotation)
	{

	}

	render(game)
	{
		for (let bullet of this.bullets)
		{
			bullet.render(game);
		}
		game.ctx.fillStyle = "red";
		game.ctx.fillRect(
			game.renderingPosX(this.x) + 5,
			game.renderingPosY(this.y) + 5,
			20,
			20
		);
	}

	takeDamage(damage)
	{
		this.health -= damage;
	}
}

class BasicEnemy extends Enemy
{
	constructor(x, y, path)
	{
		super(x, y, path, 3, 60, 50);
	}
}

class StrongEnemy extends Enemy
{
	constructor(x, y, path)
	{
		super(x, y, path, 4, 30, 100);
	}
}
