<template>
  <div id="app">
    <NavBarMain/>
    <MainRendezvousPoints/>
    <MainClients/>
    <MainConnections/>
    <ModalCreateRoom/>
    <MainWelcome/>

  </div>
</template>

<script>
import NavBarMain from './components/NavBarMain.vue'
import MainRendezvousPoints from './components/MainRendezvousPoints.vue'
import MainClients from './components/MainClients.vue'
import MainConnections from './components/MainConnections.vue'
import ModalCreateRoom from './components/ModalCreateRoom.vue'
import MainWelcome from './components/MainWelcome.vue'


export default {
  name: 'app',
  components: {
    MainWelcome, NavBarMain, MainRendezvousPoints, MainClients, MainConnections, ModalCreateRoom
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
