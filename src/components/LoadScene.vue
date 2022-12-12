<template>
  <div>
    <canvas ref="bjsCanvas" />
  </div>
</template>
  
<script>
import {
  Engine,
  Scene,
  Vector3,
  Color3,
  HemisphericLight,
  Animation,
} from "@babylonjs/core";
import { SceneLoader } from "@babylonjs/core/Loading";
import board from "../../public/assets/board.jpg";
import "babylonjs-loaders";
import "@babylonjs/loaders/glTF";
import "@babylonjs/loaders/STL";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import { mapGetters, mapState, mapMutations } from "vuex";
export default {
  name: "LoadScene",

  mounted() {
    this.canvas = this.$refs.bjsCanvas;

    this.flip = new Audio("flip.mp3");

    this.getSocket().on("gameStarted", (data) => {
      this.setUpBoard(data.game);
    });

    this.getSocket().on("REJOIN_4", async (data) => {
      this.setUpBoard(data.game);
    })

    this.getSocket().on("UPDATE_GAME", (game) => {
      switch (game.animation.action) {
        case "MOVE_COMMODIES":
          this.handleMoveCommodies(game);
          break;

        case "SHOW_BUILDING":
          this.handleShowNewCard(game.animation.payload, "BUILDING");
          break;

        case "SHOW_RAILROAD":
          this.handleShowNewCard(game.animation.payload, "RAILROAD");
          break;

        case "SHOW_TOWN":
          this.handleShowNewCard(null, "TOWN");
          break;

        default:
          break;
      }
      game.animation.action = null;
      game.animation.payload = {};
      this.updateGame(game);
    });
  },
  watch:{
    canvas(){
      if (this.canvas) {
        this.createScene();
      }
    }
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
      "board",
      "confirmQuery",
      "HL"
    ]),
    ...mapGetters([
      "getGame",
      "getPlayer",
      "getSocket",
      "getGameRunning",
      "getBoard",
      "getFPS",
      "getAudio",
      "getConfirmQuery",
      "getHL"
    ]),
  },
  data() {
    return {
      scene: null,
      canvas: null,
      engine: null,
      camera: null,
      card: null,
      theTavern: null,
      commodies: [],
      hl: null,
      flip: null,
      resizeQueue: false
    };
  },
  methods: {
    ...mapMutations([
      "updateFPS",
      "updateGameRunning",
      "updateGame",
      "updateName",
      "updatePlayer",
      "updateSocket",
      "updateGameCanStart",
      "updateMessage",
      "updateBoard",
      "updateConfirmQuery",
      "updateHL"
    ]),

    setUpBoard(game) {
      let newTarget = new Vector3(18.4, 1.1, -3.2);
      let newPosition = new Vector3(18.4, 2.2, -2.3);
      return this.moveCamera(newPosition, newTarget, game, true);
    },

    moveCamera(position, target, game, initial) {
      if (!this.camera) {
        return;
      }
      const frameRate = 10;
      let setPosition = new Animation(
        "setPosition",
        "position",
        frameRate,
        Animation.ANIMATIONTYPE_VECTOR3,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      let setTarget = new Animation(
        "setTarget",
        "target",
        frameRate,
        Animation.ANIMATIONTYPE_VECTOR3,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      let positionFrames = [
        {
          frame: 0,
          value: this.camera.position,
        },
        {
          frame: frameRate * 0.75,
          value: position,
        },
      ];

      let targetFrames = [
        {
          frame: 0,
          value: this.camera._currentTarget,
        },
        {
          frame: frameRate * 0.75,
          value: target,
        },
      ];

      setPosition.setKeys(positionFrames);
      setTarget.setKeys(targetFrames);

      this.camera.animations.push(setPosition);
      this.camera.animations.push(setTarget);
      let cameraMoved = this.scene.beginDirectAnimation(
        this.camera,
        [setPosition, setTarget],
        0,
        frameRate * 1,
        false
      );

      if (initial) {
        cameraMoved.onAnimationEnd = () => {
          return this.postInitialCameraMove(game);
        };
      }
    },

    async postInitialCameraMove(game) {
      this.loadTexturesAsync(game).then(async (textures) => {
        let board = this.createAllCards(game, textures);

        board.cards.shown.railroads[0]?this.getHL().addMesh(
          board.cards.shown.railroads[0],
          new BABYLON.Color3(1, 1, 1)
        ):null
        board.cards.shown.railroads[1]?this.getHL().addMesh(
          board.cards.shown.railroads[1],
          new BABYLON.Color3(1, 1, 1)
        ):null
        board.cards.shown.town? this.getHL().addMesh(board.cards.shown.town, new BABYLON.Color3(1, 1, 1)):null
        board.cards.shown.buildings[0]?this.getHL().addMesh(
          board.cards.shown.buildings[0],
          new BABYLON.Color3(1, 1, 1)
        ):null
        board.cards.shown.buildings[1]?this.getHL().addMesh(
          board.cards.shown.buildings[1],
          new BABYLON.Color3(1, 1, 1)
        ):null
        board.cards.shown.buildings[2]?this.getHL().addMesh(
          board.cards.shown.buildings[2],
          new BABYLON.Color3(1, 1, 1)
        ):null
        board.cards.shown.buildings[3]?this.getHL().addMesh(
          board.cards.shown.buildings[3],
          new BABYLON.Color3(1, 1, 1)
        ):null

        await this.animateDeckPromise(board.cards.decks.railroads, {
          x: 19,
          y: 0.94,
          z: -3.3875,
        });
        this.moveModel(
          board.cards.shown.railroads[0],
          { x: 18.755, y: 0.94, z: -3.3875 },
          "z",
          0.3,
          Math.PI
        ).onAnimationEnd = () => {
          this.moveModel(
            board.cards.shown.railroads[1],
            { x: 18.52, y: 0.94, z: -3.3875 },
            "z",
            0.3,
            Math.PI
          ).onAnimationEnd = async () => {
            await this.animateDeckPromise(board.cards.decks.towns, {
              x: 18.051,
              y: 0.94,
              z: -3.3875,
            });
            this.moveModel(
              board.cards.shown.town,
              { x: 17.81, y: 0.94, z: -3.3875 },
              "z",
              0.3,
              Math.PI
            ).onAnimationEnd = async () => {
              await this.animateDeckPromise(board.cards.decks.buildings, {
                x: 18.7171,
                y: 0.94,
                z: -2.969,
              });
              this.moveModel(
                board.cards.shown.buildings[0],
                { x: 18.5, y: 0.94, z: -2.969 },
                "z",
                0.3,
                Math.PI
              ).onAnimationEnd = () => {
                this.moveModel(
                  board.cards.shown.buildings[1],
                  { x: 18.285, y: 0.94, z: -2.969 },
                  "z",
                  0.3,
                  Math.PI
                ).onAnimationEnd = () => {
                  this.moveModel(
                    board.cards.shown.buildings[2],
                    { x: 18.07, y: 0.94, z: -2.969 },
                    "z",
                    0.3,
                    Math.PI
                  ).onAnimationEnd = () => {
                    this.moveModel(
                      board.cards.shown.buildings[3],
                      { x: 17.855, y: 0.94, z: -2.969 },
                      "z",
                      0.3,
                      Math.PI
                    ).onAnimationEnd = () => {
                      this.moveModel(
                        board.cards.shown.railroads[0],
                        { x: 18.755, y: 0.94, z: -3.3875 },
                        "x",
                        0.3,
                        0
                      ).onAnimationEnd = () => {
                        this.moveModel(
                          board.cards.shown.railroads[1],
                          { x: 18.52, y: 0.94, z: -3.3875 },
                          "x",
                          0.3,
                          0
                        ).onAnimationEnd = async () => {
                          this.moveModel(
                            board.cards.shown.town,
                            { x: 17.81, y: 0.94, z: -3.3875 },
                            "x",
                            0.3,
                            0
                          ).onAnimationEnd = async () => {
                            this.moveModel(
                              board.cards.shown.buildings[0],
                              { x: 18.5, y: 0.94, z: -2.969 },
                              "x",
                              0.3,
                              0
                            ).onAnimationEnd = () => {
                              this.moveModel(
                                board.cards.shown.buildings[1],
                                { x: 18.285, y: 0.94, z: -2.969 },
                                "x",
                                0.3,
                                0
                              ).onAnimationEnd = () => {
                                this.moveModel(
                                  board.cards.shown.buildings[2],
                                  { x: 18.07, y: 0.94, z: -2.969 },
                                  "x",
                                  0.3,
                                  0
                                ).onAnimationEnd = () => {
                                  this.moveModel(
                                    board.cards.shown.buildings[3],
                                    { x: 17.855, y: 0.94, z: -2.969 },
                                    "x",
                                    0.3,
                                    0
                                  ).onAnimationEnd = () => {
                                    this.updateBoard(board);
                                    
                                    //sets the position of the commodies if rejoining a game
                                    this.handleMoveCommodiesOnRejoin(this.getCommodityPositions())
                                    return board
                                  };
                                };
                              };
                            };
                          };
                        };
                      };
                    };
                  };
                };
              };
            };
          };
        };
      });
    },

    getCommodityPositions() {
      const commodies = {...this.getGame().commodityValues}
      commodies.wood -= 1
      commodies.wheat -= 1
      commodies.coal -= 2
      commodies.iron -= 2
      commodies.goods -= 3
      commodies.luxury -= 3
      return commodies
    },

    handleShowNewCard(index, type) {
      let newPosition;
      let board = this.getBoard();
      switch (type) {
        case "RAILROAD":
          newPosition = {
            x: board.cards.shown.railroads[index].position._x,
            y: board.cards.shown.railroads[index].position._y,
            z: board.cards.shown.railroads[index].position._z,
          };
          this.moveModel(
            board.cards.shown.railroads[index],
            { x: 18.5, y: 1, z: 0 },
            null,
            0.7,
            null
          ).onAnimationEnd = () => {
            if(board.cards.decks.railroads[0]){
              this.moveModel(
                board.cards.decks.railroads[0],
                newPosition,
                "x",
                0.3,
                0
              ).onAnimationEnd = () => {
                board.cards.shown.railroads.splice(
                  index,
                  1,
                  ...board.cards.decks.railroads.splice(0, 1)
                );
                board.cards.shown.railroads[index].actionManager =
                  new BABYLON.ActionManager(this.scene);
                board.cards.shown.railroads[index].actionManager.registerAction(
                  new BABYLON.ExecuteCodeAction(
                    BABYLON.ActionManager.OnPickTrigger,
                    () => {
                      this.handleConfirmQuery("RAILROAD", index);
                    }
                  )
                );
                this.getHL().addMesh(
                  board.cards.shown.railroads[index],
                  new BABYLON.Color3(1, 1, 1)
                );
              };
            }
          };
          break;
        case "TOWN":
          newPosition = {
            x: board.cards.shown.town.position._x,
            y: board.cards.shown.town.position._y,
            z: board.cards.shown.town.position._z,
          };
          this.moveModel(
            board.cards.shown.town,
            { x: 18.5, y: 1, z: 0 },
            null,
            0.7,
            null
          ).onAnimationEnd = () => {
            if (board.cards.decks.towns[0]) {
              this.moveModel(
                board.cards.decks.towns[0],
                newPosition,
                "x",
                0.3,
                0
              ).onAnimationEnd = () => {
                board.cards.shown.town = board.cards.decks.towns.splice(
                  0,
                  1
                )[0];
                board.cards.shown.town.actionManager =
                  new BABYLON.ActionManager(this.scene);
                board.cards.shown.town.actionManager.registerAction(
                  new BABYLON.ExecuteCodeAction(
                    BABYLON.ActionManager.OnPickTrigger,
                    () => {
                      this.handleConfirmQuery("TOWN", null);
                    }
                  )
                );
                this.getHL().addMesh(
                  board.cards.shown.town,
                  new BABYLON.Color3(1, 1, 1)
                );
              };
            }
          };
          break;
        case "BUILDING":
          newPosition = {
            x: board.cards.shown.buildings[index].position._x,
            y: board.cards.shown.buildings[index].position._y,
            z: board.cards.shown.buildings[index].position._z,
          };
          this.moveModel(
            board.cards.shown.buildings[index],
            { x: 18.5, y: 1, z: 0 },
            null,
            0.7,
            null
          ).onAnimationEnd = () => {
            if(board.cards.decks.buildings[0]){
              this.moveModel(
                board.cards.decks.buildings[0],
                newPosition,
                "x",
                0.3,
                0
              ).onAnimationEnd = () => {
                board.cards.shown.buildings.splice(
                  index,
                  1,
                  ...board.cards.decks.buildings.splice(0, 1)
                );
                board.cards.shown.buildings[index].actionManager =
                  new BABYLON.ActionManager(this.scene);
                board.cards.shown.buildings[index].actionManager.registerAction(
                  new BABYLON.ExecuteCodeAction(
                    BABYLON.ActionManager.OnPickTrigger,
                    () => {
                      this.handleConfirmQuery("BUILDING",index);
                    }
                  )
                );
                this.getHL().addMesh(
                  board.cards.shown.buildings[index],
                  new BABYLON.Color3(1, 1, 1)
                );
              };
            }
          };
          break;

        default:
          break;
      }
    },

    handleMoveCommodiesOnRejoin(commodies){
      for (const key in commodies){
        let board = this.getBoard();
        board.commodies[key] = this.moveCommodity(
        commodies[key],
        board,
        key
        )
        this.updateBoard(board);
      }
    },
    handleMoveCommodies(game) {
      for (let key in game.animation.payload) {
        let board = this.getBoard();
        board.commodies[key] = this.moveCommodity(
        game.animation.payload[key],
        board,
        key
        );
        this.updateBoard(board);
      }
      game.animation.action = null;
      game.animation.payload = {};
      this.updateGame(game);
    },

    moveCommodity(number, board, key) {
      let commodity = board.commodies[key];

      const frameRate = 30;

      let zChange = 0;
      let xChange = 0;

      if (number > 0) {
        zChange = -0.045;
        number -= 1;
      } else if (number < 0) {
        zChange = 0.045;
        number += 1;
      } else {
        return commodity
      }

      console.log(commodity)
      if (commodity.side === "left") {
        xChange = -0.0642;
        commodity.side = "right";
      } else {
        xChange = 0.0642;
        commodity.side = "left";
      }


      let positionX = new Animation(
        "positionX",
        "position.x",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      let positionY = new Animation(
        "positionY",
        "position.y",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      let positionZ = new Animation(
        "positionZ",
        "position.z",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      let xFrames = [
        {
          frame: 0,
          value: commodity.model.position.x,
        },
        {
          frame: frameRate * 0.5,
          value: commodity.model.position.x + xChange,
        },
      ];
      let yFrames = [
        {
          frame: 0,
          value: commodity.model.position.y,
        },
        {
          frame: frameRate * 0.25,
          value: 1,
        },
        {
          frame: frameRate * 0.5,
          value: commodity.model.position.y,
        },
      ];
      let zFrames = [
        {
          frame: 0,
          value: commodity.model.position.z,
        },
        {
          frame: frameRate * 0.5,
          value: commodity.model.position.z + zChange,
        },
      ];

      positionX.setKeys(xFrames);
      positionY.setKeys(yFrames);
      positionZ.setKeys(zFrames);

      commodity.model.animations.push(positionX);
      commodity.model.animations.push(positionY);
      commodity.model.animations.push(positionZ);

      let animation = this.scene.beginDirectAnimation(
        commodity.model,
        [positionX, positionY, positionZ],
        0,
        frameRate * 0.5,
        false
      );

      console.log(board)
      animation.onAnimationEnd = () => {
        board.commodies[key] = commodity;
        this.updateBoard(board, key, number);
        this.moveCommodity(number, board, key);
      };
    },

    animateDeckPromise(array, position) {
      return new Promise((resolve) => {
        if(array.length){
          this.animateDeck(array, position, () => resolve(), array.length? array.length - 1 : 1);
        }else(resolve())
      });
    },

    animateDeck(array, position, resolve, index) {
      if (index > 0) {
        let animation = this.moveModel(
          array[index],
          position,
          "z",
          0.15,
          -Math.PI
        );
        animation.onAnimationEnd = () => {
          index--;
          position.y += 0.005;
          this.animateDeck(array, position, resolve, index);
        };
      } else {
        let animation = this.moveModel(
          array[index],
          position,
          "z",
          0.15,
          -Math.PI
        );
        animation.onAnimationEnd = () => {
          resolve();
        };
      }
    },

    returnTexture(textures, imageLink) {
      return textures[imageLink];
    },

    createCardGeometry(options) {
      let cardGeometry = BABYLON.MeshBuilder.CreateBox(
        "cardGeometry",
        options,
        this.scene
      );
      let verticesCount = cardGeometry.getTotalVertices();

      let multi = new BABYLON.MultiMaterial("multi", this.scene);
      multi.subMaterials[0] = new BABYLON.StandardMaterial("front", this.scene);
      multi.subMaterials[1] = new BABYLON.StandardMaterial("back", this.scene);

      cardGeometry.material = multi;
      cardGeometry.subMeshes = [
        new BABYLON.SubMesh(0, 0, verticesCount, 30, 6, cardGeometry),
        new BABYLON.SubMesh(1, 1, verticesCount, 6, 24, cardGeometry),
      ];

      return cardGeometry;
    },

    createAllCards(game, textures) {
      let cardGeometry = this.createCardGeometry({
        width: 0.27,
        depth: 0.18,
        height: 0.002,
      });

      let buildingGeometry = this.createCardGeometry({
        width: 0.16,
        depth: 0.16,
        height: 0.004,
      });

      let board = this.getBoard();

      //towns
      if(game.townDeck.length){
        for (let i = 0; i < game.townDeck.length; i++) {
          board.cards.decks.towns.push(
            this.createCard(
              game.townDeck[i],
              new Vector3(18.051, 0.94, -2),
              textures[game.townDeck[i].imageLink],
              textures["townCover.jpg"],
              cardGeometry
            )
          );
        }
      }
      game.avaiableTown ? board.cards.shown.town = this.createCard(
        game.avaiableTown,
        new Vector3(17.8, 0.94, -2),
        textures[game.avaiableTown.imageLink],
        textures["townCover.jpg"],
        cardGeometry
      ): board.cards.shown.town = null

      //railroads
      if(game.railRoadDeck.length){
        for (let i = 0; i < game.railRoadDeck.length; i++) {
          board.cards.decks.railroads.push(
            this.createCard(
              game.railRoadDeck[i],
              new Vector3(19, 0.94, -2),
              textures[game.railRoadDeck[i].imageLink],
              textures["railroadCover.jpg"],
              cardGeometry
            )
          );
        }
      }
      for (let i = 0; i < 2; i++) {
        game.shownRailRoads[i] ? board.cards.shown.railroads.push(
          this.createCard(
            game.shownRailRoads[i],
            new Vector3(18, 0.94, -2),
            textures[game.shownRailRoads[i].imageLink],
            textures["railroadCover.jpg"],
            cardGeometry
          )
        ) : board.cards.shown.railroads.push(null)
      }

      //buildings
      if(game.buildingDeck.length){
        for (let i = 0; i < game.buildingDeck.length; i++) {
          board.cards.decks.buildings.push(
            this.createCard(
              game.buildingDeck[i],
              new Vector3(18.7, 0.94, -2),
              textures[game.buildingDeck[i].imageLink],
              textures["buildingCover.jpg"],
              buildingGeometry
            )
          );
        }
      }
      for (let i = 0; i < 4; i++) {
        game.shownBuildings[i] ? board.cards.shown.buildings.push(
          this.createCard(
            game.shownBuildings[i],
            new Vector3(18, 0.94, -2),
            textures[game.shownBuildings[i].imageLink],
            textures["buildingCover.jpg"],
            buildingGeometry
          )
        ):board.cards.shown.buildings.push(null)
      }

      //ad actionmanagers
      for (let i = 0; i < 2; i++) {
        if(board.cards.shown.railroads[i]){
          board.cards.shown.railroads[i].actionManager =
            new BABYLON.ActionManager(this.scene);
          board.cards.shown.railroads[i].actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
              BABYLON.ActionManager.OnPickTrigger,
              () => {
                this.handleConfirmQuery("RAILROAD",i);
              }
            )
          );
        }
      }

      for (let i = 0; i < 4; i++) {
        if(board.cards.shown.buildings[i]){
          board.cards.shown.buildings[i].actionManager =
            new BABYLON.ActionManager(this.scene);
          board.cards.shown.buildings[i].actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
              BABYLON.ActionManager.OnPickTrigger,
              () => {
                this.handleConfirmQuery("BUILDING",i);
              }
            )
          );
        }
      }

      board.cards.shown.town.actionManager = new BABYLON.ActionManager(
        this.scene
      );
      board.cards.shown.town.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPickTrigger,
          () => {
            this.handleConfirmQuery("TOWN", null);
          }
        )
      );

      return board;
    },

    moveModel(model, position, rotationAxis, duration, rotationValue) {
      if(!model) {
        let skipBox = BABYLON.MeshBuilder.CreateBox(
          "skipBox",
          {size:.001},
          this.scene
        );
        let skip = new Animation("skip", "position.x", 1, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT)
        const skipFrames = [
          {
            frame:0,
            value:0
          },
          {
            frame:1,
            value:0
          }
        ]
        skip.setKeys(skipFrames)
        skipBox.animations.push(skip)
        return this.scene.beginDirectAnimation(skipBox,[skip], 0, 0 , false)
      }
      const frameRate = 30;
      let positionX = new Animation(
        "positionX",
        "position.x",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      let positionY = new Animation(
        "positionY",
        "position.y",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      let positionZ = new Animation(
        "positionZ",
        "position.z",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      let rotation;
      let rotationFrames = [];
      if (rotationAxis) {
        rotation = new Animation(
          "rotation",
          `rotation.${rotationAxis}`,
          frameRate,
          Animation.ANIMATIONTYPE_FLOAT,
          Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        rotationFrames = [
          {
            frame: 0,
            value: model.rotation[rotationAxis],
          },
          {
            frame: frameRate * duration,
            value: rotationValue,
          },
        ];
        rotation.setKeys(rotationFrames);
        model.animations.push(rotation);
      }

      let xFrames = [
        {
          frame: 0,
          value: model.position.x,
        },
        {
          frame: frameRate * duration,
          value: position.x,
        },
      ];
      let yFrames = [
        {
          frame: 0,
          value: model.position.y,
        },
        {
          frame: (frameRate * duration) / 2,
          value: 1.2,
        },
        {
          frame: frameRate * duration,
          value: position.y,
        },
      ];
      let zFrames = [
        {
          frame: 0,
          value: model.position.z,
        },
        {
          frame: frameRate * duration,
          value: position.z,
        },
      ];

      positionX.setKeys(xFrames);
      positionY.setKeys(yFrames);
      positionZ.setKeys(zFrames);

      model.animations.push(positionX);
      model.animations.push(positionY);
      model.animations.push(positionZ);
      let animation = rotationAxis
        ? this.scene.beginDirectAnimation(
            model,
            [positionX, positionY, positionZ, rotation],
            0,
            frameRate * duration,
            false
          )
        : this.scene.beginDirectAnimation(
            model,
            [positionX, positionY, positionZ],
            0,
            frameRate * duration,
            false
          );
      return animation;
    },

    createCard(card, position, frontTexture, backTexture, cardGeometry) {
      let newCard = cardGeometry.clone(card.imageLink);
      let multi = new BABYLON.MultiMaterial("multi", this.scene);
      let back = new BABYLON.StandardMaterial("front", this.scene);
      let front = new BABYLON.StandardMaterial("front", this.scene);
      front.diffuseTexture = frontTexture;
      back.diffuseTexture = backTexture;
      multi.subMaterials[0] = front;
      multi.subMaterials[1] = back;
      newCard.material = multi;
      newCard.position = position;
      newCard.rotation = new Vector3(Math.PI, Math.PI / 2, -Math.PI);
      return newCard;
    },

    loadTexturesAsync(game) {
      return new Promise((resolve) => {
        let textureUrls = [];
        game.avaiableTown ? textureUrls.push(game.avaiableTown.imageLink): null;
        for (let i = 0; i < game.railRoadDeck.length; i++) {
          game.railRoadDeck[i]?textureUrls.push(game.railRoadDeck[i].imageLink):null
        }
        for (let i = 0; i < game.townDeck.length; i++) {
          game.townDeck[i]?textureUrls.push(game.townDeck[i].imageLink):null;
        }
        for (let i = 0; i < game.buildingDeck.length; i++) {
          game.buildingDeck[i]?textureUrls.push(game.buildingDeck[i].imageLink):null;
        }
        for (let i = 0; i < 4; i++) {
          game.shownBuildings[i]?textureUrls.push(game.shownBuildings[i].imageLink):null;
        }
        let textures = {};
        for (let i = 0; i < textureUrls.length; i++) {
          textures[`${textureUrls[i]}`]
            ? null
            : (textures[`${textureUrls[i]}`] = new BABYLON.Texture(
                textureUrls[i],
                this.scene
              ));
          textures[`${textureUrls[i]}`].uAng = Math.PI;
          textures[`${textureUrls[i]}`].vAng = Math.PI;
        }

        textures["railroadCover.jpg"] = new BABYLON.Texture(
          "railroadCover.jpg",
          this.scene
        );
        textures["buildingCover.jpg"] = new BABYLON.Texture(
          "buildingCover.jpg",
          this.scene
        );
        textures["townCover.jpg"] = new BABYLON.Texture(
          "townCover.jpg",
          this.scene
        );

        this.whenAllReady(textures, () => resolve(textures));
      });
    },

    whenAllReady(textures, resolve) {
      let numRemaining = Object.keys(textures).length;
      for (let texture in textures) {
        if (textures[texture].isReady()) {
          if (--numRemaining === 0) {
            resolve();
            return;
          }
        } else {
          let onLoadObservable = textures[texture].onLoadObservable;
          if (onLoadObservable) {
            onLoadObservable.addOnce(() => {
              if (--numRemaining === 0) {
                resolve();
              }
            });
          }
        }
      }
    },

    async createScene() {
      this.engine = new Engine(this.canvas, true, { stencil: true });
      this.scene = new Scene(this.engine);
      var texture = new BABYLON.Texture(board, this.scene);
      let boardAO = new BABYLON.Texture("board/board_AO.jpg", this.scene);
      let boardPosition = new Vector3(18.4, 0.934, -3.6);
      var boradMaterial = new BABYLON.StandardMaterial("mat", this.scene);
      boradMaterial.ambientTexture = boardAO;
      boradMaterial.normalTexture = new BABYLON.Texture(
        "board/board_NORMAL.jpg",
        this.scene
      );
      this.scene.clearColor = new Color3(1, 1, 1);
      boradMaterial.diffuseTexture = texture;
      this.updateHL(new BABYLON.HighlightLayer("hl1", this.scene))

      let boardFaceUV = new Array(6);
      for (var i = 0; i < 6; i++) {
        if (i === 4) {
          boardFaceUV[i] = new BABYLON.Vector4(1, 0, 0, 1);
        } else {
          boardFaceUV[i] = new BABYLON.Vector4(0, 0, 0, 0);
        }
      }

      let options = {
        width: 1.5,
        depth: 1.5,
        height: 0.01,
        faceUV: boardFaceUV,
        updateable: true,
      };

      let table = await SceneLoader.ImportMeshAsync(
        0,
        "table/table.gltf",
        "",
        this.scene,
        null,
        ".gltf"
      );
      table.meshes[0].position = new Vector3(18.1, -0.4, -3.9);
      table.meshes[0].scaling.setAll(3);

      let cameraPosition = new Vector3(17.7, 3, -2);
      let cameraTarget = new Vector3(17.7, 0.8, -3.6);

      this.camera = new BABYLON.UniversalCamera(
        "camera",
        cameraPosition,
        this.scene,
        true
        );
      this.camera.target = cameraTarget
      this.camera.fov = 0.9;

      this.light = new HemisphericLight(
        "light1",
        new Vector3(18, 100, 100),
        this.scene
      );
      this.light.position = new Vector3(0, 15, 15);
      this.light.intensity = 1.4;
      this.light.diffuse = new Color3(255 / 255, 230 / 255, 190 / 255);

      var babylonBoard = BABYLON.MeshBuilder.CreateBox(
        "babylonBoard",
        options,
        this.scene
      );
      babylonBoard.material = boradMaterial;
      babylonBoard.position = boardPosition;
      babylonBoard.rotation = new Vector3(0, -Math.PI / 2, 0);

      options = {
        width: 30,
        depth: 30,
        height: 0.01,
      };

      const groundTexture = new BABYLON.Texture(
        "grass/grass_DIFFUSE.jpg",
        this.scene
      );
      groundTexture.uScale = 5;
      groundTexture.vScale = 5;

      const aoTexture = new BABYLON.Texture("grass/grass_AO.jpg", this.scene);
      aoTexture.uScale = 5;
      aoTexture.vScale = 5;

      const normalTexture = new BABYLON.Texture(
        "grass/grass_NORMAL.jpg",
        this.scene
      );
      normalTexture.uScale = 5;
      normalTexture.vSclae = 5;

      let ground = BABYLON.MeshBuilder.CreateBox("floor", options, this.scene);
      let groundMaterial = new BABYLON.StandardMaterial(
        "groundMaterial",
        this.scene
      );
      groundMaterial.diffuseTexture = groundTexture;
      groundMaterial.ambientTexture = aoTexture;
      groundMaterial.bumbTexture = normalTexture;
      ground.material = groundMaterial;
      ground.position = new Vector3(18, -2, -3);

      let boardInitial = {
        cards: {
          decks: {
            towns: [],
            railroads: [],
            buildings: [],
          },
          shown: {
            town: {},
            railroads: [],
            buildings: [],
          },
        },
        commodies: {},
      };

      let wheat = await SceneLoader.ImportMeshAsync(
        0,
        "GrainGameBit.stl",
        "",
        this.scene,
        null,
        ".stl"
      );
      let wood = await SceneLoader.ImportMeshAsync(
        0,
        "WoodGameBit.stl",
        "",
        this.scene,
        null,
        ".stl"
      );
      let iron = await SceneLoader.ImportMeshAsync(
        0,
        "IronGameBit.stl",
        "",
        this.scene,
        null,
        ".stl"
      );
      let coal = await SceneLoader.ImportMeshAsync(
        0,
        "CoalGameBit.stl",
        "",
        this.scene,
        null,
        ".stl"
      );
      let goods = await SceneLoader.ImportMeshAsync(
        0,
        "GoodsGameBit.stl",
        "",
        this.scene,
        null,
        ".stl"
      );
      let luxury = await SceneLoader.ImportMeshAsync(
        0,
        "WineGameBit.stl",
        "",
        this.scene,
        null,
        ".stl"
      );

      boardInitial.commodies.wheat = {
        model: wheat.meshes[0],
        side: "left",
      };
      boardInitial.commodies.wood = {
        model: wood.meshes[0],
        side: "left",
      };
      boardInitial.commodies.iron = {
        model: iron.meshes[0],
        side: "left",
      };
      boardInitial.commodies.coal = {
        model: coal.meshes[0],
        side: "left",
      };
      boardInitial.commodies.goods = {
        model: goods.meshes[0],
        side: "left",
      };
      boardInitial.commodies.luxury = {
        model: luxury.meshes[0],
        side: "left",
      };

      //scaling commodies
      boardInitial.commodies.wheat.model.scaling.setAll(0.0025);
      boardInitial.commodies.wood.model.scaling.setAll(0.0022);
      boardInitial.commodies.iron.model.scaling.setAll(0.0022);
      boardInitial.commodies.coal.model.scaling.setAll(0.0021);
      boardInitial.commodies.goods.model.scaling.setAll(0.00175);
      boardInitial.commodies.luxury.model.scaling.setAll(0.0025);

      //materials
      let wheatColor = new BABYLON.StandardMaterial("wine", this.scene);
      wheatColor.diffuseColor = new Color3(199 / 255, 167 / 255, 78 / 255);
      boardInitial.commodies.wheat.model.material = wheatColor;

      let woodColor = new BABYLON.StandardMaterial("wine", this.scene);
      woodColor.diffuseColor = new Color3(102 / 255, 55 / 255, 7 / 255);
      boardInitial.commodies.wood.model.material = woodColor;

      let ironColor = new BABYLON.StandardMaterial("wine", this.scene);
      ironColor.diffuseColor = new Color3(61 / 255, 61 / 255, 61 / 255);
      boardInitial.commodies.iron.model.material = ironColor;

      let coalColor = new BABYLON.StandardMaterial("wine", this.scene);
      coalColor.diffuseColor = new Color3(20 / 255, 20 / 255, 20 / 255);
      boardInitial.commodies.coal.model.material = coalColor;

      let goodsColor = new BABYLON.StandardMaterial("wine", this.scene);
      goodsColor.diffuseColor = new Color3(168 / 255, 20 / 255, 7 / 255);
      boardInitial.commodies.goods.model.material = goodsColor;

      let wineColor = new BABYLON.StandardMaterial("wine", this.scene);
      wineColor.diffuseColor = new Color3(4 / 255, 43 / 255, 2 / 255);
      boardInitial.commodies.luxury.model.material = wineColor;

      //rotations
      boardInitial.commodies.wood.model.rotation = new Vector3(
        -Math.PI / 2,
        0,
        -Math.PI / 2
      );

      //positioning
      boardInitial.commodies.wheat.model.position = new Vector3(
        18.95,
        0.935,
        -3.78
      );
      boardInitial.commodies.wood.model.position = new Vector3(
        18.76,
        0.989,
        -3.81
      );
      boardInitial.commodies.iron.model.position = new Vector3(
        18.543,
        0.935,
        -3.798
      );
      boardInitial.commodies.coal.model.position = new Vector3(
        18.405,
        0.935,
        -3.68
      );
      boardInitial.commodies.goods.model.position = new Vector3(
        18.067,
        0.935,
        -3.745
      );
      boardInitial.commodies.luxury.model.position = new Vector3(
        17.9,
        0.935,
        -3.81
      );

      //selling clicks
      boardInitial.commodies.wheat.model.actionManager =
        new BABYLON.ActionManager(this.scene);
      boardInitial.commodies.wheat.model.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPickTrigger,
          () => {
            this.handleSellStart("wheat");
          }
        )
      );

      boardInitial.commodies.wood.model.actionManager =
        new BABYLON.ActionManager(this.scene);
      boardInitial.commodies.wood.model.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPickTrigger,
          () => {
            this.handleSellStart("wood");
          }
        )
      );

      boardInitial.commodies.iron.model.actionManager =
        new BABYLON.ActionManager(this.scene);
      boardInitial.commodies.iron.model.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPickTrigger,
          () => {
            this.handleSellStart("iron");
          }
        )
      );

      boardInitial.commodies.coal.model.actionManager =
        new BABYLON.ActionManager(this.scene);
      boardInitial.commodies.coal.model.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPickTrigger,
          () => {
            this.handleSellStart("coal");
          }
        )
      );

      boardInitial.commodies.goods.model.actionManager =
        new BABYLON.ActionManager(this.scene);
      boardInitial.commodies.goods.model.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPickTrigger,
          () => {
            this.handleSellStart("goods");
          }
        )
      );

      boardInitial.commodies.luxury.model.actionManager =
        new BABYLON.ActionManager(this.scene);
      boardInitial.commodies.luxury.model.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnPickTrigger,
          () => {
            this.handleSellStart("luxury");
          }
        )
      );

      this.updateBoard(boardInitial);

      this.engine.runRenderLoop(() => {
        this.scene.render();
          setTimeout(()=>{
            this.engine.resize()
          }, .0001)
      });
    },

    //confirm click functions
    handleConfirmQuery(type, payload){
      console.log(type, payload)
      this.updateConfirmQuery({
        bool:true,
        payload: payload,
        type: type
      })

      let railRoadPosition = new Vector3(18.7, 1.99, -3.3);
      let railRoadTarget = new Vector3(18.7, 0.8, -3.43);

      let townPosition = new Vector3(17.9, 1.99, -3.3);
      let townTarget = new Vector3(17.9, 0.8, -3.43);

      let buildingPosition = new Vector3(18.2, 1.97, -2.8);
      let buildingTarget = new Vector3(18.2, 0.8,-3.15);

      const board = this.getBoard()

      switch(type){
        case "BUILDING":
          this.moveCamera(buildingPosition, buildingTarget, this.getGame(), false )
          board.cards.shown.buildings[payload]?this.getHL().addMesh(
          board.cards.shown.buildings[payload],
          new BABYLON.Color3(.9, 0.6, 0.03)
        ):null
          break

        case "TOWN":
          this.moveCamera(townPosition, townTarget, this.getGame(), false )
          board.cards.shown.town? this.getHL().addMesh(board.cards.shown.town, new BABYLON.Color3(.9, 0.6, 0.03)):null
          break 

        case "RAILROAD":
          this.moveCamera(railRoadPosition, railRoadTarget, this.getGame(), false )
          board.cards.shown.railroads[payload]?this.getHL().addMesh(
          board.cards.shown.railroads[payload],
          new BABYLON.Color3(.9, 0.6, 0.03)
        ):null
          break 
      }

    },

    //selling
    handleSellStart(sellingCommodity) {
      let player = this.getPlayer();
      let game = this.getGame();
      this.updateConfirmQuery({bool:false})
      if (
        game.players[game.turnIndex].name === player.name &&
        !player.discarding &&
        !player.isInAuction &&
        !player.pickingProduceItems &&
        !player.selling &&
        !player.buyingTown &&
        !player.buyingBuilding
      ) {
        if (
          player.commodies.filter((commodity) => {
            return commodity.name === sellingCommodity;
          }).length !== 0
        ) {
          player.selling = true;
          game.players[game.turnIndex] = player;
          game.sellingCommodity = sellingCommodity;
          this.updatePlayer(player);
          this.updateGame(game);
        } else {
          this.updateMessage(`You dont have any ${sellingCommodity}`);
        }
      } else {
        this.updateMessage("Cannot Do That Now");
      }
    },
  },
};
</script>

 <style >
canvas {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  color: rgb(242, 205, 184);
  background-color: rgb(32, 16, 3);
}
</style>