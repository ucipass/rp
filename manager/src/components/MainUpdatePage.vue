<template>
     <b-container fluid v-if='MainUpdatePage'>
       <h1>Update</h1>
       <b-row class="justify-content-md-center">
         <b-col xl='3' lg='3' md='3' >
           Select a record
         </b-col>
         <b-col xl='3' lg='3' md='3' >
            <b-form-select v-model="optionPicked" :options="options"></b-form-select>
         </b-col>
       </b-row> 
        <b-row class="justify-content-md-center" v-for='key in data[optionPicked] ? Object.keys(data[optionPicked]): []' :key='key'>
          <b-col xl='3' lg='3' md='3' >
            {{key}}
          </b-col>
          <b-col xl='3' lg='3' md='3' >
            <b-input v-model='data[optionPicked][key]' @change='testfn()'></b-input>
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

export default {
  name: 'MainUpdatePage',
  components: {
  //  ModalLogin
  },
  props: {
    title: {
      default: "MainUpdatePage",
      type: String
    },
    id: {
      default: "MainUpdatePage",
      type: String
    }
  },
  data: ()=> { 
    return{
      MainUpdatePage: false,
      status: "",
      optionPicked: 0, 
      options : [{ value: 0, text: "No response from database" }],
      data: [{}]
    }
  },
  methods:{
    testfn: async function(){
      console.log("TEST")
    },
    submit: async function(){
      let response = await axios
      .post('http://localhost:3000/update',this.data[this.optionPicked])
      .catch(error => console.log("ERROR",error))
      this.$root.$emit('showMainUpdatePage')
      this.status = response.data
    },
    refresh: async function(){
      // GET DB Data
      this.status = ""
      let response = await axios
      .post('http://localhost:3000/read',{})
      .catch(error => console.log("Error reading data from server",error))   

      this.schema = response.data
      this.data = JSON.parse(JSON.stringify(this.schema))

      if(this.data.length){
        this.options =  this.data.map( (item,index)=> {return { value: index, text: item.name }} )
      }else{
        this.options = [{ value: 0, text: "No data present" }]
      }
    }
  },
  computed:{
    record(){
      return{ prefix:this.prefix,region:this.region}
    }
  },
  mounted: async function () {

    this.$root.$on('showMainUpdatePage', () => {
        this.MainUpdatePage = true
        console.log("Event: showMainUpdatePage")
        this.refresh()
    })    
    this.$root.$on('hideMainUpdatePage', () => {
        this.MainUpdatePage = false
        console.log("Event: hideMainUpdatePage")
    })    
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
