class Player
{
	constructor(x, y)
	{
		this.x = x;
		this.y = y;
		this.miningTimeout = 0;
		this.bullets = [];
		this.reloadTime = 0;
	}

	update(game, delta)
	{
		this.reloadTime -= delta;
		for (let i = this.bullets.length - 1; i > -1; i--)
		{
			if (this.bullets[i].update(game, delta))
			{
				this.bullets.splice(i, 1);
			}
		}
	}

	render(game)
	{
		game.ctx.fillStyle = "black";
		game.ctx.beginPath();
		game.ctx.arc(game.renderingPosX(this.x), game.renderingPosY(this.y), 15, 0, Math.PI * 2);
		game.ctx.fill();

		for (let bullet of this.bullets)
		{
			bullet.render(game);
		}
	}

	shoot(rotation)
	{
		if (this.reloadTime > 0)
			return;

		this.bullets.push(new Bullet(this.x, this.y, rotation));
		this.reloadTime = 30;

		let rand = Math.floor(Math.random() * 3);

		if (rand === 0)
			game.audio.shoot1.play();
		else if (rand === 1)
			game.audio.shoot2.play();
		else
			game.audio.shoot3.play();
	}
}
