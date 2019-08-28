const io = require('socket.io')({ wsEngine: 'ws' });
const https = require("https");
const mysql = require("mysql");
const axios = require("axios");
var con = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "",
	database: "pokemons"
});

var allPokemons = []
var allMoves = []
var possibleMoves = []
con.connect(function(err) {
	if (err) throw err;
	let i
	con.query("SELECT * FROM pokemons", function (err, result1, fields) {
		if (err) throw err;
		for (i = 0; i < result1.length; i++){
			allPokemons.push(
				{
					id: result1[i].id,
					name: result1[i].name,
					hp: result1[i].hp,
					attack: result1[i].attack,
					defense: result1[i].defense,
					special_attack: result1[i].attackSpe,
					special_defense: result1[i].defenseSpe,
					speed: result1[i].speed,
					type1: result1[i].type1,
					type2: result1[i].type2,
					imageFront: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${i + 1}.png`,
		    		imageBack: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${i + 1}.png`,
		    		possibleMoves: []
				}
			)
		}
		con.query("SELECT * FROM possiblemoves", function (err, result3, fields) {
			if (err) throw err;
			for (i = 0; i < result3.length; i++){
				let id = result3[i].idPokemon - 1
				allPokemons[id].possibleMoves.push(result3[i])
			}
		})

	})
	con.query("SELECT * FROM moves", function (err, result2, fields) {
		if (err) throw err;
		allMoves = result2;
	})
})

