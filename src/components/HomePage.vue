<template>
  <div>
    <div class="message-container-middle">
        <div v-if="message" class="user-message">{{ message }}</div>
      </div>
    <div v-if="!gameOver">
      <img :src="title" :class="titleClass" />
      <UserMessage />
      <div  :class="formClass">
        <form v-if="!gameId" @submit="handleCreateGame" class="start-form create">
          <input ref="createGameInput" class="input-form" />
          <button type="submit" class="button-form">Create Game</button>
        </form>
        <form v-if="!gameId" @submit="handleJoinGame" class="start-form join">
          <input ref="joinGameInput" class="input-form" />
          <button type="submit" class="button-form">Join New Game</button>
        </form>
        <form v-if="!gameId" @submit="handleSetRejoin" class="start-form join">
          <input ref="rejoinGameInput" class="input-form" />
          <button type="submit" class="button-form">Rejoin Existing Game</button>
        </form>
        <form v-if="makingName" @submit="handleAddNameToGame" class="entername">
          <div class="start-form">
            <div class="button-form">Please Enter Your Name</div>
            <input ref="addNameToGame" class="input-form" />
            <button type="submit" class="button-form">Enter</button>
          </div>
        </form>
        <a
          target="_blank"
          rel="noopener noreferrer"
          v-if="!gameId"
          class="link"
          href="https://www.youtube.com/watch?v=npWo5FA7aPQ"
          >How To Play</a
        >
      </div>
      <LoadScene ref="canvasScene"/>
      <div class="confirm-container" v-if="confirmQuery.bool">
            <button class="confirm-button" @click="()=>{handleConfirm(confirmQuery, true)}">Confirm</button>
            <button class="confirm-button" @click="()=>{handleConfirm(confirmQuery, false)}">Cancel</button>
        </div>
      <button
        v-if="
          !gameRunning && game
            ? game.players.length > 1
            : false && game.players[game.turnIndex].name === player.name
        "
        @click="handleStartGame()"
        class="start-button"
      >
        START GAME
      </button>
      <UI v-if="gameRunning"></UI>
      <img :src="mute" class="mute" @click="(e)=>{handleMute(e)}"/>
    </div>
    <div v-if="game">
      <GameOver v-if="game.gameOver" />
    </div>
  </div>
</template>
  
