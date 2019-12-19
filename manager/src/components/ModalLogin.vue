<template>
  <div>
    <b-modal :id="id" class="text-center" :title="title">
        <b-container>
          <b-row align-h="center">
            <b-col class="col-4 text-right"><label for="accessKeyId" class="m-0" >accessKeyId</label></b-col>
            <b-col><b-input v-model='accessKeyId' id='accessKeyId'></b-input></b-col>
          </b-row>
          <b-row align-h="center">
            <b-col class="col-4 text-right"><label for="secretAccessKey" class="m-0" >secretAccessKey</label></b-col>
            <b-col><b-input type="password" v-model='secretAccessKey' id='secretAccessKey'></b-input></b-col>
          </b-row>
        </b-container>
        <div slot="modal-footer" class="w-100">
          <p class="float-left text-danger">{{loginError}}</p>
          <p class="float-left"></p>
          <b-button variant="primary" size="sm" class="float-right" @click="login">Login</b-button>
        </div>
    </b-modal>
  </div>
</template>

<script>
import { getCookie, setCookie } from '@/components/cookies.js'

export default {
  name: 'ModalLogin',
  props: {
    title: {
      default: "Login",
      type: String
    },
    id: {
      default: "ModalLoginId",
      type: String
    }
  },
  data: function(){
    return{
      accessKeyId: '',
      secretAccessKey: '',
      loggedIn: false,
      loginError: ""
    }
  },
  methods:{
    show: function(){
      this.accessKeyId = getCookie("accessKeyId")
      this.secretAccessKey = getCookie("secretAccessKey")
      this.loginError = ""
      this.$bvModal.show(this.id)
    },
    hide: function(){
      this.$bvModal.hide(this.id)
    },
    login: async function(){
      this.loginError = ""
      try {
        setCookie("accessKeyId",this.accessKeyId, 7)
        setCookie("secretAccessKey", this.secretAccessKey, 7)
        this.loggedIn = true
        this.$root.$emit('loginEvent')
        this.hide()
      } catch (error) {
        this.loginError = error.toString()
        this.loggedIn = false
        this.$root.$emit('logoutEvent')
      }
    }
  },
  mounted: function () {
    this.$root.$on('showLoginWindow', () => {
        // console.log("Generator", event)
        this.show()
    })
    if(! this.$root.settings) this.$root.settings = {}
    this.accessKeyId = getCookie("accessKeyId")
    this.secretAccessKey = getCookie("secretAccessKey")
    if ( this.accessKeyId && this.secretAccessKey) this.login()
  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
