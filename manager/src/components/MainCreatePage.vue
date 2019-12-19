<template>
     <b-container fluid v-if='MainCreatePage'>
       <h1>Create</h1>
        <b-row class="justify-content-md-center" v-for='key in data ? Object.keys(data): []' :key='key'>
          <b-col xl='3' lg='3' md='3' >
            {{key}}
          </b-col>
          <b-col xl='3' lg='3' md='3' >
            <b-input v-model='data[key]' @change='testfn()'></b-input>
          </b-col>
        </b-row>
        <b-row class="justify-content-md-center">
          <b-col xl='3' lg='3' md='3' >
            Status:{{status}}
          </b-col>
          <b-col xl='3' lg='3' md='3' >
            <b-button variant='outline-primary' @click="submit()">submit</b-button>
          </b-col>          
        </b-row>
     </b-container>
</template>

<script>
import axios from 'axios';
import {URL} from './constants.js';
console.log(URL)

export default {
  name: 'MainCreatePage',
  components: {
  //  ModalLogin
  },
  props: {
    title: {
      default: "MainCreatePage",
      type: String
    },
    id: {
      default: "MainCreatePage",
      type: String
    }
  },
  data: ()=> { 
    return{
      status : "",
      MainCreatePage: false,
      field1: "field1",
      field2: "field2",
      data: {},
      schema: {}
    }
      
  },
  methods:{
    testfn: async function(){
      console.log("TEST")
    },
    submit: async function(){
      let response = await axios
      .post('http://localhost:3000/create',this.data)
      .catch(error => { console.log("ERROR",error); return null })
      this.status = response.data
      this.data = JSON.parse(JSON.stringify(this.schema))

    }
  },
  computed:{
    getjson(){
      return{ prefix:this.prefix,region:this.region}
    }
  },
  mounted: async function () {
    // GET DB SCHEMA
    let response = await axios
    .post('http://localhost:3000/schema',{})
    .catch(error => console.log("Error reading schema from server",error))   

    this.schema = response.data
    this.data = JSON.parse(JSON.stringify(this.schema))
    
    this.$root.$on('showMainCreatePage', () => {
        this.MainCreatePage = true
        console.log("Event: showMainCreatePage")
    })    
    this.$root.$on('hideMainCreatePage', () => {
        this.MainCreatePage = false
        console.log("Event: hideMainCreatePage")
    })    
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
