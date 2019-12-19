<template>
     <b-container fluid v-if='showMainReadPage'>
        <h1>Read</h1>
        <!-- <b-row class="justify-content-md-center" >
          <b-col xl='3' lg='3' md='3' v-for='key in db[0] ? Object.keys(db[0]): []' :key='key'>
            {{key}}
          </b-col>
        </b-row>
        <b-row class="justify-content-md-center" v-for="item in db" v-bind:key="item.room">
          <b-col xl='3' lg='3' md='3'>
            <b-input v-model='item.room' @change='testfn()'></b-input>
          </b-col>
          <b-col xl='3' lg='3' md='3'>
            <b-input v-model='item.srcPort' @change='testfn()'></b-input>
          </b-col>
          <b-col xl='3' lg='3' md='3'>
            <b-input v-model='item.dstPort' @change='testfn()'></b-input>
          </b-col>
        </b-row> -->
        <b-table striped hover :items="db"></b-table>
     </b-container>
</template>

<script>
import axios from 'axios';

export default {
  name: 'MainReadPage',
  components: {
  //  ModalLogin
  },
  props: {
    title: {
      default: "MainReadPage",
      type: String
    },
    id: {
      default: "MainReadPage",
      type: String
    }
  },
  data: ()=> { 
    return{
      showMainReadPage: false,
      field1: "field1",
      field2: "field2",
      receivedData:[],
      schema: {}
    } 
  },
  methods:{
    testfn: async function(){
      console.log("TEST")
    }
  },
  computed:{
    getjson(){
      return{ prefix:this.prefix,region:this.region}
    },
    db(){
      if (this.receivedData.length) return this.receivedData
      else return [this.schema]
    }
  },
  mounted: async function () {
    // Download the schema from the server
    let _this = this
    await axios
    .post('http://localhost:3000/schema',{})
    .then(response => {
      console.log("SUCCES",response)
      _this.schema = response.data
    })
    .catch(error => console.log("Error reading schema from server",error))   

    this.$root.$on('showMainReadPage', () => {
      this.showMainReadPage = true
      axios
      .post('http://localhost:3000/read',{})
      .then(response => {
        console.log("SUCCES",response)
        this.receivedData = response.data
      })
      .catch(error => console.log("ERROR",error))      
      console.log("Event: showMainReadPage")
    })    
    this.$root.$on('hideMainReadPage', () => {
        this.showMainReadPage = false
        console.log("Event: hideMainReadPage")
    })    

  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
