<template>
  <div id="app">
    <NavBarMain/>
    <MainWelcome/>
    <MainRendezvousPoints/>
    <MainClients/>
    <MainConnections/>
    <ModalCreateRoom/>
    <ModalCreateClient/>

  </div>
</template>

<script>
import NavBarMain from './components/NavBarMain.vue'
import MainWelcome from './components/MainWelcome.vue'
import MainRendezvousPoints from './components/MainRendezvousPoints.vue'
import MainClients from './components/MainClients.vue'
import MainConnections from './components/MainConnections.vue'
import ModalCreateRoom from './components/ModalCreateRoom.vue'
import ModalCreateClient from './components/ModalCreateClient.vue'

export default {
  name: 'app',
  components: {
    NavBarMain, 
    MainWelcome, 
    MainRendezvousPoints, 
    MainClients, 
    MainConnections, 
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
