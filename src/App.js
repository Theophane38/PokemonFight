import React, { Component } from 'react';
import logo from './images/logo.png';
import pokeball from './images/pokeball.png';
import './App.css';
import openSocket from 'socket.io-client';
import Modal from 'react-responsive-modal';
import Fight from './components/fight';

class App extends Component {

  constructor(props){
    super(props)
    this.state = {
      socket: openSocket('http://localhost:8000'),
      connectLogin: '',
      connectPassword: '',
      signupPseudo: '',
      signupEmail: '',
      signupPassword: '',
      signupConfirmPassword: '',
      connected: false,
      showAlreadyConnectModal: false,
      showReceiptDefy: false,
      showSentDefy: false,
      showOccupiedOpponent: false,
      currentUserDefy: '',

      inputSignupPseudoStatus: '',
      inputSignupEmailStatus: '',
      inputSignupPasswordStatus: '',
      inputSignupConfirmPasswordStatus: '',
      ready: true,
      attaquer: false,
      sac: false,
      pokemons: false,
      fuite: false,
    }
    this.changeConnectLogin = this.changeConnectLogin.bind(this)
    this.changeConnectPassword = this.changeConnectPassword.bind(this)
    this.changeSignupPseudo = this.changeSignupPseudo.bind(this)
    this.changeSignupEmail = this.changeSignupEmail.bind(this)
    this.changeSignupPassword = this.changeSignupPassword.bind(this)
    this.changeSignupConfirmPassword = this.changeSignupConfirmPassword.bind(this)
    this.login = this.login.bind(this)
    this.signUp = this.signUp.bind(this)
    this.checkEmail = this.checkEmail.bind(this)
    this.acceptDefy = this.acceptDefy.bind(this)
    this.refuseDefy = this.refuseDefy.bind(this)
    this.cancelDefy = this.cancelDefy.bind(this)
    this.moves = this.moves.bind(this)
    this.annuler = this.annuler.bind(this)
    this.pokemonChange = this.pokemonChange.bind(this)
    this.sendPokemon = this.sendPokemon.bind(this)
    this.endStarting = this.endStarting.bind(this)
    this.sendPokemon = this.sendPokemon.bind(this)
    this.sendAttackToServer = this.sendAttackToServer.bind(this)
  }