<script>
import io from "socket.io-client";
import UserMessage from "./UserMessage.vue";
import {
  Vector3
} from "@babylonjs/core";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import UI from "./UI.vue";
import LoadScene from "./LoadScene.vue";
import title from "../../public/assets/RacoionTycoonTitle_preview_rev_2.png";
import mute from "../../public/mute.png"
import unmute from"../../public/unmute.png"
import GameOver from "./GameOver.vue";
import { mapState, mapMutations, mapGetters } from "vuex";
export default {
  name: "HomePage",
  components: {
    UI,
    UserMessage,
    LoadScene,
    GameOver,
  },
  data() {
    return {
      roomId: null,
      gameId: null,
      makingName: false,
      title: title,
      titleClass: "title-big",
      formClass: "start-forms",
      mute:mute,
      unmute:unmute,
      rejoin: false
    };
  },
  computed: {
    ...mapState([
      "gameRunning",
      "game",
      "name",
      "socket",
      "player",
      "gameCanStart",
      "message",
      "gameOver",
      "audio",
      "confirmQuery",
      "HL",
      "board"
    ]),
    ...mapGetters([
      "getGame",
      "getPlayer",
      "getSocket",
      "getGameRunning",
      "getMessage",
      "getGameOver",
      "getAudio",
      "getHL",
      "getBoard"
    ]),
  },
    created() {
    this.updateSocket(io("https://game-test-birds-eye.herokuapp.com", {}));
    //this.updateSocket(io("http://localhost:3000", { }))
    let background = new Audio("background.mp3");
    let flip = new Audio("flip.mp3");
    this.updateAudio({ background: background, flip: flip });
  },
  watch: {
    message() {
      if (this.getMessage()) {
        setTimeout(() => {
          this.updateMessage(null);
        }, 3000);
      }
    },
  },
  async mounted() {

    this.selectCreateGameInput()

    await this.getSocket().on("gameStarted", async (data) => {
      this.updateGame(data.game);
      this.updatePlayer(
        data.game.players.filter(
          (player) => player.name === this.getPlayer().name
        )[0]
      );
      this.updateGameRunning(true);
      this.handleAnimateTitle();
      this.formClass = "hidden";
    });

    await this.getSocket().on("invalidRoom", (data) => {
      this.updateMessage(data.invalidRoom)
    });

    await this.getSocket().on("playerJoined", async () => {
      const data = {
        game: this.getGame(),
        roomId: this.roomId,
      };
      await this.getSocket().emit("welcomePlayer", data);
    });

    await this.getSocket().on("REJOIN_2", async (data) => {
      this.updateGame(data.game)
      this.updatePlayer(
        data.game.players.filter(
          (player) => player.name === data.playerName
        )[0]
      );
      this.updateGameRunning(true);
      this.handleAnimateTitle();
      this.formClass = "hidden";
      await this.getSocket().emit("REJOIN_3", data)
    });

    await this.getSocket().on("joinedRoom", (data) => {
      this.updateGame(data.game);
      this.gameId = data.roomId;
      this.makingName = true; 
    });

    await this.getSocket().on("updateGame", (data) => {
      this.updateGame(data.game);
      this.updatePlayer(
        data.game.players.filter(
          (player) => player.name === this.getPlayer().name
        )[0]
      );
    });

    await this.getSocket().on("updatePlayer", (data) => {
      this.updatePlayer(data.player);
    });

    await this.getSocket().on("gameStartedQuery", (data) => {
      const bool = this.getGame().turnIndex;
      data.bool = bool;
      this.getSocket().emit("gameStartedQueryResponse", data);
    });

    await this.getSocket().on("emitMessage", (message) => {
      this.updateMessage(message);
    });

    await this.getSocket().on("UPDATE_GAME", (game) => {
      let thisPlayer = game.players.filter(
        (player) => player.name === this.getPlayer().name
      )[0];

      this.updateGame(game);
      this.updatePlayer(thisPlayer);
      this.updateMessage(game.message);

      let player = this.getPlayer();
      switch (game.action) {
        case "DISCARD":
          if (game.players[game.turnIndex].name === player.name) {
            this.updateMessage(
              `You must discard ${
                player.commodies.length - player.commodityMax
              } commodies.`
            );
            player.discarding = true;
            this.updatePlayer(player);
          }
          game.action = null;
          this.updateGame(game);
          break;

        case "GAME_OVER":
          this.updateMessage("Game Over!");
          this.updateGameOver(true);
          break;

        default:
          break;
      }
    });
  },

  methods: {
    //state methods
    ...mapMutations([
      "updateGameRunning",
      "updateGame",
      "updateName",
      "updatePlayer",
      "updateSocket",
      "updateGameCanStart",
      "updateMessage",
      "updateAudio",
      "updateGameOver",
      "updateConfirmQuery",
      "updateHL",
      "updateBoard"
    ]),

    selectCreateGameInput() {
      this.$refs.createGameInput.select();
    },

    handleRejoinGame() {
      const data = {
        gameId: this.gameId,
        playerName: this.$refs.addNameToGame.value
      }
      console.log(data)
      this.getSocket().emit("REJOIN_1", data);
    },

    //pre game methods
    async handleStartGame() {
      const data = {
        game: this.getGame(),
        roomId: this.roomId,
      };
      await this.getSocket().emit("startGame", data);
    },
    async handleCreateGame(e) {
      e.preventDefault();
      if (this.$refs.createGameInput.value !== "") {
        this.roomId = this.$refs.createGameInput.value;
        const data = {
          roomId: this.$refs.createGameInput.value,
        };
        await this.getSocket().emit("createRoom", data);
        this.$refs.createGameInput.value = "";
        this.makingName = false;
        let audio = new Audio("background.mp3");
        audio.volume = 0.05;
        audio.loop = true;
        audio.play();
        this.updateAudio({ background: audio });
      }
    },
    async handleMute(e) {
      let audio = this.getAudio()
      audio.background.volume === 0 ? audio.background.volume = .05 : audio.background.volume = 0
      audio.background.volume === 0 ? e.target.src = this.unmute: e.target.src = this.mute
      this.updateAudio(audio)
    },
    async handleJoinGame(e) {
      e.preventDefault();
      this.roomId = this.$refs.joinGameInput.value;
      const data = {
        roomId: this.$refs.joinGameInput.value,
      };
      await this.getSocket().emit("joinRoom", data);
      this.$refs.joinGameInput.value = "";
      this.makingName = false;
      let audio = {};
      audio.background = new Audio("background.mp3");
      audio.background.volume = 0.025;
      audio.background.loop = true;
      audio.background.play();

      audio.flip = new Audio("flip.mp3");
      audio.flip.volume = 0.2;
      audio.flip.loop = false;
      this.updateAudio(audio);
    },
    async handleAddNameToGame(e) {
      e.preventDefault();
      if(this.rejoin){
        this.handleRejoinGame()
        return
      }
      this.updatePlayer({name:this.$refs.addNameToGame.value})
      this.updateName(this.$refs.addNameToGame.value);
      const data = {
        name: this.$refs.addNameToGame.value,
        roomId: this.roomId,
        game: this.getGame(),
      };
      await this.getSocket().emit("addNameToGame", data);
      this.$refs.addNameToGame.value = "";
      this.makingName = false;
    },

    async handleSetRejoin(e) {
      e.preventDefault()
      this.rejoin = true
      this.makingName = true
      this.gameId = this.$refs.rejoinGameInput.value;
    },

    handleConfirm(choice, confirmed){
      let newTarget = new Vector3(18.4, 1.1, -3.2);
      let newPosition = new Vector3(18.4, 2.2, -2.3);
      this.$refs.canvasScene.moveCamera(newPosition, newTarget, this.getGame(), false)
      const board = this.getBoard()
      switch(choice.type){
        case "RAILROAD":
          if(confirmed) this.handleStartAuction(choice.payload)
          board.cards.shown.railroads[choice.payload]?this.getHL().addMesh(
            board.cards.shown.railroads[choice.payload],
            new BABYLON.Color3(1, 1, 1)
          ):null
          break

        case "TOWN":
          if(confirmed) this.handleBuyTown()
          board.cards.shown.town?this.getHL().addMesh(
            board.cards.shown.town,
            new BABYLON.Color3(1, 1, 1)
          ):null
          break

        case "BUILDING":
          if(confirmed) this.handleBuyBuilding(choice.payload)
          board.cards.shown.buildings[choice.payload]?this.getHL().addMesh(
            board.cards.shown.buildings[choice.payload],
            new BABYLON.Color3(1, 1, 1)
          ):null
          break

        default:
          break
      }
      this.updateConfirmQuery({bool:false})
    },

    //railroad methods
    handleStartAuction(railroad) {
      let player = this.getPlayer();
      let game = this.getGame();
      if (
        game.players[game.turnIndex].name === player.name &&
        !player.discarding &&
        !player.isInAuction &&
        !player.pickingProduceItems &&
        !player.selling &&
        !player.buyingTown &&
        !player.buyingBuilding
      ) {
        let index = 0
        if(game.shownRailRoads[railroad]){
          index = railroad
        }
        if (game.shownRailRoads[index].minimumPrice > player.money) {
          this.updateMessage("Not Enough Money");
        } else {
          if (
            !player.inAuction &&
            !player.selling &&
            !player.pickingProduceItems
          ) {
            game.payload = index;
            game.action = "START_AUCTION";
            this.getSocket().emit("ACTION", game);
          }
        }
      } else {
        this.updateMessage("Not Your Turn");
      }
    },

    //building methods
    handleBuyBuilding(index) {
      let player = this.getPlayer();
      let game = this.getGame();
      if (
        game.players[game.turnIndex].name === player.name &&
        !player.discarding &&
        !player.isInAuction &&
        !player.pickingProduceItems &&
        !player.selling &&
        !player.pickingTownCommodies &&
        !player.buyingBuilding
      ) {
        if (game.shownBuildings[index].price <= player.money) {
          player.buyingBuilding = true;
          game.players[game.turnIndex] = player;
          game.buildingBuyIndex = index;
          game.action = "BUY_BUILDING";
          this.getSocket().emit("ACTION", game);
        } else {
          this.updateMessage("Not Enough Money");
        }
      } else {
        this.updateMessage("Cannot Do That Now");
      }
    },

    //town methods
    handleBuyTown() {
      let player = this.getPlayer();
      let game = this.getGame();
      if (
        game.players[game.turnIndex].name === player.name &&
        !player.discarding &&
        !player.isInAuction &&
        !player.pickingProduceItems &&
        !player.selling &&
        !player.pickingTownCommodies &&
        !player.buyingBuilding
      ) {
        if (
          player.commodies.filter((commodity) => {
            return commodity.name === game.avaiableTown.specificType;
          }).length >=
          game.avaiableTown.specificPrice - player.townBonus
        ) {
          game.action = "BUY_TOWN_SPECIFIC";
          this.getSocket().emit("ACTION", game);
        } else {
          this.updateMessage(
            `Not Enough ${
              game.avaiableTown.specificType
            }. You may purchase with any ${
              game.avaiableTown.anyPrice - player.townBonus
            } commodies`
          );
          if (
            player.commodies.length >=
            game.avaiableTown.anyPrice - player.townBonus
          ) {
            player.pickingTownCommodies = true;
            this.updatePlayer(player);
          } else {
            this.updateMessage(`Not Enough Commodies`);
          }
        }
      } else {
        this.updateMessage("Cannot Do That Now.");
      }
    },

    //animations
    handleAnimateTitle() {
      this.titleClass = "title-small";
    },
  },
};
</script>