var connectedUsersPrivate = {}
var connectedUsersPublic = {}
var rooms = {}
io.on('connection', (client) => {
	
	client.on('login', (login, password) => {
		con.query("SELECT * FROM users WHERE (pseudo = ? or email = ?) AND password = ?", [login, login, password], function (err, result, fields) {
			if (err) throw err;
			if (result.length > 0){
				let alreadyConnected = false
				Object
			        .keys(connectedUsersPublic)
			        .map(function (key){
			        if (result[0].pseudo === connectedUsersPublic[key].pseudo){
			        	alreadyConnected = true
			        }
			    })
		        if (alreadyConnected === false){
		        	let infos = {
						id: result[0].id,
						pseudo: result[0].pseudo,
						email: result[0].email,
					}
		        	connectedUsersPrivate[client.id] = {
						userId: result[0].id,
						userKey: makeid(),
						pseudo: result[0].pseudo,
						userStatus: 'inactive',
						clientId: client.id
					}
					connectedUsersPublic[client.id] = {
						pseudo: result[0].pseudo,
						userStatus: 'inactive',
						clientId: client.id
					}
					client.emit('resultLogin', true, infos, connectedUsersPublic, "success")
					client.broadcast.emit('allUsers', connectedUsersPublic)
		        } else {
		        	client.emit('resultLogin', false, null, null, "errorAlreadyConnect")
		        }
			} else {
				client.emit('resultLogin', false, null, null, "errorWrongLogins")
			}
		})
		setInterval(()=> {}, 50)
	})

	client.on('checkPseudo', (pseudo) => {
		con.query("SELECT * FROM users WHERE pseudo = ?", [pseudo], function (err, result, fields) {
			if (err) throw err;
			if (result.length > 0){
				client.emit('resultCheckPseudo', true)
			} else {
				client.emit('resultCheckPseudo', false)
			}
		})
	})

	client.on('signUp', (pseudo, email, password) => {
		con.query("SELECT * FROM users", function (err, result, fields) {
			if (err) throw err;
			let errorPseudo = false
			let errorEmail = false
			if (result.length > 0){
				for (i = 0; i < result.length; i++){
					if (result[i].pseudo === pseudo){
						errorPseudo = true
					}
					if (result[i].email === email){
						errorEmail = true
					}
				}
				if (errorPseudo === true && errorEmail === true){
					client.emit('resultSignUp', false, "pseudoAndEmailAlreadyUsed")
				} else if (errorPseudo === true){
					client.emit('resultSignUp', false, "pseudoAlreadyUsed")
				} else if (errorEmail === true){
					client.emit('resultSignUp', false, "emailAlreadyUsed")
				} else {
					con.query("INSERT INTO users (pseudo, email, password) values (?, ?, ?)", [pseudo, email, password], function (err, result, fields) {
						if (result.affectedRows === 1){
							client.emit('resultSignUp', true, "success")
						} else {
							client.emit('resultSignUp', true, "unknowError")
						}
					})
				}
			}
		})
	})

	client.on('defy', (clientId) => {
		if (connectedUsersPublic[clientId].userStatus === "inactive"){
			connectedUsersPublic[clientId].userStatus = "defied"
			connectedUsersPublic[client.id].userStatus = "defied"
			client.broadcast.emit('allUsers', connectedUsersPublic);
			client.to(clientId).emit('receiptDefy', connectedUsersPublic[client.id].pseudo, client.id);
			client.emit('allUsers', connectedUsersPublic);
			client.emit('informationsSentDefy', 'waitingResponse', clientId, connectedUsersPublic[clientId].pseudo);
		} else {
			client.emit('informationsSentDefy', 'occupied');
		}
	})

	client.on('sendResponseDefy', (response, clientId) => {
		if (response === true){
			connectedUsersPublic[clientId].userStatus = "fightnig"
			connectedUsersPublic[client.id].userStatus = "fightnig"
			let idGame = makeid()
			let pokemons1 = []
			let pokemons2 = []
			rooms[idGame] = {
				player1: {
					id: client.id,
					pseudo: connectedUsersPublic[client.id].pseudo,
					pokemons: [],
					status: 'moving',
					currentPokemon: 0
				},
				player2: {
					id: clientId,
					pseudo: connectedUsersPublic[clientId].pseudo,
					pokemons: [],
					status: 'moving',
					currentPokemon: 0
				}
			}
			for (i = 1; i <= 12; i++){
				let id = getRandomInt(150) - 1
	    		let j
    			let moves = []
    			let types = []
    			if (allPokemons[id].type2 !== ""){
    				types.push({name: allPokemons[id].type1})
    				types.push({name: allPokemons[id].type2})
    			} else {
    				types.push({name: allPokemons[id].type1})
    			}
    			if (allPokemons[id].possibleMoves.length > 4){
    				let movesRestant = allPokemons[id].possibleMoves.slice(0);
    				console.log(allPokemons[id].name)
    				console.log(allPokemons[id].possibleMoves)
    				while (moves.length<4){
    					//console.log(movesRestant)
    					console.log(allPokemons[id].name)
    					let random = getRandomInt(movesRestant.length)
    					console.log(random)
    					let randomIdMove = parseInt(movesRestant[random].idMove) - 1
    					console.log(randomIdMove)
    					let randomMove = allMoves[randomIdMove]
    					console.log(randomMove.name, randomMove.id)
    					moves.push(randomMove)
    					movesRestant.splice(Math.floor(random),1)
    				}
    			} else if (allPokemons[id].possibleMoves.length === 4){
    				moves.push(allMoves[allPokemons[id].possibleMoves[0].idMove])
    				moves.push(allMoves[allPokemons[id].possibleMoves[1].idMove])
    				moves.push(allMoves[allPokemons[id].possibleMoves[2].idMove])
    				moves.push(allMoves[allPokemons[id].possibleMoves[3].idMove])
    			} else if (allPokemons[id].possibleMoves.length === 3){
    				moves.push(allMoves[allPokemons[id].possibleMoves[0].idMove])
    				moves.push(allMoves[allPokemons[id].possibleMoves[1].idMove])
    				moves.push(allMoves[allPokemons[id].possibleMoves[2].idMove])
    			} else if (allPokemons[id].possibleMoves.length === 2){
    				moves.push(allMoves[allPokemons[id].possibleMoves[0].idMove])
    				moves.push(allMoves[allPokemons[id].possibleMoves[1].idMove])
    			} else {
    				moves.push(allMoves[allPokemons[id].possibleMoves[0].idMove])
    			}
    			if (i <= 6){
	    			pokemons1.push(
	    				{
	    					id: allPokemons[id].id,
	    					name: allPokemons[id].name,
	    					stats: {
	    						maxHp:  Math.round(((((2 * allPokemons[id].hp + 15 + 0) * 50) / 100) + 50) + 10),
		    					currentHp:  Math.round(((((2 * allPokemons[id].hp + 15 + 0) * 50) / 100) + 50) + 10),
		    					attack: allPokemons[id].attack,
		    					defense: allPokemons[id].defense,
		    					special_attack: allPokemons[id].special_attack,
		    					special_defense: allPokemons[id].special_defense,
		    					speed: allPokemons[id].speed,
	    					},
	    					status: {
	    						afraid: false,
								sleeping: false,
								paralyzed: false,
								frozen: false,
								burnt: false,
								poisoned: false,
								confused: false,
								damn: false,
								trapped: false,
	    					},
	    					bonus: {
	    						bonusAttaque: 0,
								bonusAttaqueSpe: 0,
								bonusDefense: 0,
								bonusPrecision: 0,
								bonusEsquive: 0,
								bonusSpeed: 0,
	    					},
	    					imageFront: allPokemons[id].imageFront,
	    					imageBack: allPokemons[id].imageBack,
	    					moves: moves,
	    					types: types
	    				}
	    			)
	    		} else {
	    			let j
	    			pokemons2.push(
	    				{
	    					id: allPokemons[id].id,
	    					name: allPokemons[id].name,
	    					stats: {
	    						maxHp:  Math.round(((((2 * allPokemons[id].hp + 15 + 0) * 50) / 100) + 50) + 10),
		    					currentHp:  Math.round(((((2 * allPokemons[id].hp + 15 + 0) * 50) / 100) + 50) + 10),
		    					attack: allPokemons[id].attack,
		    					defense: allPokemons[id].defense,
		    					special_attack: allPokemons[id].special_attack,
		    					special_defense: allPokemons[id].special_defense,
		    					speed: allPokemons[id].speed,
	    					},
	    					status: {
	    						afraid: false,
								sleeping: false,
								paralyzed: false,
								frozen: false,
								burnt: false,
								poisoned: false,
								confused: false,
								damn: false,
								trapped: false,
	    					},
	    					bonus: {
	    						bonusAttaque: 0,
								bonusAttaqueSpe: 0,
								bonusDefense: 0,
								bonusPrecision: 0,
								bonusEsquive: 0,
								bonusSpeed: 0,
	    					},
	    					imageFront: allPokemons[id].imageFront,
	    					imageBack: allPokemons[id].imageBack,
	    					moves: moves,
	    					types: types
	    				}
	    			)
	    		}
			}
			rooms[idGame].player1.pokemons = pokemons1
			rooms[idGame].player2.pokemons = pokemons2
			client.emit
			client.to(clientId).emit('receiptResponseDefy', true)
			client.broadcast.emit('allUsers', connectedUsersPublic);
			client.emit('allUsers', connectedUsersPublic);
			client.emit('receiptFightInformations', idGame, rooms[idGame].player1.pokemons, rooms[idGame].player2.pseudo, rooms[idGame].player2.id, rooms[idGame].player2.pokemons[0], 'player1')
			client.to(clientId).emit('receiptFightInformations', idGame, rooms[idGame].player2.pokemons, rooms[idGame].player1.pseudo, rooms[idGame].player1.id, rooms[idGame].player1.pokemons[0], 'player2')
		} else {
			connectedUsersPublic[clientId].userStatus = "inactive"
			connectedUsersPublic[client.id].userStatus = "inactive"
			client.to(clientId).emit('receiptResponseDefy', false)
			client.broadcast.emit('allUsers', connectedUsersPublic);
			client.emit('allUsers', connectedUsersPublic);
		}
	})

	client.on('sendFightAction', (typeAction, id, gameId, player) => {
		if (player === 'player1'){
			rooms[gameId].player1.status = "waiting"
			rooms[gameId].player1.typeAction = typeAction
			rooms[gameId].player1.idAction = id
		} else {
			rooms[gameId].player2.status = "waiting"
			rooms[gameId].player2.typeAction = typeAction
			rooms[gameId].player2.idAction = id
		}
		let typeActionPlayer1
		let idActionPlayer1
		let speedPlayer1
		let newPokemonPlayer2
		let typeActionPlayer2
		let idActionPlayer2
		let speedPlayer2
		let newPokemonPlayer1
		let resultMove1
		let resultMove2
		let resultMove

		let newStatsPokemonPlayer1
		let newStatsPokemonPlayer2
		let damagesToPokemonPlayer1
		let damagesToPokemonPlayer2
		let statusToPokemonPlayer1
		let statusToPokemonPlayer2
		let bonusToPokemonPlayer1
		let bonusToPokemonPlayer2

		if (rooms[gameId].player1.status === "waiting" && rooms[gameId].player2.status === "waiting"){
			console.log(rooms[gameId].player1.typeAction, rooms[gameId].player2.typeAction)
			if (rooms[gameId].player1.typeAction === "pokemonChange" && rooms[gameId].player2.typeAction === "pokemonChange"){
				typeActionPlayer1 = "changePokemon"
				idActionPlayer1 = rooms[gameId].player1.idAction
				speedPlayer1 = 0
				newPokemonPlayer2 = rooms[gameId].player2.pokemons[rooms[gameId].player2.idAction]
				rooms[gameId].player2.currentPokemon = rooms[gameId].player2.idAction
				typeActionPlayer2 = "changePokemon"
				idActionPlayer2 = rooms[gameId].player2.idAction
				speedPlayer2 = 0
				newPokemonPlayer1 = rooms[gameId].player1.pokemons[rooms[gameId].player1.idAction]
				rooms[gameId].player1.currentPokemon = rooms[gameId].player1.idAction
			} else if (rooms[gameId].player1.typeAction === "pokemonChange" && rooms[gameId].player2.typeAction === "move"){
				typeActionPlayer1 = "changePokemon"
				typeActionPlayer2 = "move"
				idActionPlayer1 = rooms[gameId].player1.idAction
				idActionPlayer2 = rooms[gameId].player2.idAction
				speedPlayer1 = 0
				newPokemonPlayer1 = rooms[gameId].player1.pokemons[rooms[gameId].player1.idAction]
				rooms[gameId].player1.currentPokemon = rooms[gameId].player1.idAction
				newStatsPokemonPlayer1 = null

				resultMove2 = attack(rooms[gameId].player2.pokemons[rooms[gameId].player2.currentPokemon], rooms[gameId].player1.pokemons[rooms[gameId].player1.currentPokemon], gameId, rooms[gameId].player2.idAction)
				rooms[gameId].player1.pokemons[rooms[gameId].player1.currentPokemon] = resultMove2[1]
				rooms[gameId].player2.pokemons[rooms[gameId].player2.currentPokemon] = resultMove2[0]
				nameMove = rooms[gameId].player2.pokemons[rooms[gameId].player2.currentPokemon].moves[rooms[gameId].player2.idAction].name
				
				newStatsPokemonPlayer1 = resultMove2[1]
				damagesToPokemonPlayer1 = resultMove2[7]
				statusToPokemonPlayer1 = resultMove2[3]
				bonusToPokemonPlayer1 = resultMove2[5]

				newStatsPokemonPlayer2 = resultMove2[0]
				damagesToPokemonPlayer2 = resultMove2[6]
				statusToPokemonPlayer2 = resultMove2[2]
				bonusToPokemonPlayer2 = resultMove2[4]

			} else if (rooms[gameId].player1.typeAction === "move" && rooms[gameId].player2.typeAction === "pokemonChange"){
				idActionPlayer1 = rooms[gameId].player1.idAction
				typeActionPlayer1 = "move"
				resultMove = attack(rooms[gameId].player1.pokemons[rooms[gameId].player1.currentPokemon], rooms[gameId].player2.pokemons[rooms[gameId].player2.currentPokemon], gameId, rooms[gameId].player1.idAction)
				typeActionPlayer2 = "changePokemon"
				idActionPlayer2 = rooms[gameId].player2.idAction
				speedPlayer2 = 0
				newPokemonPlayer2 = rooms[gameId].player2.pokemons[rooms[gameId].player2.idAction]
				rooms[gameId].player2.currentPokemon = rooms[gameId].player2.idAction

				resultMove1 = attack(rooms[gameId].player1.pokemons[rooms[gameId].player1.currentPokemon], rooms[gameId].player2.pokemons[rooms[gameId].player2.currentPokemon], gameId, rooms[gameId].player1.idAction)
				rooms[gameId].player1.pokemons[rooms[gameId].player1.currentPokemon] = resultMove1[0]
				rooms[gameId].player2.pokemons[rooms[gameId].player2.currentPokemon] = resultMove1[1]
				nameMove = rooms[gameId].player1.pokemons[rooms[gameId].player1.currentPokemon].moves[rooms[gameId].player1.idAction].name

				newStatsPokemonPlayer2 = resultMove1[1]
				damagesToPokemonPlayer2 = resultMove1[7]
				statusToPokemonPlayer2 = resultMove1[3]
				bonusToPokemonPlayer2 = resultMove1[5]

				newStatsPokemonPlayer1 = resultMove1[0]
				damagesToPokemonPlayer1 = resultMove1[6]
				statusToPokemonPlayer1 = resultMove1[2]
				bonusToPokemonPlayer1 = resultMove1[4]

			} else if (rooms[gameId].player1.typeAction === "move" && rooms[gameId].player2.typeAction === "move"){
				idActionPlayer1 = rooms[gameId].player1.idAction
				idActionPlayer2 = rooms[gameId].player2.idAction
				typeActionPlayer1 = "move"
				typeActionPlayer2 = "move"
				let speedMove1 = rooms[gameId].player1.pokemons[rooms[gameId].player1.currentPokemon].moves[rooms[gameId].player1.idAction].speed
				let speedMove2 = rooms[gameId].player2.pokemons[rooms[gameId].player2.currentPokemon].moves[rooms[gameId].player2.idAction].speed
				let pokemonSpeed1 = rooms[gameId].player1.pokemons[rooms[gameId].player1.currentPokemon].stats.speed
				let pokemonSpeed2 = rooms[gameId].player2.pokemons[rooms[gameId].player2.currentPokemon].stats.speed
				if (speedMove1 > speedMove2 || speedMove1 === speedMove2 && pokemonSpeed1 >= pokemonSpeed2){
					resultMove1 = attack(rooms[gameId].player1.pokemons[rooms[gameId].player1.currentPokemon], rooms[gameId].player2.pokemons[rooms[gameId].player2.currentPokemon], gameId, rooms[gameId].player1.idAction)
					rooms[gameId].player1.pokemons[rooms[gameId].player1.currentPokemon] = resultMove1[0]
					rooms[gameId].player2.pokemons[rooms[gameId].player2.currentPokemon] = resultMove1[1]
					nameMove = rooms[gameId].player1.pokemons[rooms[gameId].player1.currentPokemon].moves[rooms[gameId].player1.idAction].name

					newStatsPokemonPlayer2 = resultMove1[1]
					damagesToPokemonPlayer2 = resultMove1[7]
					statusToPokemonPlayer2 = resultMove1[3]
					bonusToPokemonPlayer2 = resultMove1[5]

					newStatsPokemonPlayer1 = resultMove1[0]
					damagesToPokemonPlayer1 = resultMove1[6]
					statusToPokemonPlayer1 = resultMove1[2]
					bonusToPokemonPlayer1 = resultMove1[4]

					resultMove2 = attack(rooms[gameId].player2.pokemons[rooms[gameId].player2.currentPokemon], rooms[gameId].player1.pokemons[rooms[gameId].player1.currentPokemon], gameId, rooms[gameId].player2.idAction)
					rooms[gameId].player1.pokemons[rooms[gameId].player1.currentPokemon] = resultMove2[1]
					rooms[gameId].player2.pokemons[rooms[gameId].player2.currentPokemon] = resultMove2[0]
					nameMove = rooms[gameId].player2.pokemons[rooms[gameId].player2.currentPokemon].moves[rooms[gameId].player2.idAction].name
					newStatsPokemonPlayer1 = resultMove2[1]

					damagesToPokemonPlayer1 = resultMove2[7]
					statusToPokemonPlayer1 = resultMove2[3]
					bonusToPokemonPlayer1 = resultMove2[5]

					newStatsPokemonPlayer2 = resultMove2[0]
					damagesToPokemonPlayer2 = resultMove2[6]
					statusToPokemonPlayer2 = resultMove2[2]
					bonusToPokemonPlayer2 = resultMove2[4]
				} else {
					resultMove2 = attack(rooms[gameId].player2.pokemons[rooms[gameId].player2.currentPokemon], rooms[gameId].player1.pokemons[rooms[gameId].player1.currentPokemon], gameId, rooms[gameId].player2.idAction)
					nameMove = rooms[gameId].player2.pokemons[rooms[gameId].player2.currentPokemon].moves[rooms[gameId].player2.idAction].name
					newStatsPokemonPlayer1 = resultMove2[1]

					damagesToPokemonPlayer1 = resultMove2[7]
					statusToPokemonPlayer1 = resultMove2[3]
					bonusToPokemonPlayer1 = resultMove2[5]

					newStatsPokemonPlayer2 = resultMove2[0]
					damagesToPokemonPlayer2 = resultMove2[6]
					statusToPokemonPlayer2 = resultMove2[2]
					bonusToPokemonPlayer2 = resultMove2[4]

					resultMove1 = attack(rooms[gameId].player1.pokemons[rooms[gameId].player1.currentPokemon], rooms[gameId].player2.pokemons[rooms[gameId].player2.currentPokemon], gameId, rooms[gameId].player1.idAction)
					nameMove = rooms[gameId].player1.pokemons[rooms[gameId].player1.currentPokemon].moves[rooms[gameId].player1.idAction].name

					newStatsPokemonPlayer2 = resultMove1[1]
					damagesToPokemonPlayer2 = resultMove1[7]
					statusToPokemonPlayer2 = resultMove1[3]
					bonusToPokemonPlayer2 = resultMove1[5]

					newStatsPokemonPlayer1 = resultMove1[0]
					damagesToPokemonPlayer1 = resultMove1[6]
					statusToPokemonPlayer1 = resultMove1[2]
					bonusToPokemonPlayer1 = resultMove1[4]
				}
			}



			if (player === 'player1'){
				client.emit('sendResultRound', typeActionPlayer2, idActionPlayer2, speedPlayer2, newPokemonPlayer2, typeActionPlayer1, idActionPlayer1, speedPlayer1, newStatsPokemonPlayer2, newStatsPokemonPlayer1)
				client.to(rooms[gameId].player2.id).emit('sendResultRound', typeActionPlayer1, idActionPlayer1, speedPlayer1, newPokemonPlayer1, typeActionPlayer2, idActionPlayer2, speedPlayer2, newStatsPokemonPlayer1, newStatsPokemonPlayer2)
				rooms[gameId].player1.status = "moving"
				rooms[gameId].player2.status = "moving"
			} else {
				client.to(rooms[gameId].player1.id).emit('sendResultRound', typeActionPlayer2, idActionPlayer2, speedPlayer2, newPokemonPlayer2, typeActionPlayer1, idActionPlayer1, speedPlayer1, newStatsPokemonPlayer2, newStatsPokemonPlayer1)
				client.emit('sendResultRound', typeActionPlayer1, idActionPlayer1, speedPlayer1, newPokemonPlayer1, typeActionPlayer2, idActionPlayer2, speedPlayer2, newStatsPokemonPlayer1, newStatsPokemonPlayer2)
				rooms[gameId].player1.status = "moving"
				rooms[gameId].player2.status = "moving"
			}
		}
	})

	client.on('sendCancelDefy', (clientId) => {
		connectedUsersPublic[clientId].userStatus = "inactive"
		connectedUsersPublic[client.id].userStatus = "inactive"
		client.to(clientId).emit('receiptCancelDefy', true)
		client.broadcast.emit('allUsers', connectedUsersPublic);
		client.emit('allUsers', connectedUsersPublic);
	})

	client.on('disconnect', function() {
		delete connectedUsersPublic[client.id];
		client.broadcast.emit('allUsers', connectedUsersPublic);
	});
})