  componentWillMount(){
    let that = this
    this.state.socket.on('resultLogin', function(result, datas, allUsers, message){
      console.log(message)
      if (result === true){
        console.log(allUsers)
        that.setState({
          connected: true,
          infos: datas,
          allUsers: allUsers
        })
      } else if (message === "errorAlreadyConnect") {
        that.setState({
          showAlreadyConnectModal: true
        })
      } else if (message === "errorWrongLogins"){
        that.setState({
          errorWrongLoginsStatus: 'error'
        })
      }
    })
    this.state.socket.on('allUsers', function(allUsers){
      that.setState({
        allUsers: allUsers
      })
    })
    this.state.socket.on('resultCheckPseudo', function(result){
      if (result === true){
        that.setState({
          inputSignupPseudoStatus: 'inputError',
          errorSignupPseudoStatus: 'error'
        })
      }
    })
    this.state.socket.on('resultSignUp', function(result, message){
      if (message === "pseudoAndEmailAlreadyUsed"){
        that.setState({
          inputSignupPseudoStatus: 'inputError',
          errorSignupPseudoStatus: 'error',
          inputSignupEmailStatus: 'inputError',
          errorSignupEmailStatus: 'error',
        })
      } else if (message === "pseudoAlreadyUsed"){
        that.setState({
          inputSignupPseudoStatus: 'inputError',
          errorSignupPseudoStatus: 'error'
        })
      } else if (message === "emailAlreadyUsed"){
        that.setState({
          inputSignupEmailStatus: 'inputError',
          errorSignupEmailStatus: 'error'
        })
      } else if (message === "unknownError"){
        that.setState({
          errorUknown: 'error'
        })
      }
    })
    this.state.socket.on('receiptDefy', function(pseudo, clientId){
      that.setState({
        showReceiptDefy: true,
        currentUserDefy: pseudo,
        currentUserIdDefy: clientId,
        showResponseDefy: false,
      })
    })
    this.state.socket.on('informationsSentDefy', function(info, clientId, clientPseudo){
      if (info === 'waitingResponse'){
        that.setState({
          showSentDefy: true,
          currentPseudoUserDefied: clientPseudo,
          currentIdUserDefied: clientId
        })
      } else {
        that.setState({
          showOccupiedOpponent: true,
        })
      }
    })
    this.state.socket.on('receiptResponseDefy', function(response){
      if (response === false){
        that.setState({
          showResponseDefy: true,
          showSentDefy: false,
        })
      } else {

      }
    })
    this.state.socket.on('receiptCancelDefy', function(response){
      console.log('patate')
      that.setState({
        showReceiptDefy: false,
      })
    })
    this.state.socket.on('receiptFightInformations', function(idGame, pokemons, pseudoOpponent, idOpponent, pokemonsOpponent, player){
      let pokemonsO = []
      pokemonsO[0] = pokemonsOpponent
      that.setState({
        showSentDefy: false,
        status: 'fighting',
        idGame: idGame,
        pokemons: pokemons,
        pseudoOpponent: pseudoOpponent,
        idOpponent: idOpponent,
        pokemonsOpponent: [pokemonsOpponent],
        idFighterPokemon: 0,
        idOpponentFighterPokemon: 0,
        player: player,
        fightStatus: 'starting',
        texteAction: 'Le combat commence !',
        opponentTrainerDisplay: 'come',
        opponentPlatformDisplay: 'come',
        friendTrainerDisplay: 'come',
        friendPlatformDisplay: 'come',
      })
      setTimeout(
        function() {
            that.setState({
              opponentPokeballsTrainerDisplay: 'come',
              friendPokeballsTrainerDisplay: 'come',
              opponentShadowDisplay: 'block',
            });
        }
        .bind(that),
        300
      );
      setTimeout(
        function() {
            that.setState({
              opponentTrainerDisplay: 'leave',
              opponentPokeballPokemonDisplay: 'block',
              opponentPokeballsTrainerDisplay: 'leave',
              opponentShadowDisplay: '',
            });
        }
        .bind(that),
        500
      );
      setTimeout(
        function() {
            that.setState({
              texteAction: that.state.pokemonsOpponent[0].name + ' est envoyé par ' + that.state.pseudoOpponent + ' !',
              opponentTrainerDisplay: '',
              opponentPokeballPokemonDisplay: '',
              opponentPokemonDisplay: 'come',
              opponentPokemonInfosDisplay: 'come',
              opponentPokeballsTrainerDisplay: '',
            });
        }
        .bind(that),
        600
      );
      setTimeout(
        function() {
            that.setState({
              friendTrainerDisplay: 'leave',
              friendPokeballsTrainerDisplay: 'leave',
              opponentShadowDisplay: 'block',
              friendPokeballsTrainerDisplay: 'leave',
            });
        }
        .bind(that),
        700
      );

      setTimeout(
        function() {
            that.setState({
              texteAction: that.state.pokemons[0].name + ' ! Go !',
              friendTrainerDisplay: '',
              friendPokeballsTrainerDisplay: '',
              friendPokeballPokemonDisplay: 'come',
            });
        }
        .bind(that),
        800
      );
      setTimeout(
        function() {
            that.setState({
              friendPokemonDisplay: 'come',
              friendPokeballPokemonDisplay: '',
              friendPokemonInfosDisplay: 'come',
            });
        }
        .bind(that),
        900
      );
      setTimeout(
        function() {
            that.setState({
              texteAction: 'Que doit faire ' + that.state.pokemons[0].name + ' ?',
              fightStatus: 'fighting',
            });
        }
        .bind(that),
        1000
      );
    })
    this.state.socket.on('sendResultRound', function(opponentAction, idOpponentAction, opponentSpeed, newPokemon, friendAction, idFriendAction, friendSpeed, newStatsOpponent, newStatsFriend){
      console.log(idFriendAction)
      console.log(idOpponentAction)
      if (opponentAction === "move" && friendAction === "move"){
        let pokemons = that.state.pokemons
        pokemons[that.state.idFighterPokemon] = newStatsFriend
        let pokemonsOpponent = that.state.pokemonsOpponent
        pokemonsOpponent[that.state.idOpponentFighterPokemon] = newStatsOpponent
        console.log(pokemonsOpponent)
        that.setState({
          pokemons: pokemons,
          pokemonsOpponent: pokemonsOpponent,
          fightStatus: "fighting",
          pokemonsScreen: false,
          movesScreen: false,
        });
      } else if (opponentAction === "changePokemon" && friendAction ==="move"){
        that.setState({
          texteAction: that.state.pseudoOpponent + ' retire ' + that.state.pokemonsOpponent[0].name,
          opponentPokemonDisplay: 'leave',
          opponentPokemonInfosDisplay: 'leave',
        })
        let currentPokemonsOpponent = that.state.pokemonsOpponent
        currentPokemonsOpponent[idOpponentAction] = newPokemon
        setTimeout(
          function() {
              that.setState({
                pokemonsOpponent: currentPokemonsOpponent,
                idOpponentFighterPokemon: idOpponentAction,
                opponentPokemonDisplay: '',
                opponentPokemonInfosDisplay: '',
              });
          }
          .bind(that),
          1000
        );
        setTimeout(
          function() {
              that.setState({
                texteAction: that.state.pseudoOpponent + ' envoie ' + that.state.pokemonsOpponent[0].name,
                opponentPokemonDisplay: 'come',
                opponentPokemonInfosDisplay: 'come',
                opponentPokeballPokemonDisplay: 'block',
              });
          }
          .bind(that),
          2000
        );
        setTimeout(
          function() {
              that.setState({
                opponentPokeballPokemonDisplay: '',
              });
          }
          .bind(that),
          2000
        );
        let pokemons = that.state.pokemons
        pokemons[that.state.idFighterPokemon] = newStatsFriend
        let pokemonsOpponent = that.state.pokemonsOpponent
        pokemonsOpponent[idOpponentAction] = newStatsOpponent
        setTimeout(
          function() {
            that.setState({
              pokemons: pokemons,
              texteAction: that.state.pokemons[that.state.idFighterPokemon].name + ' utilise ' + that.state.pokemons[that.state.idFighterPokemon].moves[idFriendAction].name + '!',
              pokemonsOpponent: pokemonsOpponent,
              fightStatus: "fighting",
              friendPokemonDisplay: 'attack',
              pokemonsScreen: false,
              movesScreen: false,
            });
          }
          .bind(that),
          3000
        );
        setTimeout(
          function() {
            that.setState({
              friendPokemonDisplay: 'normal',
            });
          }
          .bind(that),
          4000
        );
      } else if (opponentAction === "move" && friendAction ==="changePokemon"){
        that.setState({
          texteAction: that.state.pokemons[0].name + ' ça suffit,',
          friendPokemonDisplay: 'leave',
          friendPokemonInfosDisplay: 'leave',
        });
        setTimeout(
          function() {
              that.setState({
                idFighterPokemon: idFriendAction,
                friendPokemonDisplay: '',
                friendPokemonInfosDisplay: '',
                texteAction: that.state.pokemons[idFriendAction].name + ' ! Go !',
              });
          }
          .bind(that),
          1000
        );
        setTimeout(
          function() {
              that.setState({
                friendPokemonDisplay: 'come',
                friendPokemonInfosDisplay: 'come',
              });
          }
          .bind(that),
          2000
        );
        setTimeout(
          function() {
              that.setState({
                texteAction: 'Que doit faire ' + that.state.pokemons[idFriendAction].name + ' ?',
                fightStatus: "fighting",
                pokemonsScreen: false,
                movesScreen: false,
              });
          }
          .bind(that),
          3000
        );
        let pokemons = that.state.pokemons
        pokemons[idFriendAction] = newStatsFriend
        let pokemonsOpponent = that.state.pokemonsOpponent
        pokemonsOpponent[that.state.idOpponentFighterPokemon] = newStatsOpponent
        console.log(pokemonsOpponent)
        that.setState({
          pokemons: pokemons,
          pokemonsOpponent: pokemonsOpponent,
          fightStatus: "fighting",
          pokemonsScreen: false,
          movesScreen: false,
        });
      } else if (opponentAction === "changePokemon" && friendAction === "changePokemon"){
        that.setState({
          texteAction: that.state.pseudoOpponent + ' retire ' + that.state.pokemonsOpponent[0].name,
          opponentPokemonDisplay: 'leave',
          opponentPokemonInfosDisplay: 'leave',
        })
        let currentPokemonsOpponent = that.state.pokemonsOpponent
        currentPokemonsOpponent[idOpponentAction] = newPokemon
        setTimeout(
          function() {
              that.setState({
                pokemonsOpponent: currentPokemonsOpponent,
                idOpponentFighterPokemon: idOpponentAction,
                opponentPokemonDisplay: '',
                opponentPokemonInfosDisplay: '',
              });
          }
          .bind(that),
          1000
        );
        setTimeout(
          function() {
              that.setState({
                texteAction: that.state.pseudoOpponent + ' envoie ' + that.state.pokemonsOpponent[0].name,
                opponentPokemonDisplay: 'come',
                opponentPokemonInfosDisplay: 'come',
                opponentPokeballPokemonDisplay: 'block',
              });
          }
          .bind(that),
          2000
        );
        setTimeout(
          function() {
              that.setState({
                opponentPokeballPokemonDisplay: '',
              });
          }
          .bind(that),
          2000
        );
        setTimeout(
          function() {
              that.setState({
                texteAction: that.state.pokemons[0].name + ' ça suffit,',
                friendPokemonDisplay: 'leave',
                friendPokemonInfosDisplay: 'leave',
              });
          }
          .bind(that),
          3000
        );
        setTimeout(
          function() {
              that.setState({
                idFighterPokemon: idFriendAction,
                friendPokemonDisplay: '',
                friendPokemonInfosDisplay: '',
                texteAction: that.state.pokemons[idFriendAction].name + ' ! Go !',
              });
          }
          .bind(that),
          4000
        );
        setTimeout(
          function() {
              that.setState({
                friendPokemonDisplay: 'come',
                friendPokemonInfosDisplay: 'come',
              });
          }
          .bind(that),
          5000
        );
        setTimeout(
          function() {
              that.setState({
                texteAction: 'Que doit faire ' + that.state.pokemons[idFriendAction].name + ' ?',
                fightStatus: "fighting",
                pokemonsScreen: false,
                movesScreen: false,
              });
          }
          .bind(that),
          6000
        );
      }
    })
  }

