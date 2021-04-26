class EnemyManager
{
	constructor(game)
	{
		this.game = game;
		this.bases = [];
		this.enemies = [];
		this.createBases();
		this.level = 0;
		this.time = 3 * 60 * 60;
	}

	update(delta)
	{
		for (let i = this.enemies.length - 1; i > -1; i--)
		{
			if (this.enemies[i].update(this.game, delta))
			{
				this.enemies.splice(i, 1);
			}
		}

		this.time -= delta;
		if (this.time <= 0)
		{
			this.level++;
			this.time = 10000;
			for (let base of this.bases)
			{
				this.enemies.push(new Enemy(base.x * 30, base.y * 30, base.path));
			}
		}
	}

	render()
	{
		for (let enemy of this.enemies)
		{
			enemy.render(this.game);
		}

		for (let base of this.bases)
		{
			this.game.ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
			this.game.ctx.fillRect(
				this.game.renderingPosX(base.x * 30),
				this.game.renderingPosY(base.y * 30),
				60,
				60
			);
		}
	}

	createBases()
	{
		while (this.bases.length < 5)
		{
			let x, y, closest, closestNode;
			do
			{
				x = Math.floor(Math.random() * this.game.world.sectors.length * 10);
				y = Math.floor(Math.random() * this.game.world.sectors.length * 10);

				closest = Infinity;
				for (let i of this.game.pathfindingNodes)
				{
					let a = i.x - x;
					let b = i.y - y;
					if (Math.sqrt(a * a + b * b) < closest)
					{
						closest = Math.sqrt(a * a + b * b);
						closestNode = i;
					}
				}
			}
			while (!this.game.canSpawn(x, y) ||
				(Math.abs(x - this.game.spawn.x / 30) + Math.abs(y - this.game.spawn.y / 30) < 100));

			let path = this.game.pathfind(closestNode.x, closestNode.y, x, y, 10000);

			if (path === false)
				continue;

			this.bases.push({
				x: x,
				y: y,
				path: path.concat(closestNode.path)
			});
		}
	}
}
