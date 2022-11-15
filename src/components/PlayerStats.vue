<template>
    <div>
        <div v-if="personalStats" class="stats-container">
            <div class="name-money">
                <div class="money margin">${{player.money}}</div>
                <div class="name margin">{{player.name}}</div>
            </div>
            <div class="cards-container">
                <div class="module commodies">
                    <div  class="tabname">Commodies:</div>
                    <div class="cardholder">
                        <img class="commodity" v-for="(commodity,commodityIndex) in player.commodies" :key="commodityIndex" :src="require(`../../public/assets/commodies/${commodity.imageLink}`)"/>
                    </div>
                </div>
                <div class="module railroads">
                    <div  class="tabname">Rail Roads: </div>
                    <div  class="cardholder">
                        <img class="card" v-for="railroad in player.railroads" :src="railroad.imageLink" :key="railroad.name"/>
                    </div>
                </div>
                <div class="module buildings" > 
                    <div class="tabname">Buildings: </div>
                    <div class="cardholder">
                        <img class="building" v-for="(building, buildingIndex) in player.buildings" :src="building.imageLink" :key="building.name" @click="handleUpgrade(building, buildingIndex)"/>
                    </div>
                </div>
                <div class="module towns" >
                    <div  class="tabname" >Towns: </div>
                    <div class="cardholder">
                        <img class="card" v-for="town in player.towns" :src="town.imageLink" :key="town.imageLink"/>
                    </div>
                </div>
            </div>
            <button class="show-button" @click="updatePersonalStats(false)">Hide Own Cards</button>
        </div>
        <div class = "show-buttons">
            <button v-if="!personalStats && !allStats" class="show-button" @click="updatePersonalStats(true)">Show Own Cards</button>
            <button v-if="!allStats && !personalStats" class="show-button" @click="updateAllStats(true)">Show All Cards</button>
        </div>
        <AllPlayers v-if="allStats"/>
    </div>
</template>

<script>
    import { mapState, mapGetters, mapMutations} from "vuex";
    import AllPlayers from "./AllPlayers.vue";
    export default {
        name: "PlayerStats",
        data (){
            return {
            }
        },
        components:{
            AllPlayers
        },
        computed: {
        ...mapState(["player", "socket", "game", "personalStats", "allStats"]),
        ...mapGetters(["getPlayer", "getSocket", "getGame", "getPersonalStats", "getAllStats"])
        },
        methods: {
            ...mapMutations(["updatePersonalStats", "updateAllStats"]),
            handleUpgrade(building, buildingIndex){
                console.log(building)
                if(!building.upgradable){return}
                console.log("hello")
                let player = this.getPlayer()
                let game = this.getGame()
                let cost = 9
                if(building.price === 6){
                    cost = 15
                }
                if(building.price === 5){
                    cost = 12
                }
                if(player.money >= cost && game.players[game.turnIndex].name === player.name){
                    player.money -= cost
                    building.upgraded = true
                    building.upgradable = false
                    building.imageLink = building.upgradedImageLink
                    player.buildings[buildingIndex] = building
                    game.players[game.turnIndex] = player
                    game.action = "NEXT_TURN"
                    this.getSocket().emit("ACTION", game)
                }
            }
        }
    }
</script>

<style>
    .show-buttons{
        position:absolute;
        bottom: 10px;
        left: 10px;
    }
    .show-button{
        font-size: 1.2em;
        font-family: main;
        background: rgba(43, 17, 17, 0.839);
        border:3px solid rgb(148, 98, 47);
        font-weight: bolder;
        text-decoration: none ;
        color:rgb(167, 142, 119);
        padding: 5px;
        padding-left:10px;
        padding-right:10px;
        border-radius: 20px;
        text-shadow: rgb(0, 0, 0) 2px 2px 2px;
        margin: 15px;
    }
    .cards-container{
        width: 100%;
        display:flex;
        flex-flow:column nowrap;
        justify-content: space-between;
        align-items: stretch;
    }
    .cards-title{
        font-family: main;
        font-size: 1em;
    }
    .stats-container{
        position: absolute;
        bottom: 50px;
        left: 10px;
        display:flex;
        flex-flow:column nowrap;
        justify-content: space-between;
        align-items: space-between;
        padding:10px;
        font-family: main;
        background: rgba(43, 17, 17, 0.607);
        border: 5px solid rgb(148, 98, 47);
        border-radius:10px;
        color:rgb(213, 201, 178);
        margin: 20px;
        max-width: 20%;
    }
    .name-money{
        display:flex;
        flex-flow:row nowrap;
        justify-content: space-between;
        font-family: main;
        font-size: 1.3em;
        color:rgb(213, 201, 178);
    }
    .money{
        margin: 10px;
    }
    .name{margin: 10px;}
    .module{
        font-family: main;
        font-size: 1.3em;
        background: rgba(43, 17, 17, 0.371);
        border: 1px solid rgb(148, 98, 47);
        border-radius:10px;
        color:rgb(213, 201, 178);
        padding: 5px;
        margin: 5px
    }
    @keyframes showcards{
        from{transform:translate(0px, -50px)}
        to{
            transform:translate(0px, -50px)
        }
    }
    .tabname{
        margin: 3px;
    }
    .building{
        width:50px;
        height:50px;
        margin:4px;
        box-shadow: 3px 3px 3px black;
        border-radius: 7px
    }
    .card{
        width:50px;
        height:70px;
        margin:4px;
        box-shadow: 3px 3px 3px black;
        border-radius: 7px
    }
    .commodity{
        width:30px;
        height:30px;
        margin:4px;
    }

    @keyframes large{
        from{transform:scale(1) translate(0);}
        to{transform:scale(2) translate(50px);}
    }

    .module:hover{
        animation: large 1;
        transform:scale(2) translate(50px);
        background: rgb(43, 17, 17);
    }
</style>