  checkEmail(){
    let checkemail = !this.validateEmail(this.state.signupEmail)
    if (checkemail) {
      this.setState({
        errorEmailFormat: 'error',
        inputSignupEmailStatus: 'inputError',
      })
    }
  }

  changeConnectLogin(value){
    this.setState({
      connectLogin: value.target.value,
      errorWrongLoginsStatus: '',
    })
  }

  changeConnectPassword(value){
    this.setState({
      connectPassword: value.target.value,
      errorWrongLoginsStatus: ''
    })
  }

  changeSignupPseudo(value){
    this.state.socket.emit('checkPseudo', value.target.value)
    this.setState({
      signupPseudo: value.target.value,
      inputSignupPseudoStatus: '',
      errorSignupPseudoStatus: '',
      errorUknown: '',
      errorEmptyField: '',
    })
  }

  changeSignupEmail(value){
    this.setState({
      signupEmail: value.target.value,
      inputSignupEmailStatus: '',
      errorUknown: '',
      errorEmptyField: '',
      errorEmailFormat: '',
      errorSignupEmailStatus: ''
    })
  }

  changeSignupPassword(value){
    this.setState({
      signupPassword: value.target.value,
      errorUknown: '',
      errorEmptyField: '',
      inputSignupPasswordStatus: '',
      inputSignupConfirmPasswordStatus: '',
      errorPasswords: '',
    })
    if (value.target.value.length >= 5 && value.target.value.length <= 20){
      this.setState({
        errorLengthPassword: '',
      })
    }
    console.log(value.target.value, this.state.signupConfirmPassword)
    if (value.target.value === this.state.signupConfirmPassword){
      this.setState({
        errorPasswords: ''
      })
    }
  }

