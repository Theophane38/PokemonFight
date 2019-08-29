# PokemonFight

## A propos

PokemonFight est une application développée en React.JS pour la partie front-end et Node.JS pour la partie backend. La base de donnée est elle en MySQL. La librairie Socket.IO est utilisée afin d'avoir des combats en temps rééel. Cette dernière est toujours en cours de développement et permet de faire des combats de Pokemons avec d'autres joueurs en ligne.
Seuls les Pokemons de la première génération sont disponibles.

## Détails de l'application

### Page de connexion

L'application commence par une page de connexion simple sur laquelle l'utilisateur peut créer un compte ou se connecter.

page de connexion
![Capture-login](https://user-images.githubusercontent.com/32487884/63873384-c7d3e500-c9bf-11e9-969c-6fb6e1d77ea7.JPG)


### Page d'accueil

Sur la page de connexion on peut voir les joueurs actuellement connectés et voir si ils sont disponible. Si oui l'utilisateur peut alors défier un des joueurs.

page d'accueil
![Capture-accueil](https://user-images.githubusercontent.com/32487884/63872225-b984c980-c9bd-11e9-8329-a916cac847d8.JPG)

Un message s'affichera sur les ecrans du joueur défiant et du joueur défié et ils apparaîtron en tant qu'occupé et seront donc non défiable.

Joueur défiant
![Capture-defier](https://user-images.githubusercontent.com/32487884/63872251-c99ca900-c9bd-11e9-922f-55115f5a2c63.JPG)

Joueur défié
![Capture-défié](https://user-images.githubusercontent.com/32487884/63872278-d1f4e400-c9bd-11e9-80cf-82bc0f45624c.JPG)

### Page de combat

Si le joueur défié accpete le combat, ce dernier commence avec une animation en CSS

Chacun des joueurs devra choisir une action à effetcuer (Attaquer ou changer de Pokemon) puis attendre que l'autre joueur face de même.

Choix de l'action
![Capture-action](https://user-images.githubusercontent.com/32487884/63872415-f2bd3980-c9bd-11e9-8018-c98c9b3ea63f.JPG)

Choix d'attaque
![Capture-attaques](https://user-images.githubusercontent.com/32487884/63872569-344de480-c9be-11e9-8f4e-79105dc6a7d1.JPG)

Choix de pokemon
![Capture-changePokemon](https://user-images.githubusercontent.com/32487884/63872588-3ca61f80-c9be-11e9-82c4-8eb79b5dbdc5.JPG)

Attente
![Capture-attente](https://user-images.githubusercontent.com/32487884/63872975-ff8e5d00-c9be-11e9-95cc-de358ea67abd.JPG)

Une animation est présente pour le changement de pokemon.
![React-App-Google-Chrome-28_08_2019-18_19_26_Trim-_online-video-cutter com_](https://user-images.githubusercontent.com/32487884/63922569-3909ab80-ca45-11e9-9cb8-5e59dc2580fc.gif)

### A ajouter

Cette application est loin d'être terminée, voici la liste des options à ajouter:
* Configurer toutes les attaques (Pour le moment seuls les attaques qui font des dégats sont initialisées)
* Gérer le changement de Pokemon lorsqu'un d'eux est KO
* Gérer la fin de combat (En cas de défaite ou d'abandon d'un des joueurs).
* Ajouter un système de classement et de ration.
* Ajouter des animations d'attaque.
* Ajouter les capacité spéciales des pokemons.
* Améliorer design principal.
