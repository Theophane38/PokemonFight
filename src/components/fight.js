import React from 'react';
import openSocket from 'socket.io-client';
import pokeball from '../images/pokeball.png'
const  socket = openSocket('http://localhost:8000');

class Pokemonfight extends React.Component {

	constructor(){
		super()
		this.state = {
			ready: true,
			attaquer: false,
			sac: false,
			pokemons: false,
			fuite: false,
		}
		this.moves = this.moves.bind(this)
		this.annuler = this.annuler.bind(this)
		this.pokemonChange = this.pokemonChange.bind(this)
		this.sendPokemon = this.sendPokemon.bind(this)
		this.endStarting = this.endStarting.bind(this)
		this.sendPokemon = this.sendPokemon.bind(this)
	}

	componentWillMount(){
		console.log(this.props.pseudoOpponent)
		console.log(this.props.pokemons)
		console.log(this.props.pokemonsOpponent)
		this.setState({
			fightStatus: 'starting',
			texteAction: 'Le combat commence !',
			opponentTrainerDisplay: 'come',
			opponentPlatformDisplay: 'come',
			friendTrainerDisplay: 'come',
			friendPlatformDisplay: 'come',
		})
		setTimeout(
		    function() {
		        this.setState({
		        	opponentPokeballsTrainerDisplay: 'come',
		        	friendPokeballsTrainerDisplay: 'come',
		        	opponentShadowDisplay: 'block',
		        });
		    }
		    .bind(this),
		    300
		);
		setTimeout(
		    function() {
		        this.setState({
		        	opponentTrainerDisplay: 'leave',
		        	opponentPokeballPokemonDisplay: 'block',
		        	opponentPokeballsTrainerDisplay: 'leave',
		        	opponentShadowDisplay: '',
		        });
		    }
		    .bind(this),
		    500
		);
		setTimeout(
		    function() {
		        this.setState({
		        	texteAction: this.props.pokemonsOpponent[0].name + ' est envoyé par ' + this.props.pseudoOpponent + ' !',
		        	opponentTrainerDisplay: '',
		        	opponentPokeballPokemonDisplay: '',
		        	opponentPokemonDisplay: 'come',
		        	opponentPokemonInfosDisplay: 'come',
		        	opponentPokeballsTrainerDisplay: '',
		        });
		    }
		    .bind(this),
		    600
		);
		setTimeout(
		    function() {
		        this.setState({
		        	friendTrainerDisplay: 'leave',
		        	friendPokeballsTrainerDisplay: 'leave',
		        	opponentShadowDisplay: 'block'
		        });
		    }
		    .bind(this),
		    700
		);

		setTimeout(
		    function() {
		        this.setState({
		        	texteAction: this.props.pokemons[0].name + ' ! Go !',
		        	friendTrainerDisplay: '',
		        	friendPokeballPokemonDisplay: 'come',
		        });
		    }
		    .bind(this),
		    800
		);
		setTimeout(
		    function() {
		        this.setState({
		        	friendPokemonDisplay: 'come',
		        	friendPokeballPokemonDisplay: '',
		        	friendPokemonInfosDisplay: 'come',
		        });
		    }
		    .bind(this),
		    900
		);
		setTimeout(
		    function() {
		        this.setState({
		        	texteAction: 'Que doit faire ' + this.props.pokemons[0].name + ' ?',
		        	fightStatus: 'fighting',
		        });
		    }
		    .bind(this),
		    1000
		);
		if (this.props.animation === "changePokemon"){
			console.log('test')
		}
	}

	endStarting(){
		this.setState({
			texteAction: 'Que doit faire ' + this.props.pokemons[0].name + ' ?',
			fightStatus: 'fighting'
		})
	}

	moves(){
		this.setState({
			movesScreen: true,
		})
	}
	annuler(){
		this.setState({
			movesScreen: false,
			pokemonsScreen: false,
		})
	}