  changeSignupConfirmPassword(value){
    this.setState({
      signupConfirmPassword: value.target.value,
      errorUknown: '',
      errorEmptyField: '',
      inputSignupPasswordStatus: '',
      inputSignupConfirmPasswordStatus: '',
      errorPasswords: '',
    })
    if (this.state.signupPassword === value.target.value){
      this.setState({
        errorPasswords: ''
      })
    }
  }

  login(evt){
    evt.preventDefault()
    if (this.state.connectLogin !== '' && this.state.connectPassword !== ''){
      this.state.socket.emit('login', this.state.connectLogin, this.state.connectPassword)
    }
  }

  signUp(evt){
    evt.preventDefault()
    if (
        this.state.inputSignupEmailStatus !== 'errorInput' && 
        this.state.signupPseudo !== '' &&
        this.state.inputSignupPseudoStatus !== 'errorInput' &&
        this.state.signupEmail !== '' &&
        this.state.inputSignupPasswordStatus !== 'errorInput' &&
        this.state.signupPassword !== '' &&
        this.state.signupConfirmPassword !== '' &&
        this.state.inputSignupConfirmPasswordStatus !== 'errorInput'){
      if (this.state.signupPseudo === '' || this.state.signupEmail === '' || this.state.signupPassword === '' || this.state.signupConfirmPassword === ''){
        this.setState({
          errorEmptyField: 'error',
        })
      } else if (!this.validateEmail(this.state.signupEmail)) {
        this.setState({
          errorEmailFormat: 'error',
          inputSignupEmailStatus: 'inputError',
        })
      } else if (this.state.signupPassword.length < 5 || this.state.signupPassword.length > 20){
        this.setState({
          errorLengthPassword: 'error',
          inputSignupPasswordStatus: 'inputError',
          inputSignupConfirmPasswordStatus: 'inputError'
        })
      } else if (this.state.signupPassword === this.state.signupConfirmPassword){
        this.state.socket.emit('signUp', this.state.signupPseudo, this.state.signupEmail, this.state.signupPassword)
      } else {
        this.setState({
          errorPasswords: 'error',
          inputSignupPasswordStatus: 'inputError',
          inputSignupConfirmPasswordStatus: 'inputError'
        })
      }
    }
  }

