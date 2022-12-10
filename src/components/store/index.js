import Vuex from "vuex"

export default Vuex.createStore({
  state () {
    return {
      game: null,
      name: '',
      player: {},
      socket: {},
      gameCanStart: false,
      message:null,
      gameRunning: false,
      board: {},
      confirmQuery: {bool:false},
      gameOver: false,
      allStats: false,
      personalStats: false,
      audio:{},
      HL: null
    }
  },
  mutations: {
    updateGame(state, payload){
      state.game = payload
    },
    updateHL(state, payload){
      state.HL = payload
    },
    updateConfirmQuery(state, payload){
      state.confirmQuery = payload
    },
    updateName(state, payload){
      state.name = payload
    },
    updatePlayer(state, payload){
      state.player = payload
    },
    updateSocket(state, payload){
      state.socket = payload
    },
    updateGameCanStart(state, payload){
      state.gameCanStart = payload
    },
    updateMessage(state, payload) {
      state.message = payload
    },
    updateGameRunning(state, payload){
      state.gameRunning = payload
    },
    updateBoard(state, payload){
      state.board = payload
    },
    updateGameOver(state, payload){
      state.gameOver = payload
    },
    updatePersonalStats(state, payload){
      state.personalStats = payload
    },
    updateAllStats(state, payload){
      state.allStats = payload
    },
    updateAudio(state, payload){
      state.audio = payload
    }

  },
  getters: {
    getGame: (state) => () => {
      return state.game
    },
    getHL: (state) =>() => {
      return state.HL
    },
    getPlayer: (state) => () => {
      return state.player
    },
    getSocket: (state) => () => {
      return state.socket
    },
    getMessage:(state) => () => {
      return state.message
    },
    getGameRunning: (state) => () => {
      return state.gameRunning
    },
    getBoard: (state) => () => {
      return state.board
    },
    getGameOver: (state) => () => {
      return state.gameOver
    },
    getPersonalStats: (state) => () => {
      return state.personalStats
    },
    getAllStats: (state) => () => {
      return state.allStats
    },
    getAudio: (state) => () => {
      return state.audio
    },
    getConfirmQuery: (state) => () =>  {
      return state.confirmQuery
    }
  }
})