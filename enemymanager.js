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
			this.time = 90 * 60;
			for (let base of this.bases)
			{
				let totalValue = Math.floor(Math.pow(this.level, 1.2)) + 1;
				while (totalValue > 0)
				{
					let rand = Math.floor(Math.random() * 4);
					switch (rand)
					{
						case 0:
							this.enemies.push(new BasicEnemy(base.x * 30, base.y * 30, base.path));
							totalValue -= 1;
							break;
						case 1:
							if (totalValue < 5)
								break;
							this.enemies.push(new StrongEnemy(base.x * 30, base.y * 30, base.path));
							totalValue -= 5;
							break;
						case 2:
							if (totalValue < 10)
								break;
							this.enemies.push(new FastEnemy(base.x * 30, base.y * 30, base.path));
							totalValue -= 10;
							break;
						case 3:
							if (totalValue < 20)
								break;
							this.enemies.push(new MegaEnemy(base.x * 30, base.y * 30, base.path));
							totalValue -= 20;
							break;
						default:
							break;
					}
				}
			}
		}
	}

	render()
	{
		for (let enemy of this.enemies)
		{
			enemy.render(this.game);
		}

		//for (let base of this.bases)
		//{
		//	this.game.ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
		//	this.game.ctx.fillRect(
		//		this.game.renderingPosX(base.x * 30),
		//		this.game.renderingPosY(base.y * 30),
		//		60,
		//		60
		//	);
		//}
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
