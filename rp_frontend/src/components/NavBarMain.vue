<template>
  <div>
    <b-navbar toggleable="sm" type="dark" variant="dark">
      <b-navbar-brand v-if='false' href="#">Home</b-navbar-brand>

      <b-navbar-toggle target="nav-collapse" ></b-navbar-toggle>

      <b-collapse size='lg' id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-dropdown left variant="outline-primary" v-if="loggedIn" text='Menu'>
            <b-dropdown-item @click="showMainClients()">Rendezvous Clients</b-dropdown-item>
            <b-dropdown-item @click="showMainRendezvousPoints()">Rendezvous Points</b-dropdown-item>
            <b-dropdown-item @click="showMainWebclients()">Web Clients</b-dropdown-item>
            <b-dropdown-item v-if=false @click="showMainConnections()">Connections</b-dropdown-item>
            <b-dropdown-item @click="showMainDownload()">Downloads</b-dropdown-item>
            <b-dropdown-item @click="showMainStatus()">Status</b-dropdown-item>
          </b-dropdown>
        </b-navbar-nav>
        <b-navbar-nav class="ml-auto">
          <b-button variant='outline-primary' v-if='!loggedIn' @click="showLoginWindow()">Login</b-button>
          <b-button variant='outline-success' v-if='loggedIn' @click="logout()">Logout</b-button>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>

    <ModalLogin id='loginModal'></ModalLogin>


  </div>
</template>

<script>
import ModalLogin from './ModalLogin.vue'
import { eventBus, hideMainAll, showMainWelcome } from './events.js'
import { URL_LOGIN, URL_LOGOUT } from './constants.js'
import axios from 'axios';
axios.defaults.withCredentials = true

export default {
  name: 'NavBarMain',
  components: {
   ModalLogin
  },
  props: {
    title: {
      default: "Login",
      type: String
    },
    id: {
      default: "NavBarMain",
      type: String
    }
  },
  data: function(){
    return{
      loggedIn: false
    }
  },
  methods:{
    refresh(){
      axios.get(URL_LOGIN)
      .then(response => {
        let loginSuccess = response.data
        if(loginSuccess){
          this.loggedIn = true
          console.log("NavBarMain: Already Logged in")
        }
        else{
          this.loggedIn = false
          console.log("NavBarMain: Not Logged in")
        }
      })
      .catch((error) => {
        this.loggedIn = false
        this.loginError = "Login app error"
        console.log("NavBarMain: Server Connection error",error)
      })
    },
    showMainRendezvousPoints(){
      eventBus.$emit('showMainRendezvousPoints')
      console.log("NavBarMain: showMainRendezvousPoints")
    },
    showMainWebclients(){
      eventBus.$emit('showMainWebclients')
      console.log("NavBarMain: showMainWebclients")
    },
    showMainClients(){
      eventBus.$emit('showMainClients')
      console.log("NavBarMain: showMainClients")
    },
    showMainConnections(){
      eventBus.$emit('showMainConnections')
      console.log("NavBarMain: showMainConnections")
    },
    showMainStatus(){
      eventBus.$emit('showMainStatus')
      console.log("NavBarMain: showMainStatus")
    },
    showMainDownload(){
      eventBus.$emit('showMainDownload')
      console.log("NavBarMain: showMainDownload")
    },
    showLoginWindow(){
      eventBus.$emit('showLoginWindow')
      console.log("NavBarMain: showLoginWindow")
    },
    logout: function(){
      axios.post(URL_LOGOUT)
      .then(response => {
        let logoutSuccess = response.data
        if(logoutSuccess){
          this.loggedIn = false
          console.log("NavBarMain: Logout success")      
          hideMainAll()
          showMainWelcome()
        }
        else{
          this.loggedIn = false
          console.log("NavBarMain: Logout failed")
        }
      })
      .catch((error) => {
        this.loggedIn = false
        this.loginError = "Logout app error"
        console.log("NavBarMain: Server Connection error",error)
      })
    }
  },
  computed:{
    getjson(){
      return{ prefix:this.prefix,region:this.region}
    }
  },
  mounted: function () {
    eventBus.$on('loginEvent', () => {
        this.loggedIn = true
    })
    eventBus.$on('logoutEvent', () => {
        this.loggedIn = false
    })
    this.refresh()
    console.log("NavBarMain: Mounted")
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