<style>
.rejoin-form{
  position:absolute;
  right:2vw;
  top: 20vh;
  width: 30vw;
  display: flex;
  flex-flow: column nowrap;
  margin: 20px;
  justify-content: space-between;
  align-items: space-between;
  background: rgba(43, 17, 17, 0.839);
  border: 3px solid rgb(148, 98, 47);
  border-radius: 50px;
}
.center{
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-around;
  padding-bottom: 10px;
}
.rejoin-words{
  font-size: 2.5em;
  font-family: main;
  text-align: center;
  background: none;
  border: none;
  font-weight: bolder;
  text-decoration: none;
  color: rgb(167, 142, 119);
  padding: 15px;
  padding-left: 25px;
  padding-right: 25px;
  border-radius: 20px;
  text-shadow: rgb(0, 0, 0) 2px 2px 2px;
}
@font-face {
  font-family: main;
  src: url("../../public/assets/MaguireThin-eZY8e.otf");
}
.fullscreen {
  position: absolute;
  bottom: 0px;
  left: 50vw;
}

@keyframes titleAnimation {
  0% {
    position: absolute;
    width: 20vw;
    right: 40vw;
  }

  100% {
    position: absolute;
    width: 10vw;
    right: 85vw;
  }
}
.hidden {
  display: none;
  position: absolute;
  top: -100vh;
}
.user-message {
  margin: 10px;
  font-size: 1.5em;
  font-family: main;
  font-weight: bolder;
  text-decoration: none;
  color: rgb(167, 142, 119);
  padding: 15px;
  text-shadow: rgb(0, 0, 0) 2px 2px 2px;
  background: rgb(43, 17, 17);
  border: 3px solid rgb(148, 98, 47);
  border-radius: 50px;
}
.message-container-middle{
  z-index: 2;
  position:absolute;
  width:100%;
  left: 0;
  right: 0;
  top: 20px;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
}
.link {
  display: flex;
  flex-flow: row nowrap;
  margin: 10px;
  justify-content: center;
  align-items: center;
  background: rgba(43, 17, 17, 0.839);
  border: 3px solid rgb(148, 98, 47);
  border-radius: 50px;
  font-size: 2em;
  font-family: main;
  background: none;
  border: none;
  font-weight: bolder;
  text-decoration: none;
  color: rgb(167, 142, 119);
  padding: 15px;
  padding-left: 25px;
  padding-right: 25px;
  border-radius: 20px;
  text-shadow: rgb(0, 0, 0) 2px 2px 2px;
}
.title-big {
  position: absolute;
  width: 20vw;
  right: 40vw;
  min-width: 100px;
}

