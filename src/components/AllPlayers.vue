<template>
    <div class="players-container">
        <div  v-for="player in game.players" :key="player.name" class="stats-container-all">
            
            <div class="name-money">
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
        <button class="show-button" @click="updateAllStats(false)">Hide All Cards</button>
        </div>
    </div>
</template>

<script>
    import { mapState, mapGetters, mapMutations } from "vuex";
    export default {
        name: "AllPlayers",
        data (){
            return {
            }
        },
        computed: {
        ...mapState(["socket", "game"]),
        ...mapGetters(["getSocket", "getGame", ])
        },
        methods: {
           ...mapMutations(["updateAllStats"])
        }
    }
</script>

<style>
    .players-container{
        display: flex;
        flex-flow: row wrap;
        position: absolute;
        bottom: 50px;
        left: 10px;
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
    .stats-container-all{
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
</style>