function getRandomInt(max) {
	let value = Math.floor(Math.random() * Math.floor(max));
  	return value
}

function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 10; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function attack(attaquant, defenseur, idGame, idMove){
	/*console.log ("Name:", attaquant.name)
	console.log ("HP:", attaquant.stats.currentHp)
	console.log ("Bonus attack:", attaquant.bonus.bonusAttaque)
	console.log ("Bonus special attack:", attaquant.bonus.bonusAttaqueSpe)
	console.log ("Bonus defense:", attaquant.bonus.bonusDefense)
	console.log ("Bonus special defense:", attaquant.bonus.bonusDefenseSpe)
	console.log ("Bonus precision:", attaquant.bonus.bonusPrecision)
	console.log ("Bonus esquive:", attaquant.bonus.bonusEsquive)*/
	attaquant.moves[idMove].pp = attaquant.moves[idMove].pp - 1
	let newStatusAttaquant
	let newBonusAttaquant
	let newStatusDefenseur
	let newBonusDefenseur
	let power = attaquant.moves[idMove].power
	let att = attaquant.stats.attack
	let att_spe = attaquant.stats.special_attack
	let def = defenseur.stats.defense
	let def_spe = defenseur.stats.special_defense
	let typeAttack = attaquant.moves[idMove].type
	let typePokemon = ''
	let hpLostDefenseur = 0
	let hpLostAttaquant = 0
	let eff = 1
	console.log(attaquant.name, 'utilise', attaquant.moves[idMove].name, '!')
	let stab = 1
	let newPvDefenseur
	let precision
	let esquive
	let defense
	let bonusDefense
	let bonusDefenseSpe
	let bonusAttaque
	let bonusAttaqueSpe
	if (attaquant.bonus.bonusPrecision >= 0){
		precision = (attaquant.bonus.bonusPrecision + 3) / 3
	} else {
		precision = 3 / (Math.abs(attaquant.bonus.bonusPrecision) + 3)
	}
	if (defenseur.bonus.bonusEsquive >= 0){
		esquive = (defenseur.bonus.bonusEsquive + 3) / 3
	} else {
		esquive = 3 / (Math.abs(defenseur.bonus.bonusEsquive) + 3)
	}
	if (defenseur.bonus.bonusDefense >= 0){
		defense = (defenseur.bonus.bonusDefense + 2)/2
	} else {
		defense = 2/(Math.abs(defenseur.bonus.bonusDefense) + 2)
	}
	let Preussite = attaquant.moves[idMove].accuracy * (100 * precision)/(100 * esquive)
	if (getRandomInt(100) <= Preussite){
		if (attaquant.moves[idMove].power !== null){
			console.log("attaque physique")
			for (j = 0; j < defenseur.types.length; j++){
				typePokemon = defenseur.types[j].name
				if (j == 0) {
					if ((typeAttack == 'fighting' && typePokemon == 'bug') || (typeAttack == 'fighting' && typePokemon == 'poison') || (typeAttack == 'fighting' && typePokemon == 'psychic') || (typeAttack == 'fighting' && typePokemon == 'flying') || (typeAttack == 'water' && typePokemon == 'dragon') || (typeAttack == 'water' && typePokemon == 'water') || (typeAttack == 'water' && typePokemon == 'grass') || (typeAttack == 'electric' && typePokemon == 'dragon') || (typeAttack == 'electric' && typePokemon == 'electric') || (typeAttack == 'electric' && typePokemon == 'grass') || (typeAttack == 'fire' && typePokemon == 'dragon') || (typeAttack == 'fire' && typePokemon == 'water') || (typeAttack == 'fire' && typePokemon == 'fire') || (typeAttack == 'fire' && typePokemon == 'rock') || (typeAttack == 'ice' && typePokemon == 'water') || (typeAttack == 'ice' && typePokemon == 'fire') || (typeAttack == 'ice' && typePokemon == 'ice') || (typeAttack == 'bug' && typePokemon == 'fighting') || (typeAttack == 'bug' && typePokemon == 'fire') || (typeAttack == 'bug' && typePokemon == 'poison') || (typeAttack == 'bug' && typePokemon == 'ghost') || (typeAttack == 'bug' && typePokemon == 'flying') || (typeAttack == 'normal' && typePokemon == 'rock') || (typeAttack == 'grass' && typePokemon == 'dragon') || (typeAttack == 'grass' && typePokemon == 'fire') || (typeAttack == 'grass' && typePokemon == 'bug') || (typeAttack == 'grass' && typePokemon == 'grass') || (typeAttack == 'grass' && typePokemon == 'poison') || (typeAttack == 'grass' && typePokemon == 'flying') || (typeAttack == 'poison' && typePokemon == 'poison') || (typeAttack == 'poison' && typePokemon == 'rock') || (typeAttack == 'poison' && typePokemon == 'ground') || (typeAttack == 'poison' && typePokemon == 'ghost') || (typeAttack == 'psychic' && typePokemon == 'psychic') || (typeAttack == 'rock' && typePokemon == 'fighting') || (typeAttack == 'rock' && typePokemon == 'ground') || (typeAttack == 'ground' && typePokemon == 'bug') || (typeAttack == 'ground' && typePokemon == 'grass') || (typeAttack == 'flying' && typePokemon == 'electric') || (typeAttack == 'flying' && typePokemon == 'rock')){
						eff = 0.5
					} else if ((typeAttack == 'fighting' && typePokemon == 'ice') || (typeAttack == 'fighting' && typePokemon == 'normal') || (typeAttack == 'fighting' && typePokemon == 'rock') || (typeAttack == 'dragon' && typePokemon == 'dragon') || (typeAttack == 'water' && typePokemon == 'fire') || (typeAttack == 'water' && typePokemon == 'rock') || (typeAttack == 'water' && typePokemon == 'ground') || (typeAttack == 'electric' && typePokemon == 'water') || (typeAttack == 'electric' && typePokemon == 'flying') || (typeAttack == 'fire' && typePokemon == 'ice') || (typeAttack == 'fire' && typePokemon == 'bug') || (typeAttack == 'fire' && typePokemon == 'grass') || (typeAttack == 'ice' && typePokemon == 'dragon') || (typeAttack == 'ice' && typePokemon == 'grass') || (typeAttack == 'ice' && typePokemon == 'ground') || (typeAttack == 'ice' && typePokemon == 'flying') || (typeAttack == 'bug' && typePokemon == 'grass') || (typeAttack == 'bug' && typePokemon == 'psychic') || (typeAttack == 'grass' && typePokemon == 'water') || (typeAttack == 'grass' && typePokemon == 'rock') || (typeAttack == 'grass' && typePokemon == 'ground') || (typeAttack == 'poison' && typePokemon == 'grass') || (typeAttack == 'psychic' && typePokemon == 'fighting') || (typeAttack == 'rock' && typePokemon == 'fire') || (typeAttack == 'rock' && typePokemon == 'ice') || (typeAttack == 'rock' && typePokemon == 'bug') || (typeAttack == 'rock' && typePokemon == 'flying') || (typeAttack == 'ground' && typePokemon == 'electric') || (typeAttack == 'ground' && typePokemon == 'fire') || (typeAttack == 'ground' && typePokemon == 'poison') || (typeAttack == 'ground' && typePokemon == 'rock') || (typeAttack == 'ghost' && typePokemon == 'psychic') || (typeAttack == 'ghost' && typePokemon == 'ghost') || (typeAttack == 'flying' && typePokemon == 'fighting') || (typeAttack == 'flying' && typePokemon == 'bug') || (typeAttack == 'flying' && typePokemon == 'grass')){
						eff = 2
					} else if ((typeAttack == 'fighting' && typePokemon == 'ghost') || (typeAttack == 'electric' && typePokemon == 'ground') || (typeAttack == 'normal' && typePokemon == 'ghost') || (typeAttack == 'ground' && typePokemon == 'flying') || (typeAttack == 'ghost' && typePokemon == 'normal')){
						eff = 0
					} else {
						eff = 1
					}
				} else {
					if ((typeAttack == 'fighting' && typePokemon == 'bug') || (typeAttack == 'fighting' && typePokemon == 'poison') || (typeAttack == 'fighting' && typePokemon == 'psychic') || (typeAttack == 'fighting' && typePokemon == 'flying') || (typeAttack == 'water' && typePokemon == 'dragon') || (typeAttack == 'water' && typePokemon == 'water') || (typeAttack == 'water' && typePokemon == 'grass') || (typeAttack == 'electric' && typePokemon == 'dragon') || (typeAttack == 'electric' && typePokemon == 'electric') || (typeAttack == 'electric' && typePokemon == 'grass') || (typeAttack == 'fire' && typePokemon == 'dragon') || (typeAttack == 'fire' && typePokemon == 'water') || (typeAttack == 'fire' && typePokemon == 'fire') || (typeAttack == 'fire' && typePokemon == 'rock') || (typeAttack == 'ice' && typePokemon == 'water') || (typeAttack == 'ice' && typePokemon == 'fire') || (typeAttack == 'ice' && typePokemon == 'ice') || (typeAttack == 'bug' && typePokemon == 'fighting') || (typeAttack == 'bug' && typePokemon == 'fire') || (typeAttack == 'bug' && typePokemon == 'poison') || (typeAttack == 'bug' && typePokemon == 'ghost') || (typeAttack == 'bug' && typePokemon == 'flying') || (typeAttack == 'normal' && typePokemon == 'rock') || (typeAttack == 'grass' && typePokemon == 'dragon') || (typeAttack == 'grass' && typePokemon == 'fire') || (typeAttack == 'grass' && typePokemon == 'bug') || (typeAttack == 'grass' && typePokemon == 'grass') || (typeAttack == 'grass' && typePokemon == 'poison') || (typeAttack == 'grass' && typePokemon == 'flying') || (typeAttack == 'poison' && typePokemon == 'poison') || (typeAttack == 'poison' && typePokemon == 'rock') || (typeAttack == 'poison' && typePokemon == 'ground') || (typeAttack == 'poison' && typePokemon == 'ghost') || (typeAttack == 'psychic' && typePokemon == 'psychic') || (typeAttack == 'rock' && typePokemon == 'fighting') || (typeAttack == 'rock' && typePokemon == 'ground') || (typeAttack == 'ground' && typePokemon == 'bug') || (typeAttack == 'ground' && typePokemon == 'grass') || (typeAttack == 'flying' && typePokemon == 'electric') || (typeAttack == 'flying' && typePokemon == 'rock')){
						eff = eff * 0.5
					} else if ((typeAttack == 'fighting' && typePokemon == 'ice') || (typeAttack == 'fighting' && typePokemon == 'normal') || (typeAttack == 'fighting' && typePokemon == 'rock') || (typeAttack == 'dragon' && typePokemon == 'dragon') || (typeAttack == 'water' && typePokemon == 'fire') || (typeAttack == 'water' && typePokemon == 'rock') || (typeAttack == 'water' && typePokemon == 'ground') || (typeAttack == 'electric' && typePokemon == 'water') || (typeAttack == 'electric' && typePokemon == 'flying') || (typeAttack == 'fire' && typePokemon == 'ice') || (typeAttack == 'fire' && typePokemon == 'bug') || (typeAttack == 'fire' && typePokemon == 'grass') || (typeAttack == 'ice' && typePokemon == 'dragon') || (typeAttack == 'ice' && typePokemon == 'grass') || (typeAttack == 'ice' && typePokemon == 'ground') || (typeAttack == 'ice' && typePokemon == 'flying') || (typeAttack == 'bug' && typePokemon == 'grass') || (typeAttack == 'bug' && typePokemon == 'psychic') || (typeAttack == 'grass' && typePokemon == 'water') || (typeAttack == 'grass' && typePokemon == 'rock') || (typeAttack == 'grass' && typePokemon == 'ground') || (typeAttack == 'poison' && typePokemon == 'grass') || (typeAttack == 'psychic' && typePokemon == 'fighting') || (typeAttack == 'rock' && typePokemon == 'fire') || (typeAttack == 'rock' && typePokemon == 'ice') || (typeAttack == 'rock' && typePokemon == 'bug') || (typeAttack == 'rock' && typePokemon == 'flying') || (typeAttack == 'ground' && typePokemon == 'electric') || (typeAttack == 'ground' && typePokemon == 'fire') || (typeAttack == 'ground' && typePokemon == 'poison') || (typeAttack == 'ground' && typePokemon == 'rock') || (typeAttack == 'ghost' && typePokemon == 'psychic') || (typeAttack == 'ghost' && typePokemon == 'ghost') || (typeAttack == 'flying' && typePokemon == 'fighting') || (typeAttack == 'flying' && typePokemon == 'bug') || (typeAttack == 'flying' && typePokemon == 'grass')){
						eff = eff * 2
					} else if ((typeAttack == 'fighting' && typePokemon == 'ghost') || (typeAttack == 'electric' && typePokemon == 'ground') || (typeAttack == 'normal' && typePokemon == 'ghost') || (typeAttack == 'ground' && typePokemon == 'flying') || (typeAttack == 'ghost' && typePokemon == 'normal')){
						eff = eff * 0
					} else {
						eff = eff * 1
					}
				}
			}
			console.log("efficacité: ", eff)
			if (eff === 0){
				console.log("Ca n'affecte pas", defenseur.name, "ennemi")
			} else if (eff < 1){
				console.log("Ce n'est pas très efficace")
			} else if (eff > 1){
				console.log("c'est super efficace")
			} else {
				console.log("Normalement efficace")
			}
			if (attaquant.bonus.bonusAttaque >= 0){
				bonusAttaque = (2 + attaquant.bonus.bonusAttaque)/2
			} else {
				bonusAttaque = 2/(2 + Math.abs(attaquant.bonus.bonusAttaque))
			}
			if (attaquant.bonus.bonusAttaqueSpe >= 0){
				bonusAttaqueSpe = (2 + attaquant.bonus.bonusAttaqueSpe)/2
			} else {
				bonusAttaqueSpe = 2/(2 + Math.abs(attaquant.bonus.bonusAttaqueSpe))
			}
			if (defenseur.bonus.bonusDefense >= 0){
				bonusDefense = 2/(2 + defenseur.bonus.bonusDefense)
			} else {
				bonusDefense = (2 + Math.abs(defenseur.bonus.bonusDefense))/2
			}
			if (typeAttack == 'feu' || typeAttack == 'plante' || typeAttack == 'eau' ||	typeAttack == 'glace' || typeAttack == 'electrique' || typeAttack == 'psy' || typeAttack == 'dragon' || typeAttack == 'tenebre'){
				hpLostDefenseur =  (((50 * 0.4 + 2) * att_spe * bonusAttaqueSpe * power) / (def_spe * 50) + 2) * stab * eff
			} else {
				hpLostDefenseur =  (((50 * 0.4 + 2) * att * bonusAttaque * power) / ((def * bonusDefense) * 50) + 2) * stab * eff
			}
			if (attaquant.moves[idMove].id === 3 || attaquant.moves[idMove].id === 38){/* Double pied - Double dard */
				hpLostDefenseur = hpLostDefenseur * 2
				if (attaquant.moves[idMove].id === 38){/* Double dard */
					if (getRandomInt(100) < 36){
						defenseur.status.poisoned = true
						newStatusDefenseur = "poinsoned"
					}
				}
			} else if (attaquant.moves[idMove].id === 4 || attaquant.moves[idMove].id === 96 || attaquant.moves[idMove].id === 98){/* Balayage - Ecrasement - Coup d'boule */
				if (getRandomInt(100) < 30){
					defenseur.status.afraid = true
					newStatusDefenseur = "afraid"
				}
			} else if (attaquant.moves[idMove].id === 95 || attaquant.moves[idMove].id === 102){/* Morsure - Croc de mort */
				if (getRandomInt(100) < 10){
					defenseur.status.afraid = true
					newStatusDefenseur = "afraid"
				}
			} else if (attaquant.moves[idMove].id === 100){/* Uppercut */
				if (getRandomInt(100) < 20){
					defenseur.status.confused = true
					newStatusDefenseur = "confused"
				}
			} else if (attaquant.moves[idMove].id === 107){/* Plaquage */
				if (getRandomInt(100) < 30 && defenseur.type1 !== "electrique" && !defenseur.status.sleeping && !defenseur.status.paralyzed && !defenseur.status.burnt && !defenseur.status.poisoned && !defenseur.status.frozen){
					defenseur.status.paralyzed = true
					newStatusDefenseur = "paralyzed"
				}
			} else if (attaquant.moves[idMove].id === 92){ /* Rugissement */
				hpLostAttaquant = hpLostDefenseur/2
				attaquant.stats.currentHp = attaquant.stats.currentHp - hpLostAttaquant
			} else if (attaquant.moves[idMove].id === 7 || attaquant.moves[idMove].id === 108 || attaquant.moves[idMove].id === 112){/* Sacrifice - Bélier -Damoclès */
				hpLostAttaquant = hpLostDefenseur/4
				attaquant.stats.currentHp = attaquant.stats.currentHp - hpLostAttaquant
			} else if (attaquant.moves[idMove].id === 114 || attaquant.moves[idMove].id === 116){
				attaquant.stats.currentHp = 0
			} else if (attaquant.moves[idMove].id === 76 || attaquant.moves[idMove].id === 79 || attaquant.moves[idMove].id === 80 || attaquant.moves[idMove].id === 81 || attaquant.moves[idMove].id === 83){
				PnbFurie = getRandomInt(200)
				if (PnbFurie < 75){
					hpLostDefenseur = hpLostDefenseur * 2
					console.log("Touché 2 fois")
				} else if (PnbFurie < 150){
					hpLostDefenseur = hpLostDefenseur * 3
					console.log("Touché 3 fois")
				} else if (PnbFurie < 175){
					hpLostDefenseur = hpLostDefenseur * 4
					console.log("Touché 4 fois")
				} else {
					hpLostDefenseur = hpLostDefenseur * 5
					console.log("Touché 5 fois")
				}
			}
			hpLostDefenseur = Math.round(hpLostDefenseur)
			hpLostAttaquant = Math.round(hpLostAttaquant)
			console.log(attaquant.name, 'inflige', hpLostDefenseur, 'PV à ', defenseur.name)
			newPvDefenseur = (defenseur.stats.currentHp - hpLostDefenseur)
			if (attaquant.moves[idMove].id === 37){/* Vampirisme */
				attaquant.stats.currentHp = attaquant.stats.currentHp + hpLostDefenseur/2
				if (attaquant.stats.currentHp > attaquant.stats.maxHp){
					attaquant.stats.currentHp = attaquant.stats.maxHp
				}
			}

			if (newPvDefenseur < 0){
				console.log(defenseur.name, 'est KO')
				newPvDefenseur = 0
			} else if (attaquant.moves[idMove].id === 20 || attaquant.moves[idMove].id === 21 || attaquant.moves[idMove].id === 22 || attaquant.moves[idMove].id === 23){/* Eclair - Poing-éclair - Tonnerre */
				if (getRandomInt(100) <= 10){
					defenseur.status.paralyzed = true
					newStatusDefenseur = "poisoned"
				}
			} else if (attaquant.moves[idMove].id === 25 || attaquant.moves[idMove].id === 26 || attaquant.moves[idMove].id === 27){/* flammèche - Poing de feu - Lance-flamme */
				if (getRandomInt(100) <= 10){
					defenseur.status.burnt = true
					newStatusDefenseur = "burnt"
				}
			} else if (attaquant.moves[idMove].id === 28){/* Déflagration */
				if (getRandomInt(100) <= 30){
					defenseur.status.burnt = true
					newStatusDefenseur = "burnt"
				}
			} else if (attaquant.moves[idMove].id === 31){/* Onde boréale */
				if (getRandomInt(100) <= 10){
					if (defenseur.bonus.bonusAttaque > -6){
						defenseur.bonus.bonusAttaque = defenseur.bonus.bonusAttaque - 1
						newBonusDefenseur = "attack-1"
					}
				}
			} else if (attaquant.moves[idMove].id === 32 || attaquant.moves[idMove].id === 33 || attaquant.moves[idMove].id === 34){/* Poing glace - Laser-glace - Blizzard */
				if (getRandomInt(100) <= 10){
					defenseur.status.frozen = true
					newStatusDefenseur = "frozen"
				}
			} else if (attaquant.moves[idMove].id === 74){/* Constriction */
				if (getRandomInt(100) <= 10){
					if (defenseur.bonus.bonusSpeed > -6){
						defenseur.bonus.bonusAttaque = defenseur.bonus.bonusSpeed - 1
						newBonusDefenseur = "speed-1"
					}
				}
			}
			defenseur.stats.currentHp = newPvDefenseur
		} else {
			console.log("attaque non physique")
			// Dégats fixes
			if (attaquant.moves[idMove].id === 37){/* Draco Rage */
				defenseur.stats.currentHp = defenseur.stats.currentHp - 40
			} else if (attaquant.moves[idMove].id === 121){/* Frappe atlas */
				defenseur.stats.currentHp = defenseur.stats.currentHp - 50
			// Increase defense
			} else if (attaquant.moves[idMove].id === 69){
				if (defenseur.stats.currentHp < 1){
					defenseur.stats.currentHp = defenseur.stats.currentHp - Math.round(defenseur.stats.currentHp/2)
				} else {
					defenseur.stats.currentHp = defenseur.stats.currentHp - 1
				}
			} else if (attaquant.moves[idMove].id === 99){/* Sonicboom */
				defenseur.stats.currentHp = defenseur.stats.currentHp - 20
			} else if (attaquant.moves[idMove].id === 72 || attaquant.moves[idMove].id === 73){/* Empal'korne - Guillotine */
				if (attaquant.stats.speed > defenseur.stats.speed){
					defenseur.stats.currentHp = 0
					console.log("Ko en un coup")
				} else {
					console.log("Mais cela échoue")
				}

			//Soin
			} else if (attaquant.moves[idMove].id === 50 || attaquant.moves[idMove].id === 66){/* E-coque - Soin*/
				attaquant.stats.currentHp = attaquant.stats.currentHp + attaquant.stats.maxHp/2
				if (attaquant.stats.currentHp > attaquant.stats.maxHp){
					attaquant.stats.currentHp = attaquant.stats.maxHp
				}

			//Défense
			} else if (attaquant.moves[idMove].id === 10 || attaquant.moves[idMove].id === 41 || attaquant.moves[idMove].id === 43){/* Repli - Armure - Boul'armure */
				if (attaquant.bonus.bonusDefense < 6){
					attaquant.bonus.bonusDefense = attaquant.bonus.bonusDefense + 1
					console.log("La défense de", attaquant.name, "augmente")
				} else {
					console.log("La défense de", attaquant.name , "n'ira pas plus haut")
				}
			} else if (attaquant.moves[idMove].id === 55 || attaquant.moves[idMove].id === 61){/* Groz'yeux - Mimi-queue */
				if (defenseur.bonus.bonusDefense > -6){
					defenseur.bonus.bonusDefense = defenseur.bonus.bonusDefense - 1
					newBonusDefenseur = "defense-1"
					console.log("La défense de", defenseur.name, "enemie diminue")
				} else {
					console.log("La défense de", defenseur.name , "enemie n'ira pas plus bas")
				}
			} else if (attaquant.moves[idMove].id === 53){/* Grincement */
				if (defenseur.bonus.bonusDefense > -5){
					defenseur.bonus.bonusDefense = defenseur.bonus.bonusDefense - 2
					newBonusDefenseur = "defense-2"
					console.log("La défense de", defenseur.name, "enemie diminue fortement")
				} else if (defenseur.bonusDefense > -6){
					defenseur.bonus.bonusDefense = defenseur.bonus.bonusDefense - 1
					newBonusDefenseur = "defense-2"
					console.log("La défense de", defenseur.name, "enemie diminue fortement")
				} else {
					console.log("La défense de", defenseur.name , "enemie n'ira pas plus bas")
				}

			//Attaque
			} else if (attaquant.moves[idMove].id === 65){/* Rugissement */
				if (defenseur.bonus.bonusAttaque > -6){
					defenseur.bonus.bonusAttaque = defenseur.bonus.bonusAttaque - 1
					newBonusDefenseur = "attaque-1"
					console.log("L'attaque de", defenseur.name, "diminue")
				} else {
					console.log("L'attaque de", defenseur.name , "enemie n'ira pas plus bas")
				}
			} else if (attaquant.moves[idMove].id === 40){ /* Affûtage */
				if (attaquant.bonus.bonusAttaque < 6){
					attaquant.bonus.bonusAttaque = attaquant.bonus.bonusAttaque + 1
					console.log("L'attaque de", attaquant.name, "augmente")
				} else {
					console.log("L'attaque de", attaquant.name , "n'ira pas plus haut")
				}
			} else if (attaquant.moves[idMove].id === 49){ /* Danse lames */
				if (attaquant.bonus.bonusDefense < 5){
					attaquant.bonus.bonusDefense = attaquant.bonus.bonusDefense + 2
					newBonusAttaquant = "defense+2"
					console.log("L'attaque de", attaquant.name, "augmente fortement")
				} else if (attaquant.bonus.bonusDefense < 6){
					attaquant.bonus.bonusDefense = attaquant.bonus.bonusDefense + 1
					newBonusAttaquant = "defense+2"
					console.log("L'attaque de", attaquant.name, "augmente fortement")
				} else {
					console.log("L'attaque de", attaquant.name , "n'ira pas plus haut")
				}

			//Attaque spéciale
			} else if (attaquant.moves[idMove].id === 47){/* Croissance */
				if (attaquant.bonus.bonusAttaqueSpe < 6){
					attaquant.bonus.bonusAttaqueSpe = attaquant.bonus.bonusAttaqueSpe + 1
					console.log("L'attaque spéciale de", attaquant.name, "augmente")
				} else {
					console.log("L'attaque spéciale de", attaquant.name , "n'ira pas plus haut")
				}


			//précision
			} else if (attaquant.moves[idMove].id === 44 || attaquant.moves[idMove].id === 52 || attaquant.moves[idMove].id === 58){/* Brouillard - Flash - Jet de sable */
				if (defenseur.bonus.bonusPrecision > -6){
					defenseur.bonus.bonusPrecision = defenseur.bonus.bonusPrecision - 1
					newBonusDefenseur = "precision-1"
					console.log("La précision de", defenseur.name, "enemie diminue")
				} else {
					console.log("La précision de", defenseur.name , "enemie n'ira pas plus bas")
				}


			//Esquive
			} else if (attaquant.moves[idMove].id === 59 || attaquant.moves[idMove].id === 64){/* Lilliput - Reflet */
				if (attaquant.bonus.bonusEsquive < 6){
					attaquant.bonus.bonusEsquive = attaquant.bonus.bonusEsquive + 1
					console.log("L'esquive de", attaquant.name, "augmente")
				} else {
					console.log("L'esquive de", attaquant.name , "n'ira pas plus haut")
				}


			//Vitesse
			} else if (attaquant.moves[idMove].id === 35){/* Sécrétion */
				if (attaquant.bonus.bonusSpeed > -6){
					attaquant.bonus.bonusSpeed = attaquant.bonus.bonusSpeed - 1
					console.log("La vitesse de", defenseur.name, "enemie diminue")
				} else {
					console.log("La vitesse de", defenseur.name , "enemie n'ira pas plus bas")
				}


			//Paralysé
			} else if (attaquant.moves[idMove].id === 19){/* Cage-éclair */
				if (defenseur.type1 !== "electrique" && defenseur.type1 !== "sol" && !defenseur.status.sleeping && !defenseur.status.paralyzed && !defenseur.status.burnt && !defenseur.status.poisoned && !defenseur.status.frozen){
					defenseur.status.paralyzed = true
					newStatusDefenseur = "paralyzed"
					console.log(defenseur.name, "enemie est paralysé")
				} else {
					console.log("Mais cela échoue")
				}
			} else if (attaquant.moves[idMove].id === 57){/* Intimidation */
				if (!defenseur.status.sleeping && !defenseur.status.paralyzed && !defenseur.status.burnt && !defenseur.status.poisoned && !defenseur.status.frozen){
					defenseur.status.paralyzed = true
					newStatusDefenseur = "paralyzed"
					console.log(defenseur.name, "enemie est paralysé")
				} else {
					console.log("Mais cela échoue")
				}

			//Endormi
			} else if (attaquant.moves[idMove].id === 42 || attaquant.moves[idMove].id === 54){/* Berceuse - Grobisou */
				if (!defenseur.status.sleeping && !defenseur.status.paralyzed && !defenseur.status.burnt && !defenseur.status.poisoned && !defenseur.status.frozen){
					defenseur.status.sleeping = true
					newStatusDefenseur = "sleeping"
					console.log(defenseur.name, "enemie s'endort")
				} else {
					console.log("Mais cela échoue")
				}
			// Confusion

			} else if (attaquant.moves[idMove].id === 42){/* Onde folie */
				defenseur.status.confused = true
				newStatusDefenseur = "confused"
				console.log(defenseur.name, "enemie est confus")

			//RAS
			} else if (attaquant.moves[idMove].id === 48 || attaquant.moves[idMove].id === 56){/* Cyclone - Hurlement */
				console.log("Mais cela échoue")

			//Trempette
			} else if (attaquant.moves[idMove].id === 67){/* Trempette */
				console.log("Rien ne se passe")
			}
		}
	} else {
		console.log(attaquant.name, 'rate son attaque')
		if (attaquant.moves[idMove].id === 6){/* Pied-sauté */
			attaquant.stats.currentHp = attaquant.stats.currentHp - 1
		}
		if (attaquant.moves[idMove].id === 8){/* pied-voltige */
			hpLostAttaquant =  ((((50 * 0.4 + 2) * att * power) / ((def * defense) * 50) + 2) * stab * eff) / 2
			attaquant.status.currentHp = attaquant.stats.currentHp - hpLostAttaquant
		}
	}
	return [attaquant, defenseur, newStatusAttaquant, newStatusDefenseur, newBonusAttaquant, newBonusDefenseur, hpLostAttaquant, hpLostDefenseur]
}

const port = 8000;
io.listen(port);
console.log('listening on port ', port);