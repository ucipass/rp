<template>
  <div id="app">
    <NavBarMain/>
    <MainCreatePage/>
    <MainReadPage/>
    <MainUpdatePage/>
    <MainDeletePage/>
    <ModalCreateRoom/>

  </div>
</template>

<script>
import NavBarMain from './components/NavBarMain.vue'
import MainCreatePage from './components/MainCreatePage.vue'
import MainReadPage from './components/MainReadPage.vue'
import MainUpdatePage from './components/MainUpdatePage.vue'
import MainDeletePage from './components/MainDeletePage.vue'
import ModalCreateRoom from './components/ModalCreateRoom.vue'

export default {
  name: 'app',
  components: {
    NavBarMain,MainCreatePage,MainReadPage,MainUpdatePage,MainDeletePage,ModalCreateRoom
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
