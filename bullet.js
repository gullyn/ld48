class Bullet
{
	constructor(x, y, rotation, enemy)
	{
		this.x = x;
		this.y = y;
		this.rotation = rotation;
		this.lifeTime = 1000;
		this.speed = 10;
		this.enemy = enemy || false;
		this.damage = 10;
	}

	update(game, delta)
	{
		this.x += Math.cos(this.rotation) * this.speed * delta;
		this.y += Math.sin(this.rotation) * this.speed * delta;
		this.lifeTime -= delta;

		if (game.getBlock(this.x, this.y) === 0 ||
			this.lifeTime <= 0)
		{
			return true;
		}

		if (this.enemy)
		{
			for (let block of game.world.blocks)
			{
				let trueX = block.x - Math.floor(block.width / 2) * 30;
				let trueY = block.y - Math.floor(block.height / 2) * 30;

				if (this.x >= trueX && this.y >= trueY &&
					this.x <= trueX + block.width * 30 && this.y <= trueY + block.width * 30)
				{
					block.takeDamage(this.damage);
					if (block.health <= 0 && block.type === 0)
						game.gameOver = true;
					return true;
				}
			}
		}
		else
		{
			for (let enemy of game.enemies.enemies)
			{
				let a = this.x - enemy.x - 15;
				let b = this.y - enemy.y - 15;
				if (Math.sqrt(a * a + b * b) < 15)
				{
					enemy.takeDamage(10);
					return true;
				}
			}
		}
	}

	render(game)
	{
		game.ctx.save();
		game.ctx.translate(
			game.renderingPosX(this.x),
			game.renderingPosY(this.y)
		);
		game.ctx.rotate(this.rotation + Math.PI / 2);
		game.ctx.fillStyle = "blue";
		game.ctx.fillRect(-3, -6, 6, 12);
		game.ctx.restore();
	}
}
