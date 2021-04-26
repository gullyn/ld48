class World
{
	constructor()
	{
		this.sectors = [];
		this.blocks = [];
		this.generate();
	}

	generate()
	{
		noise.seed(Math.random());
		for (let x = 0; x < 75; x++)
		{
			this.sectors.push([]);
			for (let y = 0; y < 75; y++)
			{
				this.sectors[this.sectors.length - 1].push(new Sector(x, y));
			}
		}
	}
	
	render(game)
	{
		for (let x = 0; x < this.sectors.length; x++)
		{
			for (let y = 0; y < this.sectors[x].length; y++)
			{
				this.sectors[x][y].render(game);
			}
		}

		for (let block of this.blocks)
		{
			block.render(game);
		}
	}

	update(game, delta)
	{
		for (let i = this.blocks.length - 1; i > -1; i--)
		{
			if (this.blocks[i].update(game, delta))
			{
				this.blocks.splice(i, 1);
			}
		}
	}

	placeBlock(x, y, width, height, type, health)
	{
		let color;
		switch (type)
		{
			case 2:
				color = "rgb(255, 128, 0)";
				break;
			case 3:
				color = "rgb(200, 30, 0)";
				break;
			case 4:
				color = "rgb(100, 30, 0)";
				break;
			default:
				color = "rgb(60, 60, 60)";
				break;
		}
		let block = new Block(x, y, width, height, color, type, health);
		this.blocks.push(block);
		return block;
	}
}
