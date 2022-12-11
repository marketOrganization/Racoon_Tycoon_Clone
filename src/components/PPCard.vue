<template>
    <div class="card-container" >
        <div v-if="player.pickingProduceItems">
            <div class="chosing-commodity">
                Choose {{player.productionMax}} commodies to produce.
                <img 
                    class="commodity-small" 
                    v-for="(commodity, commodityIndex) in player.productionCards[player.producingIndex].production" 
                    @click="handleUpdateProducingArray(commodityIndex)" 
                    :src="require(`../../public/assets/commodies/${commodity.imageLink}`)" 
                    :key="commodityIndex"
                />
            </div>
        </div>
        <div v-if="player.discarding">
            <div class="chosing-commodity">
                Choose {{player.commodies.length - player.commodityMax}} commodies to discard:
                <img 
                    class="commodity-small" 
                    v-for="(commodity, commodityIndex) in player.commodies" 
                    @click="handleDiscard(commodityIndex)" 
                    :src="require(`../../public/assets/commodies/${commodity.imageLink}`)" 
                    :key="commodityIndex"
                />
            </div>
        </div>
        <div v-if="player.pickingTownCommodies">
            <div class="chosing-commodity">
                Choose {{game.avaiableTown.anyPrice}} commodies to use:
                <img 
                    class="commodity-small" 
                    v-for="(commodity, commodityIndex) in player.commodies" 
                    @click="handleUseForTown(commodityIndex)" 
                    :src="require(`../../public/assets/commodies/${commodity.imageLink}`)" 
                    :key="commodityIndex"
                />
            </div>
        </div>
        <div v-for="(card,cardIndex) in player.productionCards" :key="cardIndex" class="ppcard" @click="handleProduce(cardIndex)">
            <div class="production-container">
                Production:
                <img 
                    class="commodity-small" 
                    v-for="(commodity, commodityIndex) in card.production" 
                    :key="commodityIndex" 
                    :src="require(`../../public/assets/commodies/${commodity.imageLink}`)" 
                />
            </div>
            <div class="price-container">
                Price:
                <img 
                    class="commodity-small" 
                    v-for="(commodity, commodityIndex) in card.price" 
                    :key="commodityIndex" 
                    :src="require(`../../public/assets/commodies/${commodity.imageLink}`)"
                />
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters, mapMutations, mapState } from "vuex"
export default {
    name: "PPCard",
    computed:{
        ...mapState(["player", "socket", "game"]),
        ...mapGetters(["getPlayer", "getSocket", "getGame"])
    },
    mounted () {

    },
    methods: {
        ...mapMutations(["updatePlayer", "updateSocket", "updateGame", "updateMessage"]),
        handleProduce(index){
            let player = this.getPlayer()
            let game = this.getGame()
            console.log(player.producingArray.length)
            if(
                game.players[game.turnIndex].name === player.name 
                && !player.discarding 
                && !player.isInAuction 
                && player.producingArray.length === 0
                && !player.selling
                && !player.buyingTown
                && !player.buyingBuilding
            ){
                player.pickingProduceItems = true
                player.producingIndex = index
                this.updatePlayer(player)
            }else{
                this.updateMessage("Cannot do that now.")
            }
        },
        handleUpdateProducingArray(index){
            if(this.getGame().players[this.getGame().turnIndex].name === this.getPlayer().name){
                let player = {...this.getPlayer()}
                player.producingArray.push(...player.productionCards[player.producingIndex].production.splice(index,1))
                if(player.producingArray.length === player.productionMax || player.productionCards[player.producingIndex].production.length === 0 ){
                    player.pickingProduceItems = false
                    let game = this.getGame()
                    game.players[game.turnIndex] = player
                    this.updatePlayer(player)
                    game.action = "PRODUCE"
                    game.payload = player.producingIndex
                    this.getSocket().emit("ACTION", game)
                }
            }else{
                this.updateMessage("Not Your Turn")
            }
        },
        handleDiscard(index){
            let player = this.getPlayer()
            player.commodies.splice(index,1)
            this.updatePlayer(player)

            let game = this.getGame()
            game.players[game.turnIndex] = player
            this.updateGame(game)

            if(player.commodies.length === player.commodityMax){
                player.discarding = false
                this.updatePlayer(player)

                let game = this.getGame()
                game.players[game.turnIndex] = player
                this.updateGame(game)

                game.action = "NEXT_TURN"
                this.getSocket().emit("ACTION", game)
            }
        },
        handleUseForTown(index){
            let player = this.getPlayer()
            let game = this.getGame()

            game.townBuyingArray.push(...player.commodies.splice(index,1))
            this.updatePlayer(player)

            game.players[game.turnIndex] = player
            this.updateGame(game)

            if(game.townBuyingArray.length === game.avaiableTown.anyPrice - player.townBonus){
                player.buyingTown = false
                player.pickingTownCommodies = false
                this.updatePlayer(player)

                let game = this.getGame()
                game.players[game.turnIndex] = player
                this.updateGame(game)

                game.action = "BUY_TOWN_ANY"
                this.getSocket().emit("ACTION", game)
            }
        }
    }
}
</script>

<style>
    .ppcard{
        width:120px;
        height:200px;
        margin:10px;
    }
    .production-container{
        color:rgb(167, 142, 119);
        -webkit-text-stroke: 1px rgb(140, 102, 57);
        display:flex;
        flex-flow:row wrap;
        justify-content: space-around;
        align-items: space-around;
        height:50%;
        border:4px solid rgb(45, 23, 0);
        border-radius: 5px 5px 0 0;
        background-color:rgb(27, 29, 42)
    }
    .price-container{
        color:rgb(167, 142, 119);
        -webkit-text-stroke: 1px rgb(130, 95, 53);
        display:flex;
        flex-flow:row wrap;
        justify-content: space-around;
        align-items: space-around;
        height:50%;
        border-bottom:4px solid rgb(45, 23, 0);
        border-right: 4px solid rgb(45, 23, 0);
        border-left:4px solid rgb(45, 23, 0);
        background-color: rgb(69, 31, 31);
        border-radius: 0px 0px 5px 5px;
    }

    .chosing-commodity{
        display: flex;
        flex-flow:row nowrap;
        margin: 20px;
        justify-content: space-between;
        align-items: space-between;
        background: rgba(43, 17, 17, 0.839);
        border:3px solid rgb(148, 98, 47);
        font-size: 2em;
        font-family:main;
        padding: 10px; 
        font-weight: bolder;
        text-decoration: none ;
        color:rgb(167, 142, 119);
        border-radius: 10px;
        max-width: 100%;
    }
    .commodity-small{
        width:30px;
        height:30px;
        margin: 3px
    }
    .card-container {
        position:absolute;
        bottom: 75px;
        right: 10px;
        display: flex;
        flex-flow:row nowrap
    }
</style>