let canvas, ctx, game;

window.onload = function()
{
	canvas = document.getElementById("gameCanvas");
	ctx = canvas.getContext("2d");

	canvas.width = document.body.clientWidth;
	canvas.height = document.body.clientHeight;

	renderMainScreen();

	window.addEventListener("mousedown", event =>
	{
		if (game)
			return;

		if (event.clientX >= canvas.width / 2 - 100 && event.clientY >= canvas.height / 2 - 50 &&
			event.clientX <= canvas.width / 2 + 100 && event.clientY <= canvas.height / 2 + 50)
		{
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = "black";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = "white";
			ctx.textAlign = "center";
			ctx.font = "30px Courier New";
			ctx.fillText("Creating pathfinding graph...", canvas.width / 2, canvas.height / 2);
			ctx.textAlign = "left";

			window.setTimeout(startGame, 30);
		}
	});
}

window.onresize = function()
{
	if (!canvas)
		return;

	canvas.width = document.body.clientWidth;
	canvas.height = document.body.clientHeight;

	if (!game)
		renderMainScreen();
}

function renderMainScreen()
{
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "white";
	ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 - 50, 200, 100);
	ctx.textAlign = "center";
	ctx.font = "50px Courier New";
	ctx.fillText("The Deep Caverns", canvas.width / 2, canvas.height / 4);
	ctx.fillStyle = "black";
	ctx.font = "20px Courier New";
	ctx.fillText("Start game", canvas.width / 2, canvas.height / 2);
	ctx.textAlign = "left";
}

function startGame()
{
	game = new Game(ctx);

	window.addEventListener("keydown", game.keydown.bind(game));
	window.addEventListener("keyup", game.keyup.bind(game));
	window.addEventListener("mousedown", game.mousedown.bind(game));
	window.addEventListener("mouseup", game.mouseup.bind(game));
	window.addEventListener("mousemove", game.mousemove.bind(game));
}