	pokemonChange(){
		this.setState({
			pokemonsScreen: true,
		})
	}


	sendAttackToServer(id){
		/*this.props.socket.emit('move', this.props.idGame, this.props.joueur, 'attack', id);*/
	}

	sendPokemon(id){
		console.log(id)
		this.props.socket.emit('sendFightAction', 'pokemonChange', id, this.props.idGame, this.props.player);
	}

	render(){
		console.log(this.props.animation)
		let screen = []
		let friendTeam = []
		let bottomScreen = []
		if (this.state.fightStatus === 'starting'){
			bottomScreen.push(
				<div className="actionScreen"></div>
			)
		} else {
			if (this.state.movesScreen === true){
				let moves = []
				let i
				for (i = 0; i < this.props.pokemons[this.props.idFighterPokemon].moves.length; i++){
					moves.push(
						<div className={this.props.pokemons[this.props.idFighterPokemon].moves[i].type + " move"}>
		        			<p className="moveName">{this.props.pokemons[this.props.idFighterPokemon].moves[i].name}</p>
		        			<p className={"type " + this.props.pokemons[this.props.idFighterPokemon].moves[i].type}>{this.props.pokemons[this.props.idFighterPokemon].moves[i].type}</p>
		        			<p className="pp">PP {this.props.pokemons[this.props.idFighterPokemon].moves[i].pp}/{this.props.pokemons[this.props.idFighterPokemon].moves[i].pp}</p>
		        		</div>
					)
				}
				bottomScreen.push(
					<div className="actionScreen">
		        		{moves}
		        		<div className="cancelMove" onClick={this.annuler}>
		        			<p>ANNULER</p>
		        		</div>
		        	</div>
				)
			} else if (this.state.pokemonsScreen){
				let pokemons = []
				let i
				for (i = 0; i < 6; i++){
					let idPokemon = i
					pokemons.push(
						<div className="pokemon" onClick={() => this.sendPokemon(idPokemon)}>
		        			<img className="pokemonImage" src={this.props.pokemons[i].imageFront}/>
		        			<div className="pokemonNameHpLine">
			        			<p className="pokemonName">{this.props.pokemons[i].name}</p>
			        			<div className="pokemonHpLine">
									<p className="hp">PV</p>
									<progress className="green" value={this.props.pokemons[i].currentHp} max={this.props.pokemons[i].maxHp}></progress>
								</div>
			        		</div>
			        		<p className="pokemonLevel">N.50</p>
							<p className="pokemonHpValue">{this.props.pokemons[i].currentHp}/{this.props.pokemons[i].maxHp}</p>
		        		</div>
					)
				}
				bottomScreen.push(
					<div className="actionScreen">
		        		{pokemons}
		        		<div className="cancelMove" onClick={this.annuler}>
		        			<p>ANNULER</p>
		        		</div>
		        	</div>
		        )
			} else {
				bottomScreen.push(
					<div className="actionScreen">
						<div className="pokeballsTrainer">
							<img className="pokeballTrainer" src={pokeball}/>
							<img className="pokeballTrainer" src={pokeball}/>
							<img className="pokeballTrainer" src={pokeball}/>
							<img className="pokeballTrainer" src={pokeball}/>
							<img className="pokeballTrainer" src={pokeball}/>
							<img className="pokeballTrainer" src={pokeball}/>
						</div>
						<div className="pokeballsOpponentTrainer">
							<img className="pokeballTrainer" src={pokeball}/>
							<img className="pokeballTrainer" src={pokeball}/>
							<img className="pokeballTrainer" src={pokeball}/>
							<img className="pokeballTrainer" src={pokeball}/>
							<img className="pokeballTrainer" src={pokeball}/>
							<img className="pokeballTrainer" src={pokeball}/>
						</div>
		        		<div className="action moves" onClick={this.moves}>
		        			<p>ATTAQUER</p>
		        		</div>
		        		<div className="action pack">
		        			<p>SAC</p>
		        		</div>
		        		<div className="action run">
		        			<p>FUITE</p>
		        		</div>
		        		<div className="action pokemons" onClick={this.pokemonChange}>
		        			<p>POKEMONS</p>
		        		</div>
		        	</div>
				)
			}
		}
		return (
			<div>
				<div className="screen">
					<div className="enemyTeam">
						<div className={ "pokeballsTrainer " + this.state.opponentPokeballsTrainerDisplay}>
							<img className="pokeballTrainer" src={pokeball}/>
							<img className="pokeballTrainer" src={pokeball}/>
							<img className="pokeballTrainer" src={pokeball}/>
							<img className="pokeballTrainer" src={pokeball}/>
							<img className="pokeballTrainer" src={pokeball}/>
							<img className="pokeballTrainer" src={pokeball}/>
						</div>
						<img className={ "platform " + this.state.opponentPlatformDisplay} src={require('../images/platform.png')}/>
						<div className={ "shadow " + this.state.opponentShadowDisplay}></div>
						<img className={ "trainer " + this.state.opponentTrainerDisplay} src={require('../images/trainer1.png')}/>
						<img className={ "pokeballPokemon " + this.state.opponentPokeballPokemonDisplay} src={pokeball}/>
						<img className={ "pokemon " + this.state.opponentPokemonDisplay} src={this.props.pokemonsOpponent[this.props.idOpponentFighterPokemon].imageFront}/>
						<div className={ "pokemonInfos " + this.state.opponentPokemonInfosDisplay}>
							<p className="pokemonName">{this.props.pokemonsOpponent[this.props.idOpponentFighterPokemon].name}</p>
							<p className="pokemonLevel">N.50</p>
							<div className="clear"></div>
							<div className="hpLine">
								<p className="hp">PV</p>
								<progress className="green" value={this.props.pokemonsOpponent[this.props.idOpponentFighterPokemon].currentHp} max={this.props.pokemonsOpponent[this.props.idOpponentFighterPokemon].maxHp}></progress>
							</div>
						</div>
					</div>
					<div className="friendTeam">
						<img className={ "platform " + this.state.friendPlatformDisplay} src={require('../images/platform.png')}/>
						<img className={ "trainer " + this.state.friendTrainerDisplay} src={require('../images/trainer1.png')}/>
						<div className={ "pokeballsTrainer " + this.state.friendPokeballsTrainerDisplay}>
							<img className="pokeballTrainer" src={pokeball}/>
							<img className="pokeballTrainer" src={pokeball}/>
							<img className="pokeballTrainer" src={pokeball}/>
							<img className="pokeballTrainer" src={pokeball}/>
							<img className="pokeballTrainer" src={pokeball}/>
							<img className="pokeballTrainer" src={pokeball}/>
						</div>
						<img className={ "pokeballPokemon " + this.state.friendPokeballPokemonDisplay} src={pokeball}/>
						<img className={ "pokemon " + this.state.friendPokemonDisplay} src={this.props.pokemons[this.props.idFighterPokemon].imageBack}/>
						<div className={ "pokemonInfos " + this.state.friendPokemonInfosDisplay}>
							<p className="pokemonName">{this.props.pokemons[this.props.idFighterPokemon].name}</p>
							<p className="pokemonLevel">N.50</p>
							<div className="clear"></div>
							<div className="hpLine">
								<p className="hp">PV</p>
								<progress className="green" value={this.props.pokemons[this.props.idFighterPokemon].currentHp} max={this.props.pokemons[this.props.idFighterPokemon].maxHp}></progress>
							</div>
							<p className="hpValue">{this.props.pokemons[this.props.idFighterPokemon].currentHp}/{this.props.pokemons[this.props.idFighterPokemon].maxHp}</p>
						</div>
					</div>
					<div className="dialog">
						<p>{this.state.texteAction}</p>
					</div>
				</div>
				{bottomScreen}
	        </div>
		)
	}




}

export default Pokemonfight;