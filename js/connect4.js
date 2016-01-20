var socket;
var myTurn = false;
var opponent;
var canvas;
var board = [];
var yOffset = 64;
var margin = 8;
var padding = 4;
var mousePos = { "x": 0, "y": 0 };
var myColor;
var isMyTurn = true;
var piece;

$(function()
{
	canvas = new Canvas(document.getElementById("canvas"));

	$("#game").hide();
	$("#lobby").show();
	$("#find").click(() => connect());
	$("#canvas").mousemove((e) => movePiece(e));
	$("#canvas").click((e) => sendPiece(e));

	$("#sendChat").click(() => sendChat());
	$("#chatInput").keypress((e) => { if (e.which === 13) sendChat(); });
});

function getPos(el)
{
    for (var lx = 0, ly = 0; el != null; lx += el.offsetLeft, ly += el.offsetTop, el = el.offsetParent);
    return { "x": lx, "y": ly };
}

function posFromE(e)
{
	var p = getPos(document.getElementById("canvas"));
	p.x = e.clientX - p.x;
	p.y = e.clientY - p.y;

	return p;
}

function connect()
{
	$("#find").text("Looking for game...");
	$("#find").prop("disabled", true);
	var name = $("#name").val();
	var ip = $("#ip").val();
	var port = $("#port").val();
	var key = $("#key").val();

	initSocket(ip, port, () => 
	{
		socket.send("findGame", { "name": name, "key": key });
	});
}

function initSocket(ip, port, callback)
{
	socket = new Socket(ip, port);
	socket.onMessage = handleMessage;
	socket.onOpen = callback;

	socket.onClose = () => 
	{ 
		$("#find").prop("disabled", false); 
		$("#find").text("Find Game"); 
		alert("Connection closed.");
	};

	socket.connect();
}

function sendChat()
{
	var text = $("#chatInput").val();

	if (text.length !== 0)
	{
		$("#chatInput").val("");

		socket.send("chat", text);
	}
}

function makeChat(user, message)
{
	var $c = document.createElement("div");
	$c.className = "chatItem";

	var $name = document.createElement("span");
	$name.className = "chatItemName";
	$($name).text(user + ": ");

	var $message = document.createElement("span");
	$message.className = "chatItemMessage";
	$($message).text(message);

	$($c).append($name);
	$($c).append($message);

	// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$

	$("#chat").append($c);
	var w = $("#chat").get(0);
    w.scrollTop = w.scrollHeight;
}

var messageHandlers =
{
	start(data)
	{
		piece = data.piece;
		myColor = [ "#FF0000", "#FFFF00" ][+piece];
		opponent = data.opponent;

		$("#lobby").hide();
		$("#game").show();
		$("#gameHeader").text("vs " + opponent);
		$("#find").prop("disabled", false);
		$("#find").text("Find Game");
	},
	board(data)
	{
		board = data;

		yOffset = canvas.height() / board.length + margin;

		drawBoard();
	},
	turn(data)
	{
		isMyTurn = data;
	},
	queued(data)
	{
		$("#find").text("Added to queue...");
	},
	end(data)
	{
		var message = data ? "You won! Nice!" : "You lost! Nice!";
		alert(message);
	},
	chat(data)
	{
		makeChat(data.name, data.message);
	}
};

function handleMessage(message)
{
	var unpacked = Socket.unpack(message);
	var command = unpacked.command;
	var data = unpacked.data;

	if (messageHandlers.hasOwnProperty(command))
	{
		messageHandlers[command](data);
	}
}

function drawBoard()
{
	if (board.length === 0) return;
	if (board[0].length === 0) return;

	var width = canvas.width() - padding * 2;
	var height = canvas.height() - yOffset - padding * 2;

	var rw = width / board[0].length;
	var rh = height / board.length;

	var s = Math.min(rw, rh) - margin;
	console.log(`rw: ${rw} | rh: ${rh} | s: ${s}`);

	var colors = [ "#FFFFFF", "#FF0000", "#FFFF00" ];

	canvas.fillRect(0, yOffset, canvas.width(), canvas.height() - yOffset, "#FFFF55");
	canvas.drawRect(0, yOffset, canvas.width(), canvas.height() - yOffset, "#3355FF", 4);
	canvas.fillRect(0, 0, canvas.width(), yOffset, "white");

	for (var y = 0; y < board.length; y++)
	{
		for (var x = 0; x < board[y].length; x++)
		{
			var c = colors[board[y][x]];
			var dx = rw * x + rw / 2 + padding;
			var dy = rh * y + rh / 2 + yOffset + padding;

			canvas.fillCircle(dx, dy, s / 2, c);
			canvas.drawCircle(dx, dy, s / 2, "#000000", 1);
		}
	}
}

function drawPiece()
{
	if (board.length === 0) return;
	if (board[0].length === 0) return;

	var x = mousePos.x;

	var width = canvas.width();
	var height = canvas.height() - yOffset;

	var rw = width / board[0].length;
	var rh = height / board.length;

	var s = Math.min(rw, rh) - margin;

	x = x - (x % rw) + rw / 2;
	var y = yOffset / 2;

	canvas.fillRect(0, 0, width, yOffset, "white");
	canvas.fillCircle(x, y, s / 2, myColor);
	canvas.drawCircle(x, y, s / 2, "#000000", 1);
}

function sendPiece(e)
{
	if (isMyTurn)
	{
		if (board.length === 0) return;
		if (board[0].length === 0) return;

		mousePos = posFromE(e);

		var width = canvas.width();
		var rw = width / board[0].length;

		var column = parseInt(mousePos.x / rw);

		socket.send("piece", column);
	}
}

function movePiece(e)
{
	if (isMyTurn)
	{
		mousePos = posFromE(e);
		drawPiece();
	}
}