.title-small {
  position: absolute;
  width: 10vw;
  right: 85vw;
  animation: titleAnimation 0.5s;
  min-width: 100px;
}

canvas {
  width: 100%;
  border: none;
  outline: none;
}

.flexrow {
  display: flex;
  flex: row nowrap;
}
.flex-item {
  margin: 10px;
}

.start-forms {
  font-size: 1em;
  position: absolute;
  right: 2vw;
  width: 45vw;
  display: flex;
  flex-flow: column nowrap;
  align-items: space-between;
  top: 20vh;
  justify-content: end;
}

.confirm-container{
  position: absolute;
  display: flex;
  flex-flow: row nowrap;
  width: 100%;
  left:0;
  justify-content: center;
  align-items:center;
}
.confirm-button{
  font-size: 1.5em;
  font-family: main;
  margin: 20px;
  background: none;
  border: none;
  font-weight: bolder;
  text-decoration: none;
  color: rgb(167, 142, 119);
  padding: 5px;
  padding-left: 15px;
  padding-right: 15px;
  text-shadow: rgb(0, 0, 0) 2px 2px 2px;
  background: rgb(43, 17, 17);
  border: 3px solid rgb(148, 98, 47);
  border-radius: 50px;
}

.start-form {
  display: flex;
  flex-flow: row nowrap;
  margin: 15px;
  justify-content: space-between;
  align-items: space-between;
  background: rgba(43, 17, 17, 0.839);
  border: 3px solid rgb(148, 98, 47);
  border-radius: 50px;
}

