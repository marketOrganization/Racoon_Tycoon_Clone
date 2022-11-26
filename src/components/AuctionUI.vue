<template>
    <div>
        <form class = "auction-container" v-if="player.currBidder"  @submit="handleAuctionRound">
            <div class="auction-words">Your Turn To Bid!</div>
            <img :src="game.shownRailRoads[game.auctionCardIndex].imageLink" class="auction-image"/>
            <input class="input-form" v-model="bidValueInput" placeholder="Bid Value..."/>
            <div class="row">
                <button class="button-auction" type="submit">Bid</button>
                <button class="button-auction" @click="handleDropOutAuction">Out</button>
            </div>
            <div class="auction-words">Must Bid Higher Than: {{game.bid}}</div>
        </form>
    </div>
</template>

<script>
    import { mapState, mapGetters, mapMutations } from 'vuex'
    import { ref } from 'vue'
    const bidValueInput = ref('')
    export default {
        name: "AuctionUI",
        components:{
            
        },
        data () {
            return {
                bidValueInput:bidValueInput
            }
        },
        computed:{
            ...mapState(["game", "player", "socket", "message", "confirmQuery"]),
            ...mapGetters(["getGame", "getSocket"])
        },
        methods:{
            ...mapMutations(["updateMessage"]),
            handleAuctionRound(e){
                e.preventDefault()
                let game = this.getGame()
                if(parseInt(this.bidValueInput) <= game.players[game.turnIndex].money){
                    game.payload = parseInt(this.bidValueInput)
                    game.action = "AUCTION_ROUND"
                    this.getSocket().emit("ACTION", game)
                    this.bidValueInput = ""
                }else{
                    this.updateMessage("Invalid Bid")
                }
            },
            handleDropOutAuction(e){
                e.preventDefault()
                let game = this.getGame()
                game.action = "AUCTION_OUT"
                game.messageFeed.push(`${game.players[game.auctionIndex].name} dropped out of the bid.`)
                this.getSocket().emit("ACTION", game)
            }
        }
    }
</script>

<style >
    .auction-container{
        position:absolute;
        bottom: 20vh;
        left: 35vw;
        width:30vw;
        padding-left: 2%;
        padding-right: 2%;
        display: flex;
        flex-flow:column nowrap;
        justify-content: center;
        align-items: center;
        border-radius:50px;
        background: rgba(43, 17, 17, 0.839);
        border:3px solid rgb(148, 98, 47);
    }

    .button-auction{
        font-size: 1.5em;
        font-family:main;
        background: none;
        border:2px solid rgb(148, 98, 47);
        font-weight: bolder;
        text-decoration: none ;
        color:rgb(167, 142, 119);
        padding: 10px;
        padding-left:25px;
        padding-right:25px;
        margin: 10px;
        border-radius: 20px;
        align-self: center;
        box-shadow: 1px 2px 5px black;
    }
    .auction-image{
        width: 50%;
        border-radius:10px;
        box-shadow:10px 10px 10px black
    }
    .button-auction:hover{
        box-shadow: 5px 5px 10px black;
    }
    .row{
        display: flex;
        flex-flow:row nowrap;
    }
    .auction-words{
        font-size: 1.75em;
        font-family:main;
        background: none;
        border:none;
        font-weight: bolder;
        text-decoration: none ;
        color:rgb(167, 142, 119);
        text-shadow: rgb(0, 0, 0) 2px 2px 2px;
    }
</style>