  closeModal(){
    this.setState({
      showAlreadyConnectModal: false,
      showReceiptDefy: false,
      showResponseDefy: false,
      showOccupiedOpponent: false,
    })
  }

  validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }

  defy(clientId){
    this.state.socket.emit('defy', clientId)
  }

  acceptDefy(){
    this.state.socket.emit('sendResponseDefy', true, this.state.currentUserIdDefy)
    this.setState({
      showReceiptDefy: false,
    })
  }

  refuseDefy(){
    this.state.socket.emit('sendResponseDefy', false, this.state.currentUserIdDefy)
    this.setState({
      showReceiptDefy: false,
    })
  }

  cancelDefy(){
    this.state.socket.emit('sendCancelDefy', this.state.currentIdUserDefied)
    this.setState({
      showSentDefy: false
    })
  }

  endStarting(){
    this.setState({
      texteAction: 'Que doit faire ' + this.state.pokemons[0].name + ' ?',
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
    this.state.socket.emit('sendFightAction', 'move', id, this.state.idGame, this.state.player);
    this.setState({
      fightStatus: "starting",
      texteAction: "En attente de l'adversaire..."
    })
  }

  sendPokemon(id){
    if (this.state.idFighterPokemon !== id){
      this.state.socket.emit('sendFightAction', 'pokemonChange', id, this.state.idGame, this.state.player);
      this.setState({
        fightStatus: "starting",
        texteAction: "En attente de l'adversaire..."
      })
    }
  }

  render() {
    var content = []
    if (this.state.connected === true){
      if (this.state.status === "fighting"){
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
            for (i = 0; i < this.state.pokemons[this.state.idFighterPokemon].moves.length; i++){
              let id = i
              moves.push(
                <div className={this.state.pokemons[this.state.idFighterPokemon].moves[i].type + " move"} onClick={() => this.sendAttackToServer(id)}>
                  <p className="moveName">{this.state.pokemons[this.state.idFighterPokemon].moves[i].name}</p>
                  <p className={"type " + this.state.pokemons[this.state.idFighterPokemon].moves[i].type}>{this.state.pokemons[this.state.idFighterPokemon].moves[i].type}</p>
                  <p className="pp">PP {this.state.pokemons[this.state.idFighterPokemon].moves[i].pp}/{this.state.pokemons[this.state.idFighterPokemon].moves[i].pp}</p>
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
                      <img alt={this.state.pokemons[i].name} className="pokemonImage" src={this.state.pokemons[i].imageFront}/>
                      <div className="pokemonNameHpLine">
                        <p className="pokemonName">{this.state.pokemons[i].name}</p>
                        <div className="pokemonHpLine">
                      <p className="hp">PV</p>
                      <progress className="green" value={this.state.pokemons[i].stats.currentHp} max={this.state.pokemons[i].stats.maxHp}></progress>
                    </div>
                      </div>
                      <p className="pokemonLevel">N.50</p>
                  <p className="pokemonHpValue">{this.state.pokemons[i].stats.currentHp}/{this.state.pokemons[i].stats.maxHp}</p>
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
                  <img alt="pokeball" className="pokeballTrainer" src={pokeball}/>
                  <img alt="pokeball" className="pokeballTrainer" src={pokeball}/>
                  <img alt="pokeball" className="pokeballTrainer" src={pokeball}/>
                  <img alt="pokeball" className="pokeballTrainer" src={pokeball}/>
                  <img alt="pokeball" className="pokeballTrainer" src={pokeball}/>
                  <img alt="pokeball" className="pokeballTrainer" src={pokeball}/>
                </div>
                <div className="pokeballsOpponentTrainer">
                  <img alt="pokeball" className="pokeballTrainer" src={pokeball}/>
                  <img alt="pokeball" className="pokeballTrainer" src={pokeball}/>
                  <img alt="pokeball" className="pokeballTrainer" src={pokeball}/>
                  <img alt="pokeball" className="pokeballTrainer" src={pokeball}/>
                  <img alt="pokeball" className="pokeballTrainer" src={pokeball}/>
                  <img alt="pokeball" className="pokeballTrainer" src={pokeball}/>
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
        let statusOpponent = []
        let statusFriend = []
        if (this.state.pokemons[this.state.idFighterPokemon].status.paralyzed){
          statusFriend.push(
            <div className="statusFriendPokemon paralyzed">PAR</div>
          )
        }else if (this.state.pokemons[this.state.idFighterPokemon].status.poisoned){
          statusFriend.push(
            <div className="statusFriendPokemon poisoned">POI</div>
          )
        } else if (this.state.pokemons[this.state.idFighterPokemon].status.frozen){
          statusFriend.push(
            <div className="statusFriendPokemon frozen">GEL</div>
          )
        } else if (this.state.pokemons[this.state.idFighterPokemon].status.burnt){
          statusFriend.push(
            <div className="statusFriendPokemon burnt">BRU</div>
          )
        } else if (this.state.pokemons[this.state.idFighterPokemon].status.sleeping){
          statusFriend.push(
            <div className="statusFriendPokemon sleeping">SOM</div>
          )
        }
        content.push(
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
                <img className={ "platform " + this.state.opponentPlatformDisplay} src={require('./images/platform.png')}/>
                <div className={ "shadow " + this.state.opponentShadowDisplay}></div>
                <img className={ "trainer " + this.state.opponentTrainerDisplay} src={require('./images/trainer1.png')}/>
                <img className={ "pokeballPokemon " + this.state.opponentPokeballPokemonDisplay} src={pokeball}/>
                <img className={ "pokemon " + this.state.opponentPokemonDisplay} src={this.state.pokemonsOpponent[this.state.idOpponentFighterPokemon].imageFront}/>
                <div className={ "pokemonInfos " + this.state.opponentPokemonInfosDisplay}>
                  <p className="pokemonName">{this.state.pokemonsOpponent[this.state.idOpponentFighterPokemon].name}</p>
                  <p className="pokemonLevel">N.50</p>
                  <div className="clear"></div>
                  <div className="hpLine">
                    <p className="hp">PV</p>
                    <progress className="green" value={this.state.pokemonsOpponent[this.state.idOpponentFighterPokemon].stats.currentHp} max={this.state.pokemonsOpponent[this.state.idOpponentFighterPokemon].stats.maxHp}></progress>
                  </div>
                </div>
              </div>
              <div className="friendTeam">
                <img className={ "platform " + this.state.friendPlatformDisplay} src={require('./images/platform.png')}/>
                <img className={ "trainer " + this.state.friendTrainerDisplay} src={require('./images/trainer1.png')}/>
                <div className={ "pokeballsTrainer " + this.state.friendPokeballsTrainerDisplay}>
                  <img alt="pokeball" className="pokeballTrainer" src={pokeball}/>
                  <img alt="pokeball" className="pokeballTrainer" src={pokeball}/>
                  <img alt="pokeball" className="pokeballTrainer" src={pokeball}/>
                  <img alt="pokeball" className="pokeballTrainer" src={pokeball}/>
                  <img alt="pokeball" className="pokeballTrainer" src={pokeball}/>
                  <img alt="pokeball" className="pokeballTrainer" src={pokeball}/>
                </div>
                <img alt="pokeball" className={ "pokeballPokemon " + this.state.friendPokeballPokemonDisplay} src={pokeball}/>
                <img alt="pokemon" className={ "pokemon " + this.state.friendPokemonDisplay} src={this.state.pokemons[this.state.idFighterPokemon].imageBack}/>
                <div className={ "pokemonInfos " + this.state.friendPokemonInfosDisplay}>
                  <p className="pokemonName">{this.state.pokemons[this.state.idFighterPokemon].name}</p>
                  <p className="pokemonLevel">N.50</p>
                  <div className="clear"></div>
                  <div className="hpLine">
                    <p className="hp">PV</p>
                    <progress className="green" value={this.state.pokemons[this.state.idFighterPokemon].stats.currentHp} max={this.state.pokemons[this.state.idFighterPokemon].stats.maxHp}></progress>
                  </div>
                  {statusFriend}
                  <p className="hpValue">{this.state.pokemons[this.state.idFighterPokemon].stats.currentHp}/{this.state.pokemons[this.state.idFighterPokemon].stats.maxHp}</p>
                </div>
              </div>
              <div className="dialog">
                <p>{this.state.texteAction}</p>
              </div>
            </div>
            {bottomScreen}
          </div>
        )
      } else {
        let users = []
        let that = this
        Object
        .keys(this.state.allUsers)
        .map(function (key){
          if (that.state.allUsers[key].pseudo !== that.state.infos.pseudo){
            let status = []
            if (that.state.allUsers[key].userStatus === 'inactive'){
              status.push(
                <td className="green">En ligne</td>
              )
            } else {
              status.push(
                <td className="red">occupé</td>
              )
            }
            users.push(
              <tr>
                <td className="pseudo">{that.state.allUsers[key].pseudo}</td>
                <td>null</td>
                <td>null</td>
                <td>null</td>
                {status}
                <td><button onClick={() => that.defy(that.state.allUsers[key].clientId)}><img src={pokeball}/>Défier</button></td>
              </tr>
            )
          }
        })
        content.push(
          <div className="lobby">
            <h1>Bienvenue {this.state.infos.pseudo} !</h1>
            <table>
              <tbody>
                <tr>
                  <td>Pseudo</td>
                  <td>Nombre de combats</td>
                  <td>Ratio</td>
                  <td>Rang</td>
                  <td>Status</td>
                  <td>Action</td>
                </tr>
                {users}
              </tbody>
            </table>
          </div>
        )
      }
    } else {
      let styleButtonLogin
      let styleButtonSignUp
      if (this.state.connectLogin === '' || this.state.connectPassword === ''){
        styleButtonLogin = "locked"
      } else {
        styleButtonLogin = "unlocked"
      }
      console.log(this.state.inputSignupEmailStatus)
      if (
        this.state.inputSignupEmailStatus !== 'errorInput' && 
        this.state.signupPseudo !== '' &&
        this.state.inputSignupPseudoStatus !== 'errorInput' &&
        this.state.signupEmail !== '' &&
        this.state.inputSignupPasswordStatus !== 'errorInput' &&
        this.state.signupPassword !== '' &&
        this.state.signupConfirmPassword !== '' &&
        this.state.inputSignupConfirmPasswordStatus !== 'errorInput'){
        styleButtonSignUp = "unlocked"
      } else {
        styleButtonSignUp = "locked"
      }

      content.push(
        <div class="connect_form">
          <div className="col-md-6">
            <form className="login_form">
              <h4>CONNEXION</h4>
              <input type="text" placeholder="Pseudo ou email" value={this.state.connectLogin} onChange={this.changeConnectLogin}/>
              <input type="password" placeholder="Mot de passe" value={this.state.connectPassword} onChange={this.changeConnectPassword}/>
              <p className={'inactiveErrorMessage ' + this.state.errorWrongLoginsStatus}>Votre identifiant ou mot de passe est incorrect.</p>
              <button preventDefault className={styleButtonLogin} onClick={this.login}>CONNEXION</button>
            </form>
          </div>
          <div className="col-md-6">
            <form className="signup_form">
              <h4>INSCRIPTION</h4>
              <input className={this.state.inputSignupPseudoStatus} type="text" placeholder="Pseudo" value={this.state.signupPseudo} onChange={this.changeSignupPseudo}/>
              <p className={'inactiveErrorMessage ' + this.state.errorSignupPseudoStatus}>Ce pseudo est déjà utilisé.</p>
              <input className={this.state.inputSignupEmailStatus} type="text" placeholder="Email" value={this.state.signupEmail} onChange={this.changeSignupEmail} onBlur={this.checkEmail}/>
              <p className={'inactiveErrorMessage ' + this.state.errorSignupEmailStatus}>Il semble que vous ayez déjà un compte.</p>
              <p className={'inactiveErrorMessage ' + this.state.errorEmailFormat}>L'adresse mail n'est pas valide.</p>
              <input className={this.state.inputSignupPasswordStatus} type="password" placeholder="Mot de passe" value={this.state.signupPassword} onChange={this.changeSignupPassword}/>
              <input className={this.state.inputSignupConfirmPasswordStatus} type="password" placeholder="Confirmez mot de passe" value={this.state.signupConfirmPassword} onChange={this.changeSignupConfirmPassword}/>
              <p className={'inactiveErrorMessage ' + this.state.errorPasswords}>Les mots de passe ne correspondent pas.</p>
              <p className={'inactiveErrorMessage ' + this.state.errorUknown}>Une erreur inconnue s'est produite.</p>
              <p className={'inactiveErrorMessage ' + this.state.errorLengthPassword}>Votre mot de passe doit faire entre 5 et 20 caractères.</p>
              <p className={'inactiveErrorMessage ' + this.state.errorEmptyField}>Tous les champs doivent être remplis.</p>
              <button className={styleButtonSignUp} onClick={this.signUp}>INSCRIPTION</button>
            </form>          
          </div>
        </div>
      )
    }
    return (
      <div className="App">
        <header>
          <ul>
            <li className="logo">
              <img alt="logo" src={logo}/>
            </li>
          </ul>
        </header>
        <div class="body">
        {content}
        </div>
        <div className="clear"></div>
        <Modal open={this.state.showAlreadyConnectModal} center showCloseIcon={false} closeOnOverlayClick={false} onClose={() => this.closeModal()}>
          <div>
            <p>Il semblerait que vous soyez déjà connecté, vous ne pouvez ouvrir qu'une session à la fois</p>
          </div>
        </Modal>
        <Modal open={this.state.showReceiptDefy} center showCloseIcon={false} closeOnOverlayClick={false} onClose={() => this.closeModal()}>
          <div className="modalReceiptDefy">
            <p><span className="pseudo">{this.state.currentUserDefy}</span> te défie</p>
            <button className="buttonAccept" onClick={this.acceptDefy}>Accpeter</button>
            <button className="buttonRefuse" onClick={this.refuseDefy}>Refuser</button>
          </div>
        </Modal>
        <Modal open={this.state.showSentDefy} center showCloseIcon={false} closeOnOverlayClick={false} onClose={() => this.closeModal()}>
          <div className="modalSendDefy">
            <p>Vous défiez <span className="pseudo">{this.state.currentPseudoUserDefied}</span> ...</p>
            <button className="buttonCancel" onClick={this.cancelDefy}>Annuler</button>
          </div>
        </Modal>
        <Modal open={this.state.showResponseDefy} center showCloseIcon={false} closeOnOverlayClick={false} onClose={() => this.closeModal()}>
          <div className="modalResponseDefy">
            <p><span className="pseudo">{this.state.currentPseudoUserDefied}</span> a refusé votre défi.</p>
            <button className="buttonOk" onClick={() => this.closeModal()}>Ok</button>
          </div>
        </Modal>
        <Modal open={this.state.showOccupiedOpponent} center showCloseIcon={false} closeOnOverlayClick={false} onClose={() => this.closeModal()}>
          <div className="modalOccupiedOpponent">
            <p>Ce joueur est occupé</p>
            <button className="buttonOk" onClick={() => this.closeModal()}>Ok</button>
          </div>
        </Modal>
      </div>
    );
  }
}

export default App;