.button-form {
  font-size: 1.5em;
  font-family: main;
  background: none;
  border: none;
  font-weight: bolder;
  text-decoration: none;
  color: rgb(167, 153, 119);
  padding: 15px;
  padding-left: 25px;
  padding-right: 25px;
  border-radius: 20px;
  text-shadow: rgb(0, 0, 0) 2px 2px 2px;
}

.input-form {
  font-size: 1em;
  font-family: main;
  outline: none;
  border: 1px solid rgb(148, 98, 47);
  border-radius: 50px;
  font-weight: bold;
  text-decoration: none;
  color: rgb(148, 108, 70);
  padding: 10px;
  padding-left: 10px;
  margin: 15px;
  background: rgba(43, 17, 17, 0.031);
  box-shadow: rgb(12, 12, 12) 4px 4px 10px;
  align-self: center;
  width: 50%;
}

.entername {
  display: flex;
  flex-flow: column nowrap;
}

.button-form:hover {
  text-shadow: rgb(5, 4, 3) 5px 0px 5px;
}

.start-form:hover {
  background: rgb(43, 17, 17);
}

.link:hover {
  text-shadow: rgb(5, 4, 3) 6px 6px 13px;
}

.start-button {
  font-size: 3em;
  font-family: main;
  background: rgba(43, 17, 17, 0.839);
  border: 3px solid rgb(148, 98, 47);
  font-weight: bolder;
  text-decoration: none;
  color: rgb(167, 142, 119);
  padding: 15px;
  padding-left: 25px;
  padding-right: 25px;
  border-radius: 20px;
  text-shadow: rgb(0, 0, 0) 2px 2px 2px;
  margin: 15px;
}

.start-button:hover {
  box-shadow: 3px 3px 10px black;
}
</style>
  