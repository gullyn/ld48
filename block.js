class Block
{
	constructor(x, y, width, height, color, type, health)
	{
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.color = color;
		this.type = type;
		this.health = health;
		this.reloadTime = 0;
		this.bullets = [];
		this.target = null;
	}

	update(game, delta)
	{
		this.reloadTime -= delta;
		if (this.health <= 0)
			return true;

		for (let i = this.bullets.length - 1; i > -1; i--)
		{
			if (this.bullets[i].update(game, delta))
			{
				this.bullets.splice(i, 1);
			}
		}

		if (this.type === 1 || this.type === 4)
		{
			let closest = 15 * 30, closestEnemy = null;
			for (let enemy of game.enemies.enemies)
			{
				let a = this.x - enemy.x;
				let b = this.y - enemy.y;
				if (Math.sqrt(a * a + b * b) < closest)
				{
					closest = Math.sqrt(a * a + b * b);
					closestEnemy = enemy;
				}
			}
			this.target = closestEnemy;
			if (this.reloadTime <= 0 && this.target !== null)
			{
				this.shoot();
				this.reloadTime = this.type === 1 ? 60 : 10;
			}
		}
	}

	render(game)
	{
		for (let bullet of this.bullets)
		{
			bullet.render(game);
		}

		if (this.type === 1)
		{
			game.ctx.beginPath();
			game.ctx.fillStyle = "#353535";
			game.ctx.arc(
				game.renderingPosX(this.x - Math.floor(this.width / 2) * 30) + 15,
				game.renderingPosY(this.y - Math.floor(this.height / 2) * 30) + 15,
				15,
				0,
				Math.PI * 2
			);
			game.ctx.fill();
			let rotation = this.target === null ? Math.PI * 1.5 : Math.atan2(this.target.y - this.y, this.target.x - this.x);
			game.ctx.save();
			game.ctx.translate(
				game.renderingPosX(this.x - Math.floor(this.width / 2) * 30) + 15,
				game.renderingPosY(this.y - Math.floor(this.height / 2) * 30) + 15
			);
			game.ctx.rotate(rotation - Math.PI);
			game.ctx.fillStyle = "brown";
			game.ctx.fillRect(-20, -4, 22, 8);
			game.ctx.restore();
		}
		else if (this.type === 4)
		{
			game.ctx.beginPath();
			game.ctx.fillStyle = "red";
			game.ctx.arc(
				game.renderingPosX(this.x - Math.floor(this.width / 2) * 30) + 15,
				game.renderingPosY(this.y - Math.floor(this.height / 2) * 30) + 15,
				15,
				0,
				Math.PI * 2
			);
			game.ctx.fill();
			game.ctx.beginPath();
			game.ctx.fillStyle = "#353535";
			game.ctx.arc(
				game.renderingPosX(this.x - Math.floor(this.width / 2) * 30) + 15,
				game.renderingPosY(this.y - Math.floor(this.height / 2) * 30) + 15,
				12,
				0,
				Math.PI * 2
			);
			game.ctx.fill();
			let rotation = this.target === null ? Math.PI * 1.5 : Math.atan2(this.target.y - this.y, this.target.x - this.x);
			game.ctx.save();
			game.ctx.translate(
				game.renderingPosX(this.x - Math.floor(this.width / 2) * 30) + 15,
				game.renderingPosY(this.y - Math.floor(this.height / 2) * 30) + 15
			);
			game.ctx.rotate(rotation - Math.PI);
			game.ctx.fillStyle = "yellow";
			game.ctx.fillRect(-20, -4, 22, 8);
			game.ctx.restore();
		}
		else
		{
			game.ctx.fillStyle = this.color;
			game.ctx.fillRect(
				game.renderingPosX(this.x - Math.floor(this.width / 2) * 30),
				game.renderingPosY(this.y - Math.floor(this.height / 2) * 30),
				this.width * 30,
				this.height * 30
			);
		}
	}

	takeDamage(damage)
	{
		this.health -= damage;
	}

	shoot()
	{
		let rotation = Math.atan2(this.target.y - this.y, this.target.x - this.x);
		let spread = this.type === 4 ? Math.PI / 12 : 0;
		let addSpread = Math.random() * spread - spread / 2;
		this.bullets.push(new Bullet(this.x + 15, this.y + 15, rotation + addSpread));
	}
}
