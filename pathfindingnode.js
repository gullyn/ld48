class PathfindingNode
{
	constructor(x, y)
	{
		this.x = x;
		this.y = y;
		this.f = Infinity;
		this.g = Infinity;
		this.previous = null;
	}
}
