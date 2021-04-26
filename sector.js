class Sector
{
	constructor(x, y)
	{
		this.blocks = [];
		this.blockData = [];
		this.x = x;
		this.y = y;
		this.generate();
	}

	generate()
	{
		for (let x = 0; x < 10; x++)
		{
			this.blocks.push([]);
			this.blockData.push([]);
			for (let y = 0; y < 10; y++)
			{
				let blockType = 0;
				let noiseX = (this.x * 10 + x) / 35, noiseY = (this.y * 10 + y) / 35;
				let noiseValue = Math.min(Math.abs(
					(noise.perlin2(noiseX, noiseY) * 3 + noise.simplex2(noiseX + 1e4, noiseY + 1e4) * 3) / 2
				), 1);
				let blockData = {};

				let ore1Noise = noise.perlin2(noiseX * 3 + 1e5, noiseY * 3 + 1e5);
				let ore2Noise = noise.perlin2(noiseX * 3 + 2e5, noiseY * 3 + 2e5);
				let ore3Noise = noise.perlin2(noiseX * 3 + 4e5, noiseY * 3 + 4e5);
				let ore4Noise = noise.perlin2(noiseX * 3 + 5e5, noiseY * 3 + 5e5);
				let colorNoise = noise.perlin2(noiseX * 4 + 3e5, noiseY * 4 + 3e5);

				if (noiseValue < 0.5)
				{
					let r = 130, g = 130, b = 130;
					blockType = 1;
					if (colorNoise <= 0)
						g -= Math.floor(colorNoise * 60);
					blockData["c"] = `rgb(${r}, ${g}, ${b})`;
					if (ore1Noise > 0.5)
					{
						blockData["count"] = Math.floor(Math.random() * 50) + 25;
						blockType = 2;
					}
					else if (ore2Noise > 0.6)
					{
						blockData["count"] = Math.floor(Math.random() * 25) + 20;
						blockType = 3;
					}
					else if (ore3Noise > 0.6)
					{
						blockData["count"] = Math.floor(Math.random() * 25) + 10;
						blockType = 4;
					}
					else if (ore4Noise > 0.6)
					{
						blockData["count"] = Math.floor(Math.random() * 10) + 5;
						blockType = 5;
					}
				}
				
				this.blocks[this.blocks.length - 1].push(blockType);
				this.blockData[this.blockData.length - 1].push(blockData);
			}
		}
	}

	render(game)
	{
		if ((this.x * 300 > game.player.x + game.ctx.canvas.width / 2 || this.y * 300 > game.player.y + game.ctx.canvas.height / 2) ||
			(this.x * 300 + 300 < game.player.x - game.ctx.canvas.width / 2 || this.y * 300 + 300 < game.player.y - game.ctx.canvas.height / 2))
		{
			return;
		}

		for (let x = 0; x < this.blocks.length; x++)
		{
			for (let y = 0; y < this.blocks[x].length; y++)
			{
				let blockX = x * 30 + this.x * 300 - game.player.x;
				let blockY = y * 30 + this.y * 300 - game.player.y;
				if (game.blackCircle && Math.sqrt(blockX * blockX + blockY * blockY) > 550)
					continue;

				let color = this.blockData[x][y]["c"];

				if (this.blocks[x][y] === 0)
				{
					game.ctx.drawImage(
						game.wallCanvas,
						game.renderingPosX(x * 30 + this.x * 300),
						game.renderingPosY(y * 30 + this.y * 300),
						30,
						30
					);
					continue;
				}

				game.ctx.fillStyle = color;
				game.ctx.fillRect(
					game.renderingPosX(x * 30 + this.x * 300),
					game.renderingPosY(y * 30 + this.y * 300),
					31,
					31
				);

				let squareColor = "rgba(0, 0, 0, 0)";
				switch (this.blocks[x][y])
				{
					case 0:
					case 1:
						break;
					case 2:
						squareColor = "rgba(255, 128, 0, 1)";
						break;
					case 3:
						squareColor = "rgba(255, 230, 0, 1)";
						break;
					case 4:
						squareColor = "rgba(255, 30, 0, 1)";
						break;
					case 5:
						squareColor = "rgba(9, 153, 9, 1)";
						break;
					default:
						break;
				}
				game.ctx.fillStyle = squareColor;
				game.ctx.fillRect(
					game.renderingPosX(x * 30 + this.x * 300) + 7.5,
					game.renderingPosY(y * 30 + this.y * 300) + 7.5,
					15,
					15
				);
			}
		}
	}
}
