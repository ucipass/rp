<template>
  <div>
    <b-navbar toggleable="sm" type="dark" variant="dark">
      <b-navbar-brand v-if='false' href="#">Home</b-navbar-brand>

      <b-navbar-toggle target="nav-collapse" ></b-navbar-toggle>

      <b-collapse size='lg' id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-dropdown left variant="outline-primary" v-if="loggedIn" text='Menu'>
            <b-dropdown-item @click="showMainReadPage()">Read</b-dropdown-item>
            <b-dropdown-item @click="showMainCreatePage()">Create</b-dropdown-item>
            <b-dropdown-item @click="showMainUpdatePage()">Update</b-dropdown-item>
            <b-dropdown-item @click="showMainDeletePage()">Delete</b-dropdown-item>
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
    showMainReadPage(){
      this.$root.$emit('showMainReadPage')
      this.hideMainCreatePage()
      this.hideMainUpdatePage()
      this.hideMainDeletePage()
      console.log("Emit: showMainReadPage")
    },
    hideMainReadPage(){
      this.$root.$emit('hideMainReadPage')
      console.log("Emit: hideMainReadPage")
    },
    showMainCreatePage(){
      this.$root.$emit('showMainCreatePage')
      this.hideMainReadPage()
      this.hideMainUpdatePage()
      this.hideMainDeletePage()
      console.log("Emit: showMainCreatePage")
    },
    hideMainCreatePage(){
      this.$root.$emit('hideMainCreatePage')
      console.log("Emit: hideMainCreatePage")
    },
    showMainUpdatePage(){
      this.$root.$emit('showMainUpdatePage')
      this.hideMainCreatePage()
      this.hideMainReadPage()
      this.hideMainDeletePage()
      console.log("Emit: showMainUpdatePage")
    },
    hideMainUpdatePage(){
      this.$root.$emit('hideMainUpdatePage')
      console.log("Emit: hideMainUpdatePage")
    },
    showMainDeletePage(){
      this.$root.$emit('showMainDeletePage')
      this.hideMainCreatePage()
      this.hideMainUpdatePage()
      this.hideMainReadPage()
      console.log("Emit: showMainDeletePage")
    },
    hideMainDeletePage(){
      this.$root.$emit('hideMainDeletePage')
      console.log("Emit: hideMainDeletePage")
    },
    showLoginWindow(){
      this.$root.$emit('showLoginWindow')
      console.log("Emit: showLoginWindow")
    },
    logout: function(){
      this.$root.$emit('logoutEvent')
      console.log("Emit: Logout Event")
    }
  },
  computed:{
    getjson(){
      return{ prefix:this.prefix,region:this.region}
    }
  },
  mounted: async function () {
    this.loggedIn = true
    this.$root.$on('loginEvent', () => {
        console.log("loginEvent")
        this.loggedIn = true
    })
    this.$root.$on('logoutEvent', () => {
        console.log("logoutEvent")
        this.loggedIn = false
    })




  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
