<template>
  <div id="app">
    <NavBarMain/>
    <MainRendezvousPoints/>
    <MainConnectedClients/>
    <ModalCreateRoom/>

  </div>
</template>

<script>
import NavBarMain from './components/NavBarMain.vue'
import MainRendezvousPoints from './components/MainRendezvousPoints.vue'
import MainConnectedClients from './components/MainConnectedClients.vue'
import ModalCreateRoom from './components/ModalCreateRoom.vue'

export default {
  name: 'app',
  components: {
    NavBarMain, MainRendezvousPoints, MainConnectedClients, ModalCreateRoom
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
