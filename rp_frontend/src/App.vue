<template>
  <div id="app">
    <NavBarMain/>
    <MainWelcome/>
    <MainRendezvousPoints/>
    <MainClients/>
    <MainWebclients/>
    <MainConnections/>
    <MainDownload/>
    <ModalCreateRoom/>
    <ModalCreateClient/>
    <MainStatus/>

  </div>
</template>

<script>
import NavBarMain from './components/NavBarMain.vue'
import MainWelcome from './components/MainWelcome.vue'
import MainRendezvousPoints from './components/MainRendezvousPoints.vue'
import MainClients from './components/MainClients.vue'
import MainWebclients from './components/MainWebclients.vue'
import MainConnections from './components/MainConnections.vue'
import MainStatus from './components/MainStatus.vue'
import MainDownload from './components/MainDownload.vue'
import ModalCreateRoom from './components/ModalCreateRoom.vue'
import ModalCreateClient from './components/ModalCreateClient.vue'

export default {
  name: 'app',
  components: {
    NavBarMain, 
    MainWelcome, 
    MainRendezvousPoints, 
    MainClients, 
    MainWebclients, 
    MainConnections, 
    MainStatus,
    MainDownload, 
    ModalCreateRoom,
    ModalCreateClient
  },
  mounted: function(){
  }

}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

@media only screen and (max-width: 992px) and (min-width: 850px) {

    .modal-dialog {
      max-width: 800px; 
    }

}

</style>
