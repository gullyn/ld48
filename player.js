class Player
{
	constructor(x, y)
	{
		this.x = x;
		this.y = y;
		this.miningTimeout = 0;
		this.bullets = [];
		this.reloadTime = 0;
		this.rotation = 0;
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
		game.ctx.save();
		game.ctx.translate(
			game.renderingPosX(this.x),
			game.renderingPosY(this.y)
		);
		game.ctx.rotate(this.rotation);
		game.ctx.drawImage(game.assets.player, -20, -20, 40, 40);
		game.ctx.restore();

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
}
